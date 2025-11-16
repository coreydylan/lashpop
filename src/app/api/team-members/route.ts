import { NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMembers } from "@/db/schema/team_members"
import { eq } from "drizzle-orm"

/**
 * GET - List all active team members
 * Public endpoint for selecting team members
 */
export async function GET() {
  try {
    const db = getDb()

    const members = await db
      .select({
        id: teamMembers.id,
        name: teamMembers.name,
        imageUrl: teamMembers.imageUrl,
        role: teamMembers.role,
      })
      .from(teamMembers)
      .where(eq(teamMembers.isActive, true))
      .orderBy(teamMembers.name)

    return NextResponse.json({ teamMembers: members })
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    )
  }
}
