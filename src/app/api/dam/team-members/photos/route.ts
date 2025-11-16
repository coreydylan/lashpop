import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { requireAuth, requirePermission, UnauthorizedError, ForbiddenError } from "@/lib/server/dam-auth"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Require authentication and upload permission
    await requireAuth()
    await requirePermission('canUpload')

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
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Error saving team member photo:", error)
    return NextResponse.json(
      { error: "Failed to save team member photo" },
      { status: 500 }
    )
  }
}
