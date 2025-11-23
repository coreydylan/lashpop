import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { landingPageContent } from "@/db/schema/landing_page_content"
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
    const content = await db
      .select()
      .from(landingPageContent)
      .where(eq(landingPageContent.sectionKey, "founder_letter"))
      .limit(1)

    return NextResponse.json({ content: content[0] || null })
  } catch (error) {
    console.error("Error fetching founder letter:", error)
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const content = await req.json()
    const db = getDb()
    const existing = await db
      .select()
      .from(landingPageContent)
      .where(eq(landingPageContent.sectionKey, "founder_letter"))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(landingPageContent)
        .set({ ...content, updatedAt: new Date() })
        .where(eq(landingPageContent.id, existing[0].id))
    } else {
      await db.insert(landingPageContent).values({
        ...content,
        sectionKey: "founder_letter"
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving founder letter:", error)
    return NextResponse.json({ error: "Failed to save content" }, { status: 500 })
  }
}
