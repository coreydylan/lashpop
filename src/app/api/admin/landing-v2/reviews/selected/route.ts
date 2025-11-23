import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { landingPageReviews } from "@/db/schema/landing_page_reviews"
import { reviews } from "@/db/schema/reviews"
import { user as userSchema } from "@/db/schema/auth_user"
import { session as sessionSchema } from "@/db/schema/auth_session"
import { eq, and, gt } from "drizzle-orm"
import { cookies } from "next/headers"

async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookieStore = await cookies()
  const authToken = cookieStore.get("auth_token")
  if (!authToken) return false

  const db = getDb()
  const result = await db
    .select({ damAccess: userSchema.damAccess })
    .from(sessionSchema)
    .innerJoin(userSchema, eq(sessionSchema.userId, userSchema.id))
    .where(
      and(
        eq(sessionSchema.token, authToken.value),
        gt(sessionSchema.expiresAt, new Date())
      )
    )
    .limit(1)

  return result[0]?.damAccess || false
}

// GET - Fetch selected reviews with full review data
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const db = getDb()
    const selected = await db
      .select({
        id: landingPageReviews.id,
        reviewId: landingPageReviews.reviewId,
        displayOrder: landingPageReviews.displayOrder,
        isVisible: landingPageReviews.isVisible,
        isFeatured: landingPageReviews.isFeatured,
        review: reviews
      })
      .from(landingPageReviews)
      .innerJoin(reviews, eq(landingPageReviews.reviewId, reviews.id))
      .orderBy(landingPageReviews.displayOrder)

    return NextResponse.json({ selectedReviews: selected })
  } catch (error) {
    console.error("Error fetching selected reviews:", error)
    return NextResponse.json({ error: "Failed to fetch selected reviews" }, { status: 500 })
  }
}
