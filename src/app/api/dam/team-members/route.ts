import { NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMembers } from "@/db/schema/team_members"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { eq, and } from "drizzle-orm"

export async function GET() {
  try {
    const db = getDb()

    // Fetch all active team members with their primary photo's crop data
    const members = await db
      .select({
        id: teamMembers.id,
        name: teamMembers.name,
        imageUrl: teamMembers.imageUrl,
        cropCloseUpCircle: teamMemberPhotos.cropCloseUpCircle,
        cropSquare: teamMemberPhotos.cropSquare,
        cropMediumCircle: teamMemberPhotos.cropMediumCircle
      })
      .from(teamMembers)
      .leftJoin(
        teamMemberPhotos,
        and(
          eq(teamMemberPhotos.teamMemberId, teamMembers.id),
          eq(teamMemberPhotos.isPrimary, true)
        )
      )
      .where(eq(teamMembers.isActive, true))
      .orderBy(teamMembers.displayOrder)

    return NextResponse.json({ teamMembers: members })
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    )
  }
}
