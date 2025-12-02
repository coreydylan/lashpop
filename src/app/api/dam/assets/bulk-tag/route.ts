import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assetTags } from "@/db/schema/asset_tags"
import { tags } from "@/db/schema/tags"
import { tagCategories } from "@/db/schema/tag_categories"
import { and, inArray, eq, sql } from "drizzle-orm"

// Update tags for multiple assets at once
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assetIds, tagIds, additive = false } = body // Arrays of asset IDs and tag IDs

    if (!assetIds || assetIds.length === 0) {
      return NextResponse.json(
        { error: "No assets specified" },
        { status: 400 }
      )
    }

    const db = getDb()

    // If not additive, delete existing tags for these assets
    if (!additive) {
      await db.delete(assetTags).where(inArray(assetTags.assetId, assetIds))
    }

    // Handle selection mode enforcement based on category settings
    if (tagIds && tagIds.length > 0) {
      // Get tag metadata with category info
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
        // Get category settings including selectionMode
        const categoriesData = await db
          .select({
            id: tagCategories.id,
            isRating: tagCategories.isRating,
            selectionMode: tagCategories.selectionMode,
            selectionLimit: tagCategories.selectionLimit
          })
          .from(tagCategories)
          .where(inArray(tagCategories.id, categoryIds))

        // Handle single-select categories (selectionMode='single' or isRating=true)
        // Remove all existing tags from this category before adding new one
        const singleSelectCategoryIds = categoriesData
          .filter(cat => cat.selectionMode === 'single' || cat.isRating)
          .map(cat => cat.id)

        if (singleSelectCategoryIds.length > 0) {
          const conflictingTags = await db
            .select({ id: tags.id })
            .from(tags)
            .where(inArray(tags.categoryId, singleSelectCategoryIds))

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

        // Handle limited-select categories (selectionMode='limited')
        // Keep only the newest tags up to the limit
        const limitedCategories = categoriesData.filter(
          cat => cat.selectionMode === 'limited' && cat.selectionLimit && cat.selectionLimit > 0
        )

        for (const category of limitedCategories) {
          const limit = category.selectionLimit!
          const categoryTagIds = tagMeta
            .filter(t => t.categoryId === category.id)
            .map(t => t.id)

          // For each asset, check if adding new tags would exceed the limit
          for (const assetId of assetIds) {
            // Count existing tags from this category
            const existingTagsResult = await db
              .select({ tagId: assetTags.tagId })
              .from(assetTags)
              .innerJoin(tags, eq(assetTags.tagId, tags.id))
              .where(
                and(
                  eq(assetTags.assetId, assetId),
                  eq(tags.categoryId, category.id)
                )
              )

            const existingTagIds = existingTagsResult.map(r => r.tagId)
            const newTagsToAdd = categoryTagIds.filter(id => !existingTagIds.includes(id))
            const totalAfterAdd = existingTagIds.length + newTagsToAdd.length

            // If we'd exceed the limit, remove oldest tags to make room
            if (totalAfterAdd > limit) {
              const tagsToRemoveCount = totalAfterAdd - limit
              // Remove oldest existing tags (keep the newest ones)
              const oldestTags = await db
                .select({ id: assetTags.id, tagId: assetTags.tagId })
                .from(assetTags)
                .innerJoin(tags, eq(assetTags.tagId, tags.id))
                .where(
                  and(
                    eq(assetTags.assetId, assetId),
                    eq(tags.categoryId, category.id)
                  )
                )
                .orderBy(assetTags.createdAt)
                .limit(tagsToRemoveCount)

              if (oldestTags.length > 0) {
                const idsToRemove = oldestTags.map(t => t.id)
                await db
                  .delete(assetTags)
                  .where(inArray(assetTags.id, idsToRemove))
              }
            }
          }
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error bulk updating tags:", error)
    return NextResponse.json(
      { error: "Failed to update tags" },
      { status: 500 }
    )
  }
}
