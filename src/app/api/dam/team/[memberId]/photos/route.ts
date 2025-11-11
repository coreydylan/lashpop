import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { eq, desc } from "drizzle-orm"
import { getRouteParam } from "@/lib/server/getRouteParam"

export async function GET(request: NextRequest, context: any) {
  try {
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
    console.error("Error fetching photos:", error)
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    )
  }
}
