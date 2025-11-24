"use server"

import { db } from "@/db"
import { reviews } from "@/db/schema/reviews"
import { reviewStats } from "@/db/schema/review_stats"
import { homepageReviews } from "@/db/schema/website_settings"
import { desc, gte, inArray, asc } from "drizzle-orm"

export async function getReviews(limit = 20) {
  try {
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
    // Get selected review IDs from homepage_reviews table
    const selectedData = await db
      .select()
      .from(homepageReviews)
      .orderBy(asc(homepageReviews.displayOrder))

    // If we have selected reviews, fetch them
    if (selectedData.length > 0) {
      const selectedIds = selectedData.map(r => r.reviewId)
      
      const selectedReviews = await db
        .select()
        .from(reviews)
        .where(inArray(reviews.id, selectedIds))

      // Sort by the display order from homepage_reviews
      const orderMap = new Map(selectedData.map(r => [r.reviewId, r.displayOrder]))
      selectedReviews.sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 999
        const orderB = orderMap.get(b.id) ?? 999
        return orderA - orderB
      })

      return selectedReviews
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
    const topReviews = await db
      .select()
      .from(reviews)
      .where(gte(reviews.rating, 4))
      .orderBy(desc(reviews.reviewDate))
      .limit(limit)

    return topReviews
  } catch (error) {
    console.error("Error fetching top reviews:", error)
    return []
  }
}

export async function getReviewStats() {
  try {
    const stats = await db.select().from(reviewStats)
    return stats
  } catch (error) {
    console.error("Error fetching review stats:", error)
    return []
  }
}
