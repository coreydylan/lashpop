"use server"

import { getDb } from "@/db"
import { reviews } from "@/db/schema/reviews"
import { reviewStats } from "@/db/schema/review_stats"
import { teamMembers } from "@/db/schema/team_members"
import { homepageReviews } from "@/db/schema/website_settings"
import { and, desc, eq, gte, inArray, asc } from "drizzle-orm"

type ReviewRow = typeof reviews.$inferSelect

/**
 * Attach the assigned stylist's display name (via team_member_id) to each
 * review so the homepage carousel can show "with {stylist}". Returns the same
 * rows with a `stylistName` field (null when unassigned or inactive).
 */
async function attachStylistNames<T extends { teamMemberId: string | null }>(
  db: ReturnType<typeof getDb>,
  rows: T[]
): Promise<(T & { stylistName: string | null })[]> {
  const ids = Array.from(new Set(rows.map(r => r.teamMemberId).filter((id): id is string => !!id)))
  if (ids.length === 0) return rows.map(r => ({ ...r, stylistName: null }))

  const members = await db
    .select({ id: teamMembers.id, name: teamMembers.name })
    .from(teamMembers)
    .where(inArray(teamMembers.id, ids))
  const nameById = new Map(members.map(m => [m.id, m.name]))

  return rows.map(r => ({ ...r, stylistName: r.teamMemberId ? nameById.get(r.teamMemberId) ?? null : null }))
}

export async function getReviews(limit = 20) {
  try {
    const db = getDb()
    const allReviews = await db
      .select()
      .from(reviews)
      .orderBy(desc(reviews.reviewDate))
      .limit(limit)

    return allReviews
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return []
  }
}

/**
 * Get reviews selected for the homepage via admin panel
 * Falls back to high-rated reviews if no selection exists
 */
export async function getHomepageReviews(fallbackLimit = 10) {
  try {
    const db = getDb()
    // Get selected review IDs from homepage_reviews table
    const selectedData = await db
      .select()
      .from(homepageReviews)
      .orderBy(asc(homepageReviews.displayOrder))

    // If we have selected reviews, fetch them (excluding any that have been hidden)
    if (selectedData.length > 0) {
      const selectedIds = selectedData.map(r => r.reviewId)

      const selectedReviews = await db
        .select()
        .from(reviews)
        .where(and(inArray(reviews.id, selectedIds), eq(reviews.showOnWebsite, true)))

      // Sort by the display order from homepage_reviews
      const orderMap = new Map(selectedData.map(r => [r.reviewId, r.displayOrder]))
      selectedReviews.sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 999
        const orderB = orderMap.get(b.id) ?? 999
        return orderA - orderB
      })

      return attachStylistNames(db, selectedReviews)
    }

    // Fallback to high-rated reviews
    return getHighRatedReviews(fallbackLimit)
  } catch (error) {
    console.error("Error fetching homepage reviews:", error)
    // Return empty array on error - let the page handle gracefully
    return []
  }
}

export async function getHighRatedReviews(limit = 10) {
  try {
    const db = getDb()
    const topReviews = await db
      .select()
      .from(reviews)
      .where(and(gte(reviews.rating, 4), eq(reviews.showOnWebsite, true)))
      .orderBy(desc(reviews.reviewDate))
      .limit(limit)

    return attachStylistNames(db, topReviews)
  } catch (error) {
    console.error("Error fetching top reviews:", error)
    return []
  }
}

export async function getReviewStats() {
  try {
    const db = getDb()
    const stats = await db.select().from(reviewStats)
    return stats
  } catch (error) {
    console.error("Error fetching review stats:", error)
    return []
  }
}
