import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assetTags } from "@/db/schema/asset_tags"
import { assets } from "@/db/schema/assets"
import { tags } from "@/db/schema/tags"
import { eq, inArray } from "drizzle-orm"
import { getRouteParam } from "@/lib/server/getRouteParam"
import { requireAuth, requireCollectionAccess, UnauthorizedError, ForbiddenError } from "@/lib/server/dam-auth"

export async function POST(request: NextRequest, context: any) {
  try {
    // Require authentication
    const user = await requireAuth()

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

    // Validate collection access for the tags being applied
    if (tagIds && tagIds.length > 0) {
      const tagMeta = await db
        .select({
          id: tags.id,
          categoryId: tags.categoryId
        })
        .from(tags)
        .where(inArray(tags.id, tagIds))

      const categoryIds = Array.from(
        new Set(
          tagMeta
            .map((tag) => tag.categoryId)
            .filter((categoryId): categoryId is string => Boolean(categoryId))
        )
      )

      // Check if user has edit access to all affected collections
      for (const categoryId of categoryIds) {
        await requireCollectionAccess(categoryId, 'edit')
      }
    }

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

    // Update modifiedBy and modifiedAt
    await db
      .update(assets)
      .set({
        modifiedBy: user.id,
        modifiedAt: new Date()
      })
      .where(eq(assets.id, assetId))

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Error updating asset tags:", error)
    return NextResponse.json(
      { error: "Failed to update tags" },
      { status: 500 }
    )
  }
}
