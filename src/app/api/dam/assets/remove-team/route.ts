import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assets } from "@/db/schema/assets"
import { inArray } from "drizzle-orm"

// Remove team member from multiple assets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assetIds } = body

    if (!assetIds || assetIds.length === 0) {
      return NextResponse.json(
        { error: "Asset IDs required" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Set teamMemberId to null for these assets
    await db
      .update(assets)
      .set({ teamMemberId: null })
      .where(inArray(assets.id, assetIds))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing team member:", error)
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    )
  }
}
