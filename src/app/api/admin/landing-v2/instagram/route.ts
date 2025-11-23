import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { landingPageInstagram } from "@/db/schema/landing_page_instagram"
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

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const db = getDb()
    const config = await db.select().from(landingPageInstagram).limit(1)
    return NextResponse.json({ config: config[0] || null })
  } catch (error) {
    console.error("Error fetching Instagram config:", error)
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const config = await req.json()
    const db = getDb()
    const existing = await db.select().from(landingPageInstagram).limit(1)

    if (existing.length > 0) {
      await db
        .update(landingPageInstagram)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(landingPageInstagram.id, existing[0].id))
    } else {
      await db.insert(landingPageInstagram).values(config)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving Instagram config:", error)
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
  }
}
