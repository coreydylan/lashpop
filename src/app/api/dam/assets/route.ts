import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assets } from "@/db/schema/assets"
import { assetTags } from "@/db/schema/asset_tags"
import { tags } from "@/db/schema/tags"
import { tagCategories } from "@/db/schema/tag_categories"
import { eq, desc } from "drizzle-orm"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamMemberId = searchParams.get("teamMemberId")

    const db = getDb()
    const allAssets = await db
      .select()
      .from(assets)
      .orderBy(desc(assets.uploadedAt))

    // Fetch all asset tags
    const allAssetTags = await db
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
      .leftJoin(tagCategories, eq(tags.categoryId, tagCategories.id))

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

    // Apply filters
    let filteredAssets = assetsWithTags

    if (teamMemberId) {
      filteredAssets = filteredAssets.filter(
        (asset) => asset.teamMemberId === teamMemberId
      )
    }

    return NextResponse.json({ assets: filteredAssets }, {
      headers: {
        'Cache-Control': 's-maxage=30, stale-while-revalidate=60'
      }
    })
  } catch (error) {
    console.error("Error fetching assets:", error)
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileName, filePath, fileType, mimeType, fileSize, teamMemberId } = body

    if (!fileName || !filePath || !fileType || !mimeType || fileSize === undefined) {
      return NextResponse.json(
        { error: "fileName, filePath, fileType, mimeType, and fileSize are required" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Insert asset metadata
    const [asset] = await db
      .insert(assets)
      .values({
        fileName,
        filePath,
        fileType,
        mimeType,
        fileSize,
        teamMemberId: teamMemberId || null
      })
      .returning()

    return NextResponse.json({ asset })
  } catch (error) {
    console.error("Error saving asset metadata:", error)
    return NextResponse.json(
      { error: "Failed to save asset metadata" },
      { status: 500 }
    )
  }
}
