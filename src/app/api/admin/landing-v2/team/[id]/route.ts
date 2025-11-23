import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMembers } from "@/db/schema/team_members"
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

// PATCH - Update team member
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
      .update(teamMembers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(teamMembers.id, id))
      .returning()

    return NextResponse.json({ teamMember: updated })
  } catch (error) {
    console.error("Error updating team member:", error)
    return NextResponse.json({ error: "Failed to update team member" }, { status: 500 })
  }
}

// DELETE - Delete team member
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
      .delete(teamMembers)
      .where(eq(teamMembers.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting team member:", error)
    return NextResponse.json({ error: "Failed to delete team member" }, { status: 500 })
  }
}
