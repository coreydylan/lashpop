import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { landingPageHero } from "@/db/schema/landing_page_hero"
import { user as userSchema } from "@/db/schema/auth_user"
import { session as sessionSchema } from "@/db/schema/auth_session"
import { eq, and, gt } from "drizzle-orm"
import { cookies } from "next/headers"

// Helper to check if current user is an admin (has DAM access)
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

// GET - Fetch hero section configuration
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 403 }
    )
  }

  try {
    const db = getDb()
    const heroConfig = await db
      .select()
      .from(landingPageHero)
      .limit(1)

    return NextResponse.json({
      config: heroConfig[0] || null
    })
  } catch (error) {
    console.error("Error fetching hero config:", error)
    return NextResponse.json(
      { error: "Failed to fetch hero configuration" },
      { status: 500 }
    )
  }
}

// POST - Update hero section configuration
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 403 }
    )
  }

  try {
    const config = await req.json()
    const db = getDb()

    // Check if config exists
    const existing = await db
      .select()
      .from(landingPageHero)
      .limit(1)

    if (existing.length > 0) {
      // Update existing
      await db
        .update(landingPageHero)
        .set({
          ...config,
          updatedAt: new Date()
        })
        .where(eq(landingPageHero.id, existing[0].id))
    } else {
      // Insert new
      await db.insert(landingPageHero).values(config)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving hero config:", error)
    return NextResponse.json(
      { error: "Failed to save hero configuration" },
      { status: 500 }
    )
  }
}
