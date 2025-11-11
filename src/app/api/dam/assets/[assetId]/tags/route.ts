import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assetTags } from "@/db/schema/asset_tags"
import { eq } from "drizzle-orm"

// Update tags for a single asset
export async function POST(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    const body = await request.json()
    const { tagIds } = body // Array of tag IDs to apply

    const db = getDb()

    // Delete existing tags for this asset
    await db.delete(assetTags).where(eq(assetTags.assetId, params.assetId))

    // Insert new tags
    if (tagIds && tagIds.length > 0) {
      await db.insert(assetTags).values(
        tagIds.map((tagId: string) => ({
          assetId: params.assetId,
          tagId
        }))
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating asset tags:", error)
    return NextResponse.json(
      { error: "Failed to update tags" },
      { status: 500 }
    )
  }
}
