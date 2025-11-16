import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assets } from "@/db/schema/assets"
import { inArray } from "drizzle-orm"
import { requireAuth, UnauthorizedError, ForbiddenError } from "@/lib/server/dam-auth"

// Remove team member from multiple assets
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()

    const body = await request.json()
    const { assetIds } = body

    if (!assetIds || assetIds.length === 0) {
      return NextResponse.json(
        { error: "Asset IDs required" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Set teamMemberId to null for these assets with audit tracking
    await db
      .update(assets)
      .set({
        teamMemberId: null,
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
    console.error("Error removing team member:", error)
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    )
  }
}
