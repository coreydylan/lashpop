import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { eq } from "drizzle-orm"
import { getRouteParam } from "@/lib/server/getRouteParam"
import { requireAdminApi } from "@/lib/admin/auth"
import { recordAdminAction } from "@/lib/admin/audit"

type PhotoRouteContext = {
  params: Promise<{ photoId: string }>
}

export async function POST(request: NextRequest, context: PhotoRouteContext) {
  const auth = await requireAdminApi(["owner", "publisher"])
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { crops } = body
    const photoId = await getRouteParam(context, "photoId")

    if (!photoId) {
      return NextResponse.json(
        { error: "Missing photoId" },
        { status: 400 }
      )
    }

    const db = getDb()
    const [before] = await db
      .select({
        id: teamMemberPhotos.id,
        teamMemberId: teamMemberPhotos.teamMemberId,
        fullVertical: teamMemberPhotos.cropFullVertical,
        fullHorizontal: teamMemberPhotos.cropFullHorizontal,
        mediumCircle: teamMemberPhotos.cropMediumCircle,
        closeUpCircle: teamMemberPhotos.cropCloseUpCircle,
        square: teamMemberPhotos.cropSquare,
      })
      .from(teamMemberPhotos)
      .where(eq(teamMemberPhotos.id, photoId))

    await db
      .update(teamMemberPhotos)
      .set({
        cropFullVertical: crops.fullVertical,
        cropFullHorizontal: crops.fullHorizontal,
        cropMediumCircle: crops.mediumCircle,
        cropCloseUpCircle: crops.closeUpCircle,
        cropSquare: crops.square,
        updatedAt: new Date()
      })
      .where(eq(teamMemberPhotos.id, photoId))

    const [after] = await db
      .select({
        id: teamMemberPhotos.id,
        teamMemberId: teamMemberPhotos.teamMemberId,
        fullVertical: teamMemberPhotos.cropFullVertical,
        fullHorizontal: teamMemberPhotos.cropFullHorizontal,
        mediumCircle: teamMemberPhotos.cropMediumCircle,
        closeUpCircle: teamMemberPhotos.cropCloseUpCircle,
        square: teamMemberPhotos.cropSquare,
      })
      .from(teamMemberPhotos)
      .where(eq(teamMemberPhotos.id, photoId))

    await recordAdminAction({
      action: "dam.team.photo.crops.update",
      surface: "dam",
      targetType: "team_member_photo",
      targetId: photoId,
      actorUserId: auth.userId,
      diff: {
        teamMemberId: after?.teamMemberId ?? before?.teamMemberId ?? null,
        before: before ?? null,
        after: after ?? null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving crops:", error)
    return NextResponse.json(
      { error: "Failed to save crop settings" },
      { status: 500 }
    )
  }
}
