import { db } from "@/db"
import { reviews } from "@/db/schema/reviews"
import { desc, gte } from "drizzle-orm"

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