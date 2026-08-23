import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { executeDatabaseBatch, getDb } from '@/db'
import { teamMembers } from '@/db/schema/team_members'
import { teamMemberServicesVagaro } from '@/db/schema/team_member_services_vagaro'
import { vagaroServiceCategories } from '@/db/schema/vagaro_service_categories'
import { eq, asc, inArray } from 'drizzle-orm'
import { requireAdminApi } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'
import { parseTeamPresentationUpdates } from '@/lib/admin/team-presentation'

export const dynamic = 'force-dynamic'

function sortServiceTags(tags: string[], rank: Map<string, number>): string[] {
  return [...tags].sort((a, b) => (rank.get(a) ?? 9999) - (rank.get(b) ?? 9999) || a.localeCompare(b))
}

// GET - Fetch all team members (including inactive) with derived service categories.
// Vagaro-mode rows read tags from team_member_services_vagaro; external-mode rows
// read them from external_service_categories. No merging between the two.
export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  try {
    const db = getDb()

    const members = await db
      .select()
      .from(teamMembers)
      .orderBy(asc(teamMembers.displayOrder))

    const memberIds = members.map(m => m.id)
    const [vagaroMappings, vagaroCategoryConfig] = await Promise.all([
      memberIds.length > 0
        ? db
          .select({
            teamMemberId: teamMemberServicesVagaro.teamMemberId,
            vagaroCategoryId: teamMemberServicesVagaro.vagaroCategoryId,
          })
          .from(teamMemberServicesVagaro)
          .where(inArray(teamMemberServicesVagaro.teamMemberId, memberIds))
        : Promise.resolve([]),
      db.select({
        vagaroCategoryId: vagaroServiceCategories.vagaroCategoryId,
        title: vagaroServiceCategories.title,
        teamLabel: vagaroServiceCategories.teamLabel,
        teamDisplayOrder: vagaroServiceCategories.teamDisplayOrder,
        displayOrder: vagaroServiceCategories.displayOrder,
        showOnTeam: vagaroServiceCategories.showOnTeam,
      })
        .from(vagaroServiceCategories)
        .where(eq(vagaroServiceCategories.isActive, true)),
    ])

    const categoryByExternalId = new Map(
      vagaroCategoryConfig.map(category => [category.vagaroCategoryId, category]),
    )
    const tagRank = new Map<string, number>()
    for (const category of vagaroCategoryConfig) {
      if (category.showOnTeam) {
        tagRank.set(
          category.teamLabel || category.title,
          category.teamDisplayOrder ?? category.displayOrder * 10,
        )
      }
    }
    tagRank.set('Injectables', 80)

    // Group vagaroMappings by member into ordered tag-label lists (dedupe,
    // first-seen wins).
    const vagaroTagsByMember = new Map<string, string[]>()
    for (const mapping of vagaroMappings) {
      const category = mapping.vagaroCategoryId
        ? categoryByExternalId.get(mapping.vagaroCategoryId)
        : undefined
      if (!category?.showOnTeam) continue
      const tag = category.teamLabel || category.title
      const list = vagaroTagsByMember.get(mapping.teamMemberId) ?? []
      if (!list.includes(tag)) list.push(tag)
      vagaroTagsByMember.set(mapping.teamMemberId, list)
    }

    const membersWithCategories = members.map((member) => {
      const vagaroCategories = member.usesLashpopBooking
        ? sortServiceTags(vagaroTagsByMember.get(member.id) ?? [], tagRank)
        : []
      const externalCategories = !member.usesLashpopBooking
        ? sortServiceTags((member.externalServiceCategories as string[] | null) ?? [], tagRank)
        : []

      return {
        ...member,
        // Camel-case names mirroring the dual-mode split. The admin UI uses
        // these to decide which chips to show as locked vs. editable.
        vagaroServiceCategories: vagaroCategories,
        externalServiceCategories: externalCategories,
      }
    })

    return NextResponse.json({
      members: membersWithCategories
    })
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}

