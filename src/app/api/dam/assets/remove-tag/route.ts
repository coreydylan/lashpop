import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assetTags } from "@/db/schema/asset_tags"
import { and, inArray, eq } from "drizzle-orm"

// Remove a specific tag from multiple assets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assetIds, tagId } = body

    if (!assetIds || assetIds.length === 0 || !tagId) {
      return NextResponse.json(
        { error: "Asset IDs and tag ID required" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Delete the specific tag from these assets
    await db
      .delete(assetTags)
      .where(
        and(
          inArray(assetTags.assetId, assetIds),
          eq(assetTags.tagId, tagId)
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing tag:", error)
    return NextResponse.json(
      { error: "Failed to remove tag" },
      { status: 500 }
    )
  }
}
