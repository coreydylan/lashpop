import { db } from "@/db"
import { reviews } from "@/db/schema/reviews"
import { reviewStats } from "@/db/schema/review_stats"
import { websiteSettings } from "@/db/schema/website_settings"
import { desc, gte, eq, inArray } from "drizzle-orm"

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
    // Try to get selected reviews from website settings
    let selectedConfig: { id: string; displayOrder: number }[] = []
    
    try {
      const [setting] = await db
        .select()
        .from(websiteSettings)
        .where(eq(websiteSettings.section, 'homepage_reviews'))
        .limit(1)
      
      if (setting?.config && Array.isArray((setting.config as any).selectedReviews)) {
        selectedConfig = (setting.config as any).selectedReviews
      }
    } catch {
      // Table might not exist yet
      console.log('Website settings not available, using fallback')
    }

    // If we have selected reviews, fetch them in order
    if (selectedConfig.length > 0) {
      const selectedIds = selectedConfig.map(c => c.id)
      
      const selectedReviews = await db
        .select()
        .from(reviews)
        .where(inArray(reviews.id, selectedIds))

      // Sort by the display order from config
      const orderMap = new Map(selectedConfig.map(c => [c.id, c.displayOrder]))
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
