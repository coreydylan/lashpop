import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assetTags } from "@/db/schema/asset_tags"
import { assets } from "@/db/schema/assets"
import { tags } from "@/db/schema/tags"
import { and, inArray, eq } from "drizzle-orm"
import { requireAuth, requireCollectionAccess, UnauthorizedError, ForbiddenError } from "@/lib/server/dam-auth"

// Update tags for multiple assets at once
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()

    const body = await request.json()
    const { assetIds, tagIds, additive = false } = body // Arrays of asset IDs and tag IDs

    if (!assetIds || assetIds.length === 0) {
      return NextResponse.json(
        { error: "No assets specified" },
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

    // If not additive, delete existing tags for these assets
    if (!additive) {
      await db.delete(assetTags).where(inArray(assetTags.assetId, assetIds))
    }

    // Always ensure only one tag per category by removing conflicting tags
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

      if (categoryIds.length > 0) {
        const conflictingTags = await db
          .select({ id: tags.id })
          .from(tags)
          .where(inArray(tags.categoryId, categoryIds))

        const conflictingTagIds = conflictingTags.map((entry) => entry.id)

        if (conflictingTagIds.length > 0) {
          await db
            .delete(assetTags)
            .where(
              and(
                inArray(assetTags.assetId, assetIds),
                inArray(assetTags.tagId, conflictingTagIds)
              )
            )
        }
      }
    }

    // Insert new tags for all assets
    if (tagIds && tagIds.length > 0) {
      const values = assetIds.flatMap((assetId: string) =>
        tagIds.map((tagId: string) => ({
          assetId,
          tagId
        }))
      )

      // Use onConflictDoNothing to prevent duplicate tag assignments when additive
      await db.insert(assetTags).values(values).onConflictDoNothing()
    }

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
    console.error("Error bulk updating tags:", error)
    return NextResponse.json(
      { error: "Failed to update tags" },
      { status: 500 }
    )
  }
}
