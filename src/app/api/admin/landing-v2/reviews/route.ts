import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { landingPageReviews } from "@/db/schema/landing_page_reviews"
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

// POST - Save review selections
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const { selectedReviews } = await req.json()
    const db = getDb()

    // Clear existing selections
    await db.delete(landingPageReviews)

    // Insert new selections
    if (selectedReviews && selectedReviews.length > 0) {
      await db.insert(landingPageReviews).values(
        selectedReviews.map((r: any) => ({
          reviewId: r.reviewId,
          displayOrder: r.displayOrder,
          isVisible: r.isVisible,
          isFeatured: r.isFeatured
        }))
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving review selections:", error)
    return NextResponse.json({ error: "Failed to save selections" }, { status: 500 })
  }
}
