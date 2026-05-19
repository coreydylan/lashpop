import { and, asc, desc, eq, inArray, isNull, notInArray, or, sql } from "drizzle-orm"

import { getDb } from "@/db"
import { reviews } from "@/db/schema/reviews"
import { teamMembers } from "@/db/schema/team_members"
import { homepageReviews } from "@/db/schema/website_settings"

const STALE_TEAM_MEMBER = "stale_team_member"

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? ""
}

/**
 * Builds the set of name tokens that uniquely identify *inactive* team members.
 *
 * If "Sarah Smith" is inactive but an active "Sarah Jones" is on staff, we exclude
 * the bare first name "Sarah" — otherwise we'd hide reviews referring to the current
 * Sarah. Full names always survive the dedup because they're unambiguous.
 */
function buildStaleNamePatterns(activeFulls: string[], inactiveFulls: string[]) {
  const activeFirsts = new Set(activeFulls.map(name => normalize(firstName(name))).filter(Boolean))
  const tokens = new Set<string>()

  for (const fullName of inactiveFulls) {
    const trimmed = fullName.trim()
    if (!trimmed) continue
    tokens.add(trimmed)
    const first = firstName(trimmed)
    if (first && !activeFirsts.has(normalize(first))) {
      tokens.add(first)
    }
  }

  return Array.from(tokens)
}

function mentionsAnyToken(text: string | null | undefined, tokens: string[]): string | null {
  if (!text || !tokens.length) return null
  for (const token of tokens) {
    const pattern = new RegExp(`\\b${escapeRegex(token)}\\b`, "i")
    if (pattern.test(text)) return token
  }
  return null
}

export type StaleFilterStats = {
  hidden: number
  restored: number
  inactiveTeamMembers: number
}

/**
 * Hides reviews about team members no longer on the public staff page
 * (teamMembers.isActive = false). Restores previously auto-hidden reviews when
 * the referenced staff member is back on staff.
 *
 * Primary mechanism is the `team_member_id` FK on reviews — accurate, fast,
 * no false positives. The regex-on-text path remains as a fallback for rows
 * where the FK is null (Yelp/Google reviews that mention a stylist's name in
 * free text but didn't get linked via a structured field).
 *
 * Only touches rows where hidden_reason is null/STALE_TEAM_MEMBER so it
 * doesn't stomp on manual admin hides.
 */
export async function applyStaleTeamMemberFilter(): Promise<StaleFilterStats> {
  const db = getDb()

  const allMembers = await db
    .select({ id: teamMembers.id, name: teamMembers.name, isActive: teamMembers.isActive })
    .from(teamMembers)

  const inactiveIds = allMembers.filter(m => !m.isActive).map(m => m.id)
  const activeFulls = allMembers.filter(m => m.isActive).map(m => m.name).filter(Boolean)
  const inactiveFulls = allMembers.filter(m => !m.isActive).map(m => m.name).filter(Boolean)
  const tokens = buildStaleNamePatterns(activeFulls, inactiveFulls)

  const toRestore = new Set<string>()
  const toHide = new Set<string>()

  // PATH A: FK-based (accurate, no false positives).
  // Hide every review whose team_member_id matches an inactive staff row.
  if (inactiveIds.length) {
    const fkHide = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        and(
          inArray(reviews.teamMemberId, inactiveIds),
          isNull(reviews.hiddenReason), // don't overwrite manual hides
        ),
      )
    for (const row of fkHide) toHide.add(row.id)
  }

  // Restore any auto-hidden row whose FK now points at an active member,
  // or whose FK is null AND no longer matches the regex fallback (handled below).
  const currentlyHidden = await db
    .select({
      id: reviews.id,
      reviewText: reviews.reviewText,
      subject: reviews.subject,
      teamMemberId: reviews.teamMemberId,
    })
    .from(reviews)
    .where(eq(reviews.hiddenReason, STALE_TEAM_MEMBER))

  for (const row of currentlyHidden) {
    if (row.teamMemberId) {
      // FK present — restore iff that team_member is now active
      if (!inactiveIds.includes(row.teamMemberId)) toRestore.add(row.id)
    } else {
      // FK absent — fall back to regex on subject + reviewText
      const stillStale =
        mentionsAnyToken(row.subject, tokens) || mentionsAnyToken(row.reviewText, tokens)
      if (!stillStale) toRestore.add(row.id)
    }
  }

  // PATH B: regex fallback for the FK-null rows (Yelp/Google mentions).
  // Limited to rows that the FK path didn't already mark, and that aren't
  // currently hidden.
  if (tokens.length) {
    const candidates = await db
      .select({ id: reviews.id, reviewText: reviews.reviewText, subject: reviews.subject })
      .from(reviews)
      .where(and(isNull(reviews.hiddenReason), isNull(reviews.teamMemberId)))
    for (const row of candidates) {
      const matched =
        mentionsAnyToken(row.subject, tokens) || mentionsAnyToken(row.reviewText, tokens)
      if (matched) toHide.add(row.id)
    }
  }

  // Apply restores first (FK-correct view of "no longer stale").
  // Both writes skip rows where admin locked show_on_website.
  if (toRestore.size) {
    await db
      .update(reviews)
      .set({ showOnWebsite: true, hiddenReason: null, updatedAt: new Date() })
      .where(and(
        inArray(reviews.id, Array.from(toRestore)),
        sql`NOT (admin_locked_fields ? 'show_on_website')`,
      ))
  }
  if (toHide.size) {
    await db
      .update(reviews)
      .set({
        showOnWebsite: false,
        hiddenReason: STALE_TEAM_MEMBER,
        updatedAt: new Date(),
      })
      .where(and(
        inArray(reviews.id, Array.from(toHide)),
        sql`NOT (admin_locked_fields ? 'show_on_website')`,
      ))
  }

  return {
    hidden: toHide.size,
    restored: toRestore.size,
    inactiveTeamMembers: inactiveFulls.length,
  }
}

