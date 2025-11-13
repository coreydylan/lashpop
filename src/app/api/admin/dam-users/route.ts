import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { user as userSchema } from "@/db/schema/auth_user"
import { session as sessionSchema } from "@/db/schema/auth_session"
import { eq, and, gt, desc } from "drizzle-orm"
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

// GET - List all users with their DAM access status
export async function GET(req: NextRequest) {
  // Check if user is admin
  if (!(await isAdmin(req))) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 403 }
    )
  }

  try {
    const db = getDb()
    const users = await db
      .select({
        id: userSchema.id,
        phoneNumber: userSchema.phoneNumber,
        email: userSchema.email,
        name: userSchema.name,
        damAccess: userSchema.damAccess,
        createdAt: userSchema.createdAt,
      })
      .from(userSchema)
      .orderBy(desc(userSchema.createdAt))

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

// POST - Update DAM access for a user
export async function POST(req: NextRequest) {
  // Check if user is admin
  if (!(await isAdmin(req))) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 403 }
    )
  }

  try {
    const { userId, damAccess } = await req.json()

    if (!userId || typeof damAccess !== "boolean") {
      return NextResponse.json(
        { error: "userId and damAccess (boolean) are required" },
        { status: 400 }
      )
    }

    const db = getDb()
    await db
      .update(userSchema)
      .set({
        damAccess,
        updatedAt: new Date(),
      })
      .where(eq(userSchema.id, userId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating DAM access:", error)
    return NextResponse.json(
      { error: "Failed to update DAM access" },
      { status: 500 }
    )
  }
}
