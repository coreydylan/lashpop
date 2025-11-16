import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { eq, desc } from "drizzle-orm"
import { getRouteParam } from "@/lib/server/getRouteParam"
import { requireAuth, UnauthorizedError, ForbiddenError } from "@/lib/server/dam-auth"

export async function GET(request: NextRequest, context: any) {
  try {
    // Require authentication
    await requireAuth()

    const memberId = await getRouteParam(context, "memberId")
    if (!memberId) {
      return NextResponse.json(
        { error: "Missing memberId" },
        { status: 400 }
      )
    }

    const db = getDb()

    const photos = await db
      .select()
      .from(teamMemberPhotos)
      .where(eq(teamMemberPhotos.teamMemberId, memberId))
      .orderBy(desc(teamMemberPhotos.isPrimary), desc(teamMemberPhotos.uploadedAt))

    return NextResponse.json({ photos })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Error fetching photos:", error)
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    )
  }
}
