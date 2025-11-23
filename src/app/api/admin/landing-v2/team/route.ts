import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMembers } from "@/db/schema/team_members"
import { user as userSchema } from "@/db/schema/auth_user"
import { session as sessionSchema } from "@/db/schema/auth_session"
import { eq, and, gt, desc } from "drizzle-orm"
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

// GET - Fetch all team members
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const db = getDb()
    const members = await db
      .select()
      .from(teamMembers)
      .orderBy(teamMembers.displayOrder)

    return NextResponse.json({ teamMembers: members })
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 })
  }
}

// POST - Create new team member
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const member = await req.json()
    const db = getDb()

    const [newMember] = await db
      .insert(teamMembers)
      .values(member)
      .returning()

    return NextResponse.json({ teamMember: newMember })
  } catch (error) {
    console.error("Error creating team member:", error)
    return NextResponse.json({ error: "Failed to create team member" }, { status: 500 })
  }
}
