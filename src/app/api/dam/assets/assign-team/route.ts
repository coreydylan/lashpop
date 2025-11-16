import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assets } from "@/db/schema/assets"
import { inArray } from "drizzle-orm"
import { requireAuth, UnauthorizedError, ForbiddenError } from "@/lib/server/dam-auth"

// Assign team member to multiple assets
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()

    const body = await request.json()
    const { assetIds, teamMemberId } = body

    if (!assetIds || assetIds.length === 0 || !teamMemberId) {
      return NextResponse.json(
        { error: "Asset IDs and team member ID required" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Set teamMemberId for these assets with audit tracking
    await db
      .update(assets)
      .set({
        teamMemberId,
        modifiedBy: user.id,
        modifiedAt: new Date()
      })
      .where(inArray(assets.id, assetIds))

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Error assigning team member:", error)
    return NextResponse.json(
      { error: "Failed to assign team member" },
      { status: 500 }
    )
  }
}
