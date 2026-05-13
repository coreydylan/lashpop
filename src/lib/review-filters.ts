import { and, desc, eq, inArray, isNull, notInArray, sql } from "drizzle-orm"

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
 * Hides reviews that name a team member who is no longer on the public staff page
 * (teamMembers.isActive = false). Restores previously auto-hidden reviews if the
 * referenced team member is back on staff.
 *
 * Only touches rows where hidden_reason is null/STALE_TEAM_MEMBER so it doesn't
 * stomp on manual admin hides.
 */
export async function applyStaleTeamMemberFilter(): Promise<StaleFilterStats> {
  const db = getDb()

  const allMembers = await db
    .select({ name: teamMembers.name, isActive: teamMembers.isActive })
    .from(teamMembers)

  const activeFulls = allMembers.filter(m => m.isActive).map(m => m.name).filter(Boolean)
  const inactiveFulls = allMembers.filter(m => !m.isActive).map(m => m.name).filter(Boolean)
  const tokens = buildStaleNamePatterns(activeFulls, inactiveFulls)

  // Always re-check currently-stale reviews so we can restore them if the name
  // is no longer stale (team member returned).
  const currentlyHidden = await db
    .select({ id: reviews.id, reviewText: reviews.reviewText, subject: reviews.subject })
    .from(reviews)
    .where(eq(reviews.hiddenReason, STALE_TEAM_MEMBER))

  // Restore any auto-hidden review whose mentioned name is no longer stale.
  const toRestore: string[] = []
  for (const row of currentlyHidden) {
    const stillStale = mentionsAnyToken(row.subject, tokens) || mentionsAnyToken(row.reviewText, tokens)
    if (!stillStale) toRestore.push(row.id)
  }
  if (toRestore.length) {
    await db
      .update(reviews)
      .set({ showOnWebsite: true, hiddenReason: null, updatedAt: new Date() })
      .where(inArray(reviews.id, toRestore))
  }

  // Find reviews that are NOT auto-hidden (hiddenReason is null) and check for matches.
  // We skip rows with non-null hiddenReason — those were either auto-hidden already or
  // hidden by some other future reason we don't want to overwrite.
  let hiddenCount = 0
  if (tokens.length) {
    const candidates = await db
      .select({ id: reviews.id, reviewText: reviews.reviewText, subject: reviews.subject })
      .from(reviews)
      .where(isNull(reviews.hiddenReason))

    const idsToHide: string[] = []
    for (const row of candidates) {
      const matched = mentionsAnyToken(row.subject, tokens) || mentionsAnyToken(row.reviewText, tokens)
      if (matched) idsToHide.push(row.id)
    }

    if (idsToHide.length) {
      await db
        .update(reviews)
        .set({
          showOnWebsite: false,
          hiddenReason: STALE_TEAM_MEMBER,
          updatedAt: new Date()
        })
        .where(inArray(reviews.id, idsToHide))
      hiddenCount = idsToHide.length
    }
  }

  return {
    hidden: hiddenCount,
    restored: toRestore.length,
    inactiveTeamMembers: inactiveFulls.length
  }
}

export type AutoPromoteStats = {
  promoted: number
  homepageSize: number
  capacity: number
}

const DEFAULT_HOMEPAGE_CAP = 12

/**
 * Adds eligible 5-star reviews to homepage_reviews. Eligible = rating 5, show_on_website
 * true, not dismissed by admin, not already on the homepage. Newest first by reviewDate,
 * appended after existing display orders.
 */
export async function autoPromoteToHomepage(options?: { maxCount?: number }): Promise<AutoPromoteStats> {
  const db = getDb()
  const cap = options?.maxCount ?? DEFAULT_HOMEPAGE_CAP

  const current = await db
    .select({ reviewId: homepageReviews.reviewId, displayOrder: homepageReviews.displayOrder })
    .from(homepageReviews)
    .orderBy(desc(homepageReviews.displayOrder))

  const remaining = cap - current.length
  if (remaining <= 0) {
    return { promoted: 0, homepageSize: current.length, capacity: cap }
  }

  const existingIds = current.map(r => r.reviewId)
  const baseFilter = and(
    eq(reviews.rating, 5),
    eq(reviews.showOnWebsite, true),
    eq(reviews.homepageDismissed, false)
  )
  const conditions = existingIds.length
    ? and(baseFilter, notInArray(reviews.id, existingIds))
    : baseFilter

  const candidates = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(conditions)
    .orderBy(sql`${reviews.reviewDate} DESC NULLS LAST`)
    .limit(remaining)

  if (!candidates.length) {
    return { promoted: 0, homepageSize: current.length, capacity: cap }
  }

  const maxOrder = current[0]?.displayOrder ?? -1
  const inserts = candidates.map((row, index) => ({
    reviewId: row.id,
    displayOrder: maxOrder + index + 1
  }))

  await db.insert(homepageReviews).values(inserts)

  return {
    promoted: inserts.length,
    homepageSize: current.length + inserts.length,
    capacity: cap
  }
}