// PUT - Update admin-owned website publication and order. isActive remains
// source/sync-owned and must never be used as the editorial visibility toggle.
//
// The whole payload is validated before anything is written, and the row
// updates plus the audit row commit together in one D1 batch. A rejected
// payload changes nothing; an accepted one can't half-land.
export async function PUT(request: NextRequest) {
  const auth = await requireAdminApi(['owner', 'publisher'])
  if (auth instanceof NextResponse) return auth

  try {
    const db = getDb()
    const parsed = parseTeamPresentationUpdates(await request.json())

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { updates } = parsed
    if (updates.length === 0) {
      return NextResponse.json({ success: true, updated: 0 })
    }

    const updateIds = updates.map(update => update.id)
    const before = await db.select().from(teamMembers).where(inArray(teamMembers.id, updateIds))

    const knownIds = new Set(before.map(row => row.id))
    const missing = updateIds.filter(id => !knownIds.has(id))
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Unknown team member id(s): ${missing.join(', ')}` },
        { status: 404 }
      )
    }

    const now = Date.now()
    const beforeById = new Map(before.map(row => [row.id, row]))
    const publicationReason = parsed.reason ?? 'Changed in the admin team panel'
    const after = before.map(row => {
      const update = updates.find(candidate => candidate.id === row.id)!
      const flipped = update.showOnWebsite !== row.showOnWebsite
      return {
        ...row,
        showOnWebsite: update.showOnWebsite,
        displayOrder: String(update.displayOrder),
        ...(flipped
          ? {
              showOnWebsiteReason: publicationReason,
              showOnWebsiteActor: auth.userId,
              showOnWebsiteChangedAt: new Date(now),
            }
          : {}),
      }
    })

    await executeDatabaseBatch([
      ...updates.map(update => {
        // Only a real publication change rewrites provenance. A pure reorder
        // must not overwrite the reason someone is hidden.
        const flipped = update.showOnWebsite !== beforeById.get(update.id)?.showOnWebsite
        return flipped
          ? {
              sql: `UPDATE team_members
                    SET show_on_website = ?, display_order = ?, updated_at = ?,
                        show_on_website_reason = ?, show_on_website_actor = ?, show_on_website_changed_at = ?
                    WHERE id = ?`,
              params: [
                update.showOnWebsite,
                String(update.displayOrder),
                now,
                publicationReason,
                auth.userId,
                now,
                update.id,
              ],
              method: 'run' as const,
            }
          : {
              sql: 'UPDATE team_members SET show_on_website = ?, display_order = ?, updated_at = ? WHERE id = ?',
              params: [update.showOnWebsite, String(update.displayOrder), now, update.id],
              method: 'run' as const,
            }
      }),
      {
        sql: `INSERT INTO admin_audit_log
              (id, actor_user_id, surface, action, target_type, target_id, diff, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          randomUUID(),
          auth.userId,
          'admin',
          'team.presentation.bulk-update',
          'team_members',
          'bulk',
          JSON.stringify({ before, after, reason: parsed.reason }),
          now,
        ],
        method: 'run' as const,
      },
    ])

    return NextResponse.json({ success: true, updated: updates.length })
  } catch (error) {
    console.error('Error updating team members:', error)
    return NextResponse.json(
      { error: 'Failed to update team members' },
      { status: 500 }
    )
  }
}

// PATCH - Update a single team member's local-owned fields. Vagaro-mode rows
// (usesLashpopBooking=true) reject writes to image/bio/categories because the
// sync owns those fields; only external-mode rows can edit them here.
export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApi(['owner', 'publisher'])
  if (auth instanceof NextResponse) return auth

  try {
    const db = getDb()
    const body = await request.json()
    const { memberId, externalServiceCategories, bio, funFact, credentials, imageUrl } = body

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    // Load the row to enforce the dual-mode write gate before applying changes.
    const [member] = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.id, memberId))
      .limit(1)

    if (!member) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    const usesLashpop = member.usesLashpopBooking
    const gatedFields = ['externalServiceCategories', 'bio', 'imageUrl']
    const attemptedGated = gatedFields.filter(f => body[f] !== undefined)
    if (usesLashpop && attemptedGated.length > 0) {
      return NextResponse.json(
        {
          error: 'Vagaro-synced stylists cannot edit imageUrl, bio, or service categories. ' +
                 'Switch usesLashpopBooking=false (in DB) to take this stylist off Vagaro sync first.',
          rejectedFields: attemptedGated,
        },
        { status: 409 }
      )
    }

    // Build update object dynamically based on what was provided
    const updateData: Record<string, any> = {
      updatedAt: new Date()
    }

    if (externalServiceCategories !== undefined) {
      if (!Array.isArray(externalServiceCategories)) {
        return NextResponse.json(
          { error: 'externalServiceCategories must be an array' },
          { status: 400 }
        )
      }
      updateData.externalServiceCategories = externalServiceCategories
    }

    if (bio !== undefined) {
      updateData.bio = bio
    }

    if (funFact !== undefined) {
      updateData.funFact = funFact
    }

    // Handle credentials (for SEO structured data). Allowed for either mode —
    // credentials are local-only metadata, not synced from Vagaro.
    if (credentials !== undefined) {
      if (!Array.isArray(credentials)) {
        return NextResponse.json(
          { error: 'credentials must be an array' },
          { status: 400 }
        )
      }
      updateData.credentials = credentials
    }

    // Handle imageUrl (from DAM)
    if (imageUrl !== undefined) {
      if (typeof imageUrl !== 'string') {
        return NextResponse.json(
          { error: 'imageUrl must be a string' },
          { status: 400 }
        )
      }
      updateData.imageUrl = imageUrl
    }

    const [after] = await db
      .update(teamMembers)
      .set(updateData)
      .where(eq(teamMembers.id, memberId))
      .returning()

    await recordAdminAction({
      action: 'team.member.update', targetType: 'team_member', targetId: memberId,
      actorUserId: auth.userId, diff: { before: member, after },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    )
  }
}
