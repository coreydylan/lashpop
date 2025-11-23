import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { landingPageFaqs } from "@/db/schema/landing_page_faqs"
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

// PATCH - Update FAQ
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const { id } = await params
    const updates = await req.json()
    const db = getDb()

    const [updated] = await db
      .update(landingPageFaqs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(landingPageFaqs.id, id))
      .returning()

    return NextResponse.json({ faq: updated })
  } catch (error) {
    console.error("Error updating FAQ:", error)
    return NextResponse.json({ error: "Failed to update FAQ" }, { status: 500 })
  }
}

// DELETE - Delete FAQ
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const { id } = await params
    const db = getDb()

    await db
      .delete(landingPageFaqs)
      .where(eq(landingPageFaqs.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting FAQ:", error)
    return NextResponse.json({ error: "Failed to delete FAQ" }, { status: 500 })
  }
}
