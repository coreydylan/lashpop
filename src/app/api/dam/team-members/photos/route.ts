import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { requireAdminApi } from "@/lib/admin/auth"
import { recordAdminAction } from "@/lib/admin/audit"
import { finalizePresignedImage, getStorageBucketUrl } from "@/lib/dam/r2-client"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(["owner", "publisher"])
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const teamMemberId = typeof body.teamMemberId === "string" ? body.teamMemberId : ""
    const fileName = typeof body.fileName === "string" ? body.fileName : ""
    const filePath = typeof body.filePath === "string" ? body.filePath : ""
    const storageKey = typeof body.storageKey === "string" ? body.storageKey : ""

    if (!teamMemberId || !fileName || !filePath) {
      return NextResponse.json(
        { error: "teamMemberId, fileName, and filePath are required" },
        { status: 400 }
      )
    }

    const mirrorSourceUrl = storageKey
      ? `${getStorageBucketUrl().replace(/\/$/, "")}/${storageKey}`
      : null
    if (mirrorSourceUrl && mirrorSourceUrl !== filePath) {
      return NextResponse.json(
        { error: "storageKey does not match filePath" },
        { status: 400 },
      )
    }

    if (!storageKey || !mirrorSourceUrl) {
      return NextResponse.json(
        { error: "storageKey is required for uploaded photos" },
        { status: 400 },
      )
    }

    const mirror = await finalizePresignedImage({
      key: storageKey,
      sourceUrl: mirrorSourceUrl,
    })

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

    return NextResponse.json({ photo, deliveryUrl: mirror.deliveryUrl })
  } catch (error) {
    console.error("Error saving team member photo:", error)
    return NextResponse.json(
      { error: "Failed to save team member photo" },
      { status: 500 }
    )
  }
}
