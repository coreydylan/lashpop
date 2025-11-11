import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assets } from "@/db/schema/assets"
import { inArray } from "drizzle-orm"

// Assign team member to multiple assets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assetIds, teamMemberId } = body

    if (!assetIds || assetIds.length === 0 || !teamMemberId) {
      return NextResponse.json(
        { error: "Asset IDs and team member ID required" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Set teamMemberId for these assets
    await db
      .update(assets)
      .set({ teamMemberId })
      .where(inArray(assets.id, assetIds))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error assigning team member:", error)
    return NextResponse.json(
      { error: "Failed to assign team member" },
      { status: 500 }
    )
  }
}
