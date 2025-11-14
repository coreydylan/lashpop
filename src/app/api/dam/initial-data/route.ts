import { NextResponse } from "next/server"
import { getDb } from "@/db"
import { assets } from "@/db/schema/assets"
import { assetTags } from "@/db/schema/asset_tags"
import { tags } from "@/db/schema/tags"
import { tagCategories } from "@/db/schema/tag_categories"
import { teamMembers } from "@/db/schema/team_members"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { eq, desc, and } from "drizzle-orm"

/**
 * Combined initial data endpoint for DAM
 * Fetches assets, tags, and team members in a single request
 * Improves initial page load performance by reducing round trips
 */
export async function GET() {
  try {
    const db = getDb()

    // Fetch all three datasets in parallel
    const [allAssets, allAssetTags, allTagCategories, allTeamMembers] = await Promise.all([
      // 1. Fetch assets
      db
        .select()
        .from(assets)
        .orderBy(desc(assets.uploadedAt)),

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

      // 3. Fetch tag categories with tags
      db
        .select()
        .from(tagCategories)
        .orderBy(tagCategories.sortOrder),

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

    // Return all data in one response
    return NextResponse.json({
      assets: assetsWithTags,
      categories: categoriesWithTags,
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
