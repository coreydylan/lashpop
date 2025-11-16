import { NextResponse } from "next/server"
import { getDb } from "@/db"
import { assets } from "@/db/schema/assets"
import { assetTags } from "@/db/schema/asset_tags"
import { tags } from "@/db/schema/tags"
import { tagCategories } from "@/db/schema/tag_categories"
import { teamMembers } from "@/db/schema/team_members"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { eq, desc, and, inArray } from "drizzle-orm"
import { getCurrentUserId, getAccessibleResources, getResourceShares } from "@/lib/permissions"

/**
 * Combined initial data endpoint for DAM
 * Fetches assets, tags, and team members in a single request
 * Improves initial page load performance by reducing round trips
 */
export async function GET() {
  try {
    // Get current user and their accessible resources
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const [accessibleAssetIds, accessibleCollectionIds] = await Promise.all([
      getAccessibleResources(userId, "asset"),
      getAccessibleResources(userId, "collection"),
    ])

    const db = getDb()

    // Fetch all datasets in parallel, filtered by user access
    const [allAssets, allAssetTags, allTagCategories, allTeamMembers] = await Promise.all([
      // 1. Fetch accessible assets
      accessibleAssetIds.length > 0
        ? db
            .select()
            .from(assets)
            .where(inArray(assets.id, accessibleAssetIds))
            .orderBy(desc(assets.uploadedAt))
        : Promise.resolve([]),

      // 2. Fetch asset tags with category info
      db
        .select({
          assetId: assetTags.assetId,
          tagId: assetTags.tagId,
          tagName: tags.name,
          tagDisplayName: tags.displayName,
          categoryId: tags.categoryId,
          categoryName: tagCategories.name,
          categoryDisplayName: tagCategories.displayName,
          categoryColor: tagCategories.color
        })
        .from(assetTags)
        .leftJoin(tags, eq(assetTags.tagId, tags.id))
        .leftJoin(tagCategories, eq(tags.categoryId, tagCategories.id)),

      // 3. Fetch accessible tag categories (collections)
      accessibleCollectionIds.length > 0
        ? db
            .select()
            .from(tagCategories)
            .where(inArray(tagCategories.id, accessibleCollectionIds))
            .orderBy(tagCategories.sortOrder)
        : Promise.resolve([]),

      // 4. Fetch team members with primary photos
      db
        .select({
          id: teamMembers.id,
          name: teamMembers.name,
          imageUrl: teamMembers.imageUrl,
          cropCloseUpCircle: teamMemberPhotos.cropCloseUpCircle,
          cropSquare: teamMemberPhotos.cropSquare,
          cropMediumCircle: teamMemberPhotos.cropMediumCircle
        })
        .from(teamMembers)
        .leftJoin(
          teamMemberPhotos,
          and(
            eq(teamMemberPhotos.teamMemberId, teamMembers.id),
            eq(teamMemberPhotos.isPrimary, true)
          )
        )
        .where(eq(teamMembers.isActive, true))
        .orderBy(teamMembers.displayOrder)
    ])

    // Group tags by asset
    const assetTagsMap = new Map<string, any[]>()
    allAssetTags.forEach((row) => {
      if (!assetTagsMap.has(row.assetId)) {
        assetTagsMap.set(row.assetId, [])
      }
      assetTagsMap.get(row.assetId)!.push({
        id: row.tagId,
        name: row.tagName,
        displayName: row.tagDisplayName,
        category: {
          id: row.categoryId,
          name: row.categoryName,
          displayName: row.categoryDisplayName,
          color: row.categoryColor
        }
      })
    })

    // Attach tags to assets
    const assetsWithTags = allAssets.map((asset) => ({
      ...asset,
      tags: assetTagsMap.get(asset.id) || []
    }))

    // Fetch tags for each category
    const allTags = await db
      .select()
      .from(tags)
      .orderBy(tags.displayName)

    const categoriesWithTags = allTagCategories.map((category) => ({
      ...category,
      tags: allTags.filter((tag) => tag.categoryId === category.id)
    }))

    // Get sharing metadata for owned resources
    const [assetShares, collectionShares] = await Promise.all([
      getResourceShares(userId, "asset", accessibleAssetIds),
      getResourceShares(userId, "collection", accessibleCollectionIds),
    ])

    // Attach sharing metadata to assets
    const assetsWithSharing = assetsWithTags.map((asset) => ({
      ...asset,
      shares: assetShares.get(asset.id) || [],
      isOwner: asset.ownerId === userId,
    }))

    // Attach sharing metadata to categories
    const categoriesWithSharing = categoriesWithTags.map((category) => ({
      ...category,
      shares: collectionShares.get(category.id) || [],
      isOwner: category.ownerId === userId,
    }))

    // Return all data in one response
    return NextResponse.json({
      assets: assetsWithSharing,
      categories: categoriesWithSharing,
      teamMembers: allTeamMembers
    }, {
      headers: {
        'Cache-Control': 's-maxage=30, stale-while-revalidate=60'
      }
    })
  } catch (error) {
    console.error("Error fetching initial DAM data:", error)
    return NextResponse.json(
      { error: "Failed to fetch initial data" },
      { status: 500 }
    )
  }
}
