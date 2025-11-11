import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { eq, desc } from "drizzle-orm"

export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const db = getDb()

    const photos = await db
      .select()
      .from(teamMemberPhotos)
      .where(eq(teamMemberPhotos.teamMemberId, params.memberId))
      .orderBy(desc(teamMemberPhotos.isPrimary), desc(teamMemberPhotos.uploadedAt))

    return NextResponse.json({ photos })
  } catch (error) {
    console.error("Error fetching photos:", error)
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    )
  }
}
