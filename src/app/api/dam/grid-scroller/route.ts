/**
 * API route for fetching images tagged for the grid scroller component
 * Category: website/grid-scroller
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { assets } from '@/db/schema/assets'
import { assetTags } from '@/db/schema/asset_tags'
import { tags } from '@/db/schema/tags'
import { tagCategories } from '@/db/schema/tag_categories'
import { eq, and, inArray } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const db = getDb()

    // Find the 'website' category
    const [websiteCategory] = await db
      .select()
      .from(tagCategories)
      .where(eq(tagCategories.name, 'website'))
      .limit(1)

    if (!websiteCategory) {
      // Category doesn't exist yet - return empty array
      // Once DAM team creates it, this will start returning images
      return NextResponse.json({
        images: [],
        message: 'Category "website" not found. Please create it in the DAM.',
      })
    }

    // Find the 'grid-scroller' tag under 'website' category
    const [gridScrollerTag] = await db
      .select()
      .from(tags)
      .where(
        and(
          eq(tags.categoryId, websiteCategory.id),
          eq(tags.name, 'grid-scroller')
        )
      )
      .limit(1)

    if (!gridScrollerTag) {
      return NextResponse.json({
        images: [],
        message:
          'Tag "grid-scroller" not found under "website" category. Please create it in the DAM.',
      })
    }

    // Fetch all assets with the grid-scroller tag
    const taggedAssets = await db
      .select({
        assetId: assetTags.assetId,
        tagId: assetTags.tagId,
      })
      .from(assetTags)
      .where(eq(assetTags.tagId, gridScrollerTag.id))

    if (taggedAssets.length === 0) {
      return NextResponse.json({
        images: [],
        message: 'No images tagged with "website/grid-scroller" yet.',
      })
    }

    // Fetch full asset details
    const assetIds = taggedAssets.map((ta) => ta.assetId)

    if (assetIds.length === 0) {
      return NextResponse.json({
        images: [],
        message: 'No assets found with grid-scroller tag',
      })
    }

    const filteredAssets = await db
      .select()
      .from(assets)
      .where(inArray(assets.id, assetIds))

    // Fetch all tags for these assets to check for 'key-image' tag
    const allAssetTags = await db
      .select({
        assetId: assetTags.assetId,
        tagId: assetTags.tagId,
        tagName: tags.name,
      })
      .from(assetTags)
      .leftJoin(tags, eq(assetTags.tagId, tags.id))
      .where(inArray(assetTags.assetId, assetIds))

    // Group tags by asset
    const assetTagsMap = new Map<string, string[]>()
    allAssetTags.forEach((row) => {
      if (!assetTagsMap.has(row.assetId)) {
        assetTagsMap.set(row.assetId, [])
      }
      if (row.tagName) {
        assetTagsMap.get(row.assetId)!.push(row.tagName)
      }
    })

    // Transform assets to GridImage format
    const images = filteredAssets.map((asset) => {
      const assetTagNames = assetTagsMap.get(asset.id) || []
      const isKeyImage = assetTagNames.includes('key-image')

      // TODO: Extract actual dimensions from asset metadata
      // For now, use placeholder aspect ratios
      const aspectRatio = 0.75 // Portrait default

      return {
        id: asset.id,
        url: asset.filePath,
        aspectRatio,
        isKeyImage,
        alt: asset.fileName,
        width: 800,
        height: Math.round(800 / aspectRatio),
      }
    })

    return NextResponse.json({
      images,
      count: images.length,
      keyImage: images.find((img) => img.isKeyImage),
    })
  } catch (error) {
    console.error('Error fetching grid-scroller images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grid-scroller images' },
      { status: 500 }
    )
  }
}
