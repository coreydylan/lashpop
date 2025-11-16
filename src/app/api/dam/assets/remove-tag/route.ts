import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assetTags } from "@/db/schema/asset_tags"
import { assets } from "@/db/schema/assets"
import { tags } from "@/db/schema/tags"
import { and, inArray, eq } from "drizzle-orm"
import { requireAuth, requireCollectionAccess, UnauthorizedError, ForbiddenError } from "@/lib/server/dam-auth"

// Remove a specific tag from multiple assets
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()

    const body = await request.json()
    const { assetIds, tagId } = body

    if (!assetIds || assetIds.length === 0 || !tagId) {
      return NextResponse.json(
        { error: "Asset IDs and tag ID required" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Get tag category for access validation
    const tagInfo = await db
      .select({ categoryId: tags.categoryId })
      .from(tags)
      .where(eq(tags.id, tagId))
      .limit(1)

    if (tagInfo.length > 0 && tagInfo[0].categoryId) {
      // Check if user has edit access to this collection
      await requireCollectionAccess(tagInfo[0].categoryId, 'edit')
    }

    // Delete the specific tag from these assets
    await db
      .delete(assetTags)
      .where(
        and(
          inArray(assetTags.assetId, assetIds),
          eq(assetTags.tagId, tagId)
        )
      )

    // Update modifiedBy and modifiedAt for all affected assets
    const now = new Date()
    for (const assetId of assetIds) {
      await db
        .update(assets)
        .set({
          modifiedBy: user.id,
          modifiedAt: now
        })
        .where(eq(assets.id, assetId))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Error removing tag:", error)
    return NextResponse.json(
      { error: "Failed to remove tag" },
      { status: 500 }
    )
  }
}
