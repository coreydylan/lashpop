import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { teamMembers } from "@/db/schema/team_members"
import { eq, and } from "drizzle-orm"

export async function POST(
  request: NextRequest,
  { params }: { params: { photoId: string } }
) {
  try {
    const body = await request.json()
    const { teamMemberId } = body

    const db = getDb()

    // Get the photo being set as primary
    const [photo] = await db
      .select()
      .from(teamMemberPhotos)
      .where(eq(teamMemberPhotos.id, params.photoId))

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    // Unset all other photos as primary for this team member
    await db
      .update(teamMemberPhotos)
      .set({ isPrimary: false })
      .where(eq(teamMemberPhotos.teamMemberId, teamMemberId))

    // Set this photo as primary
    await db
      .update(teamMemberPhotos)
      .set({ isPrimary: true, updatedAt: new Date() })
      .where(eq(teamMemberPhotos.id, params.photoId))

    // Update team member's imageUrl to use this photo
    await db
      .update(teamMembers)
      .set({ imageUrl: photo.filePath, updatedAt: new Date() })
      .where(eq(teamMembers.id, teamMemberId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error setting primary:", error)
    return NextResponse.json(
      { error: "Failed to set primary photo" },
      { status: 500 }
    )
  }
}
