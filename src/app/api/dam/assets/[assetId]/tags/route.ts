import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assetTags } from "@/db/schema/asset_tags"
import { eq } from "drizzle-orm"
import { getRouteParam } from "@/lib/server/getRouteParam"

export async function POST(request: NextRequest, context: any) {
  try {
    const body = await request.json()
    const { tagIds } = body // Array of tag IDs to apply
    const assetId = await getRouteParam(context, "assetId")

    if (!assetId) {
      return NextResponse.json(
        { error: "Missing assetId" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Delete existing tags for this asset
    await db.delete(assetTags).where(eq(assetTags.assetId, assetId))

    // Insert new tags
    if (tagIds && tagIds.length > 0) {
      await db.insert(assetTags).values(
        tagIds.map((tagId: string) => ({
          assetId,
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