export type AutoPromoteStats = {
  /** Number of rows newly inserted as auto-picks this run. */
  promoted: number
  /** Total rows on the homepage after the run (pinned + auto). */
  homepageSize: number
  /** Number of admin-pinned rows (immortal). */
  pinned: number
  /** Configured cap. */
  capacity: number
}

const DEFAULT_HOMEPAGE_CAP = 9

/**
 * Refreshes the auto-rotating slots on the homepage.
 *
 * Two-layer model:
 *   - Admin-pinned rows (is_pinned=true) are immortal. The admin UI manages them.
 *   - Auto-rotating rows (is_pinned=false) are rebuilt from scratch every run:
 *     DELETE WHERE is_pinned=false, then INSERT the newest N 5-star reviews
 *     that pass the eligibility filter.
 *
 * Eligibility: rating=5, show_on_website=true, homepage_dismissed=false,
 * team_member_id NOT in inactive team members (reviews about ex-staff are
 * confusing for new bookings — they get hidden via the stale filter too,
 * but we double-belt here just in case).
 *
 * Cap defaults to 9 (carousel sweet spot). If admin pins more than cap, all
 * pins stay and no auto-fill happens — the cap is a target for total
 * visible reviews, but admin curation always wins.
 */
export async function autoPromoteToHomepage(options?: { maxCount?: number }): Promise<AutoPromoteStats> {
  const db = getDb()
  const cap = options?.maxCount ?? DEFAULT_HOMEPAGE_CAP

  // Snapshot current state.
  const pinnedRows = await db
    .select({ reviewId: homepageReviews.reviewId, displayOrder: homepageReviews.displayOrder })
    .from(homepageReviews)
    .where(eq(homepageReviews.isPinned, true))
    .orderBy(asc(homepageReviews.displayOrder))

  // Wipe yesterday's auto-picks. Admin pins stay.
  await db.delete(homepageReviews).where(eq(homepageReviews.isPinned, false))

  const remaining = Math.max(0, cap - pinnedRows.length)
  if (remaining === 0) {
    return {
      promoted: 0,
      homepageSize: pinnedRows.length,
      pinned: pinnedRows.length,
      capacity: cap,
    }
  }

  // Find inactive team member ids so we can exclude reviews about ex-staff.
  const inactiveStaff = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(eq(teamMembers.isActive, false))
  const inactiveIds = inactiveStaff.map(r => r.id)

  const pinnedIds = pinnedRows.map(r => r.reviewId)

  // Build the candidate filter. Eligible 5★ + visible + not dismissed +
  // not already pinned + not about an inactive stylist.
  const baseConditions = [
    eq(reviews.rating, 5),
    eq(reviews.showOnWebsite, true),
    eq(reviews.homepageDismissed, false),
  ]
  if (pinnedIds.length) baseConditions.push(notInArray(reviews.id, pinnedIds))
  if (inactiveIds.length) {
    // FK-null rows survive (rating=5 anonymous reviews on Yelp/Google with no
    // staff attribution). Only EXCLUDE rows whose FK actively points at
    // someone inactive.
    baseConditions.push(
      or(
        isNull(reviews.teamMemberId),
        notInArray(reviews.teamMemberId, inactiveIds),
      )!,
    )
  }

  const candidates = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(...baseConditions))
    .orderBy(sql`${reviews.reviewDate} DESC NULLS LAST`)
    .limit(remaining)

  if (!candidates.length) {
    return {
      promoted: 0,
      homepageSize: pinnedRows.length,
      pinned: pinnedRows.length,
      capacity: cap,
    }
  }

  // Place auto-picks AFTER pinned rows in display order.
  const maxPinnedOrder = pinnedRows.length
    ? Math.max(...pinnedRows.map(r => r.displayOrder))
    : -1
  const inserts = candidates.map((row, index) => ({
    reviewId: row.id,
    displayOrder: maxPinnedOrder + index + 1,
    isPinned: false,
  }))

  await db.insert(homepageReviews).values(inserts)

  return {
    promoted: inserts.length,
    homepageSize: pinnedRows.length + inserts.length,
    pinned: pinnedRows.length,
    capacity: cap,
  }
}
