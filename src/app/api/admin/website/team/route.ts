import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { teamMembers } from '@/db/schema/team_members'
import { teamMemberServicesVagaro } from '@/db/schema/team_member_services_vagaro'
import { eq, asc, inArray } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// Map Vagaro parent-category title → frontend tag labels. Mirrors
// vagaroParentToTags() in src/actions/team.ts so the admin preview shows the
// same chip strings the public team section will render.
function vagaroParentToTags(parentTitle: string | null | undefined): string[] {
  const p = (parentTitle ?? '').toLowerCase().trim()
  if (!p) return []
  if (p.includes('lash extension')) return ['Lashes']
  if (p.includes('lash lift')) return ['Lash Lifts', 'Lashes']
  if (p.includes('brow')) return ['Brows']
  if (p.includes('permanent makeup') || p.includes('microblading') || p.includes('nanobrow')) return ['Permanent Makeup']
  if (p.includes('skin care') || p.includes('skincare') || p.includes('facial')) return ['Skin Care']
  if (p.includes('permanent jewelry') || p.includes('perm jewelry')) return ['Permanent Jewelry']
  if (p.includes('fine line tattoo')) return ['Fine Line Tattoos']
  if (p.includes('wax')) return ['Waxing']
  return []
}

// GET - Fetch all team members (including inactive) with derived service categories.
// Vagaro-mode rows read tags from team_member_services_vagaro; external-mode rows
// read them from external_service_categories. No merging between the two.
export async function GET() {
  try {
    const db = getDb()

    const members = await db
      .select()
      .from(teamMembers)
      .orderBy(asc(teamMembers.displayOrder))

    const memberIds = members.map(m => m.id)
    const vagaroMappings = memberIds.length > 0
      ? await db
          .select({
            teamMemberId: teamMemberServicesVagaro.teamMemberId,
            vagaroParentTitle: teamMemberServicesVagaro.vagaroParentTitle,
          })
          .from(teamMemberServicesVagaro)
          .where(inArray(teamMemberServicesVagaro.teamMemberId, memberIds))
      : []

    // Group vagaroMappings by member into ordered tag-label lists (dedupe,
    // first-seen wins).
    const vagaroTagsByMember = new Map<string, string[]>()
    for (const mapping of vagaroMappings) {
      const tags = vagaroParentToTags(mapping.vagaroParentTitle)
      if (tags.length === 0) continue
      const list = vagaroTagsByMember.get(mapping.teamMemberId) ?? []
      for (const tag of tags) {
        if (!list.includes(tag)) list.push(tag)
      }
      vagaroTagsByMember.set(mapping.teamMemberId, list)
    }

    const membersWithCategories = members.map((member) => {
      const vagaroCategories = member.usesLashpopBooking
        ? (vagaroTagsByMember.get(member.id) ?? [])
        : []
      const externalCategories = !member.usesLashpopBooking
        ? ((member.externalServiceCategories as string[] | null) ?? [])
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

// PUT - Update team member visibility and order
export async function PUT(request: NextRequest) {
  try {
    const db = getDb()
    const { updates } = await request.json()

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Update each member's isActive and displayOrder
    for (const update of updates) {
      if (!update.id) continue

      await db
        .update(teamMembers)
        .set({
          isActive: update.isActive,
          displayOrder: update.displayOrder,
          updatedAt: new Date()
        })
        .where(eq(teamMembers.id, update.id))
    }

    return NextResponse.json({ success: true })
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
      .select({
        id: teamMembers.id,
        usesLashpopBooking: teamMembers.usesLashpopBooking,
      })
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

    await db
      .update(teamMembers)
      .set(updateData)
      .where(eq(teamMembers.id, memberId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    )
  }
}
