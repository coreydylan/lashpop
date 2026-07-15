"use server"

import { getDb } from "@/db"
import { teamMembers } from "@/db/schema/team_members"
import { teamQuickFacts } from "@/db/schema/team_quick_facts"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { teamMemberServicesVagaro } from "@/db/schema/team_member_services_vagaro"
import { services } from "@/db/schema/services"
import { and, eq, inArray, isNotNull, asc, sql } from "drizzle-orm"

// Keep specialty chips stable across syncs. Fine Line Tattoos leads for the
// artists who offer it so the new, uncommon service is visible without a
// horizontal swipe; the remaining categories follow the public-site order.
const SERVICE_TAG_ORDER = [
  'Fine Line Tattoos',
  'Lashes',
  'Lash Lifts',
  'Brows',
  'Skin Care',
  'Waxing',
  'Permanent Makeup',
  'Permanent Jewelry',
  'Injectables',
] as const

function sortServiceTags(tags: string[]): string[] {
  const rank = new Map<string, number>(SERVICE_TAG_ORDER.map((tag, index) => [tag, index]))
  return [...tags].sort((a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999) || a.localeCompare(b))
}

export async function getTeamMembers() {
  const db = getDb()

  const members = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.isActive, true))
    .orderBy(teamMembers.displayOrder)

  return members
}

/**
 * Get raw Vagaro parent titles for a team member from the canonical mapping
 * table populated by the worker. Used for diagnostics / scripts; the live
 * team-section render path uses getTeamMembersWithServices() which has
 * batched all members in one query.
 */
export async function getServicesForTeamMember(teamMemberId: string | null): Promise<string[]> {
  if (!teamMemberId) return []

  const db = getDb()

  const rows = await db
    .selectDistinct({ parentTitle: teamMemberServicesVagaro.vagaroParentTitle })
    .from(teamMemberServicesVagaro)
    .where(eq(teamMemberServicesVagaro.teamMemberId, teamMemberId))

  return rows
    .map(r => r.parentTitle)
    .filter((t): t is string => !!t)
}

/**
 * Get quick facts for a team member
 */
export async function getQuickFactsForMember(memberId: string) {
  const db = getDb()

  const facts = await db
    .select()
    .from(teamQuickFacts)
    .where(eq(teamQuickFacts.teamMemberId, memberId))
    .orderBy(asc(teamQuickFacts.displayOrder))

  return facts
}

/**
 * Get team members with their service categories.
 *
 * Tags are routed by the dual-mode flag:
 *   - usesLashpopBooking=true  → derived from team_member_services_vagaro
 *     (populated by the vagaro-sync worker, one row per stylist×service)
 *   - usesLashpopBooking=false → read straight from
 *     team_members.external_service_categories (admin-entered)
 *
 * No merge between the two branches. No fallback. A Vagaro stylist with no
 * mapped services renders zero tags; an external stylist with no categories
 * set renders zero tags. The boolean is the authority.
 */
