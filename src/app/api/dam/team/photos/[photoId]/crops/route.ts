import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { eq } from "drizzle-orm"
import { getRouteParam } from "@/lib/server/getRouteParam"
import { requireAuth, UnauthorizedError, ForbiddenError } from "@/lib/server/dam-auth"

export async function POST(request: NextRequest, context: any) {
  try {
    // Require authentication
    await requireAuth()

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

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Error saving crops:", error)
    return NextResponse.json(
      { error: "Failed to save crop settings" },
      { status: 500 }
    )
  }
}
