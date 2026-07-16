import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { requireAdminApi } from "@/lib/admin/auth"
import { recordAdminAction } from "@/lib/admin/audit"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(["owner", "publisher"])
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const teamMemberId = typeof body.teamMemberId === "string" ? body.teamMemberId : ""
    const fileName = typeof body.fileName === "string" ? body.fileName : ""
    const filePath = typeof body.filePath === "string" ? body.filePath : ""

    if (!teamMemberId || !fileName || !filePath) {
      return NextResponse.json(
        { error: "teamMemberId, fileName, and filePath are required" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Insert photo metadata
    const [photo] = await db
      .insert(teamMemberPhotos)
      .values({
        teamMemberId,
        fileName,
        filePath,
        isPrimary: false
      })
      .returning()

    await recordAdminAction({
      action: "dam.team.photo.create",
      surface: "dam",
      targetType: "team_member_photo",
      targetId: photo.id,
      actorUserId: auth.userId,
      diff: {
        teamMemberId,
        before: null,
        after: {
          id: photo.id,
          teamMemberId: photo.teamMemberId,
          fileName: photo.fileName,
          filePath: photo.filePath,
          isPrimary: photo.isPrimary,
        },
      },
    })

    return NextResponse.json({ photo })
  } catch (error) {
    console.error("Error saving team member photo:", error)
    return NextResponse.json(
      { error: "Failed to save team member photo" },
      { status: 500 }
    )
  }
}