export async function getTeamMembersWithServices() {
  const db = getDb()

  // Run all initial queries in parallel for better performance
  const [members, vagaroMappings] = await Promise.all([
    db.select()
      .from(teamMembers)
      .where(eq(teamMembers.isActive, true))
      // displayOrder is TEXT — cast to int so "2" < "10". Vagaro sends EmployeeSortOrder as a number.
      .orderBy(sql`CAST(${teamMembers.displayOrder} AS INTEGER) ASC NULLS LAST`),
    // One batched query for every (active stylist → vagaroParentTitle) pair,
    // grouped in memory below. Vagaro stylists only — external rows have no
    // entries here by construction.
    db.select({
      teamMemberId: teamMemberServicesVagaro.teamMemberId,
      vagaroParentTitle: teamMemberServicesVagaro.vagaroParentTitle,
    }).from(teamMemberServicesVagaro)
  ])

  const memberIds = members.map(m => m.id)

  // Define types for the query results
  type QuickFact = typeof teamQuickFacts.$inferSelect
  type PhotoCrop = {
    teamMemberId: string
    cropSquareUrl: string | null
    cropCloseUpCircleUrl: string | null
    cropMediumCircleUrl: string | null
    cropFullVerticalUrl: string | null
  }

  // Fetch quick facts and photos in parallel
  const [allQuickFacts, primaryPhotos] = await Promise.all([
    memberIds.length > 0
      ? db.select()
          .from(teamQuickFacts)
          .where(inArray(teamQuickFacts.teamMemberId, memberIds))
          .orderBy(asc(teamQuickFacts.displayOrder))
      : Promise.resolve([] as QuickFact[]),
    memberIds.length > 0
      ? db.select({
          teamMemberId: teamMemberPhotos.teamMemberId,
          cropSquareUrl: teamMemberPhotos.cropSquareUrl,
          cropCloseUpCircleUrl: teamMemberPhotos.cropCloseUpCircleUrl,
          cropMediumCircleUrl: teamMemberPhotos.cropMediumCircleUrl,
          cropFullVerticalUrl: teamMemberPhotos.cropFullVerticalUrl,
        })
        .from(teamMemberPhotos)
        .where(
          and(
            inArray(teamMemberPhotos.teamMemberId, memberIds),
            eq(teamMemberPhotos.isPrimary, true)
          )
        )
      : Promise.resolve([] as PhotoCrop[])
  ])

  // Group quick facts by member ID
  const quickFactsByMember = allQuickFacts.reduce((acc, fact) => {
    if (!acc[fact.teamMemberId]) {
      acc[fact.teamMemberId] = []
    }
    acc[fact.teamMemberId].push(fact)
    return acc
  }, {} as Record<string, typeof allQuickFacts>)

  // Create a map of member ID to photo crops
  const photoCropsByMember = primaryPhotos.reduce((acc, photo) => {
    acc[photo.teamMemberId] = {
      cropSquareUrl: photo.cropSquareUrl,
      cropCloseUpCircleUrl: photo.cropCloseUpCircleUrl,
      cropMediumCircleUrl: photo.cropMediumCircleUrl,
      cropFullVerticalUrl: photo.cropFullVerticalUrl,
    }
    return acc
  }, {} as Record<string, { cropSquareUrl: string | null; cropCloseUpCircleUrl: string | null; cropMediumCircleUrl: string | null; cropFullVerticalUrl: string | null }>)

  // Map a Vagaro parentServiceTitle (sub-category) to one or more frontend tag labels.
  // Source of truth for this mapping is the spec Corey set when wiring up Vagaro-as-source-of-truth.
  // Vagaro parentServiceTitle → canonical tag labels.
  //
  // IMPORTANT: tag strings here MUST match the CATEGORY_OPTIONS list in
  // /admin/website/team/page.tsx so Vagaro-derived chips dedupe correctly
  // against admin-set manual chips (allCategories merge dedupes by string
  // equality further down). Mismatches like "Skincare" vs "Skin Care" or
  // "waxing" vs "Waxing" cause the same artist to display two chips for
  // the same concept.
  //
  // Vagaro also exposes TWO parent titles for the same body of lash work:
  //   - "Eyelash Extension Services" (Emily et al)
  //   - "Lash Extensions"            (Paige Gordon, Tori Burnett)
  // We match the shared substring "lash extension" — safe against
  // "Lash Lift Services" which doesn't contain that substring and is
  // handled by the next branch.
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
    // Bundles, training, misc — skip (no tag)
    return []
  }

  // Build a map of teamMemberId → ordered list of frontend tag labels.
  // Walks the canonical Vagaro mapping table — one row per stylist×service —
  // and deduplicates them before the canonical display sort below. Only
  // stylists with usesLashpopBooking=true have entries here.
  const tagsByMemberId = new Map<string, string[]>()
  for (const mapping of vagaroMappings) {
    const tags = vagaroParentToTags(mapping.vagaroParentTitle)
    if (tags.length === 0) continue
    const list = tagsByMemberId.get(mapping.teamMemberId) ?? []
    for (const tag of tags) {
      if (!list.includes(tag)) list.push(tag)
    }
    tagsByMemberId.set(mapping.teamMemberId, list)
  }

  // Process all members (no additional queries - just in-memory operations).
  // Dual-mode routing: the boolean is the authority. No merge, no fallback.
  const membersWithServices = members.map((member) => {
    const categories = member.usesLashpopBooking
      ? sortServiceTags(tagsByMemberId.get(member.id) ?? [])
      : sortServiceTags((member.externalServiceCategories as string[] | null) ?? [])

    // Get photo crops for this member
    const photoCrops = photoCropsByMember[member.id] || {}

    return {
      ...member,
      serviceCategories: categories,
      quickFacts: quickFactsByMember[member.id] || [], // Add quick facts
      // Photo crop URLs for different formats
      cropSquareUrl: photoCrops.cropSquareUrl || null,
      cropCloseUpCircleUrl: photoCrops.cropCloseUpCircleUrl || null,
      cropMediumCircleUrl: photoCrops.cropMediumCircleUrl || null,
      cropFullVerticalUrl: photoCrops.cropFullVerticalUrl || null,
    }
  })

  return membersWithServices
}

export async function getTeamMembersByType(type: 'employee' | 'independent') {
  const db = getDb()

  const members = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.type, type),
        eq(teamMembers.isActive, true)
      )
    )
    .orderBy(teamMembers.displayOrder)

  return members
}

/**
 * Get team members who can perform a specific service. Reads the canonical
 * Vagaro mapping table populated by the sync worker; falls back to all active
 * members when no mappings exist for that service (e.g. an external-booking
 * service that's not in Vagaro at all).
 */
export async function getTeamMembersByServiceId(serviceId: string) {
  const db = getDb()

  const memberIds = await db
    .selectDistinct({ teamMemberId: teamMemberServicesVagaro.teamMemberId })
    .from(teamMemberServicesVagaro)
    .where(eq(teamMemberServicesVagaro.serviceId, serviceId))

  if (memberIds.length === 0) {
    return await getTeamMembers()
  }

  const members = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        inArray(teamMembers.id, memberIds.map(m => m.teamMemberId)),
        eq(teamMembers.isActive, true)
      )
    )
    .orderBy(teamMembers.displayOrder)

  return members
}
