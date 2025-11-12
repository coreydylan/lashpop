import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamMemberId, fileName, filePath } = body

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

    return NextResponse.json({ photo })
  } catch (error) {
    console.error("Error saving team member photo:", error)
    return NextResponse.json(
      { error: "Failed to save team member photo" },
      { status: 500 }
    )
  }
}
