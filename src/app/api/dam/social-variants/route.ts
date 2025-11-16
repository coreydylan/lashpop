/**
 * Query Social Media Variants Endpoint
 *
 * GET /api/dam/social-variants
 *
 * Retrieves social media variants with optional filtering by platform,
 * source asset, export status, and creation date.
 *
 * Query Parameters:
 *   - platform: Filter by social platform (e.g., "instagram")
 *   - sourceAssetId: Filter by source asset ID
 *   - exported: Filter by export status (true/false)
 *   - createdAfter: Filter by creation date (ISO 8601 format)
 *
 * Example curl:
 * curl http://localhost:3000/api/dam/social-variants?platform=instagram&exported=false
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { assets } from '@/db/schema/assets'
import { assetTags } from '@/db/schema/asset_tags'
import { tags } from '@/db/schema/tags'
import { tagCategories } from '@/db/schema/tag_categories'
import { eq, desc, gte, and, like } from 'drizzle-orm'
import { QueryVariantsResponse, SocialVariantAsset, SocialPlatform } from '@/types/social-variants'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') as SocialPlatform | null
    const sourceAssetId = searchParams.get('sourceAssetId')
    const exported = searchParams.get('exported')
    const createdAfter = searchParams.get('createdAfter')

    const db = getDb()

    // Build filters
    const filters: any[] = []

    // Filter for social variants - they should have "social-variant" tag or caption containing platform info
    // For now, we'll look for assets with captions that look like social variant metadata
    if (platform) {
      // Filter by platform tag
      filters.push(like(assets.caption, `%"platform":"${platform}"%`))
    }

    if (sourceAssetId) {
      filters.push(like(assets.caption, `%"sourceAssetId":"${sourceAssetId}"%`))
    }

    if (createdAfter) {
      const date = new Date(createdAfter)
      if (!isNaN(date.getTime())) {
        filters.push(gte(assets.uploadedAt, date))
      }
    }

    // Fetch assets
    let query = db
      .select()
      .from(assets)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(assets.uploadedAt))

    const variantAssets = await query

    // Fetch tags for these assets
    const assetIds = variantAssets.map(a => a.id)
    let assetTagsData: any[] = []

    if (assetIds.length > 0) {
      assetTagsData = await db
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
    }

    // Group tags by asset
    const assetTagsMap = new Map<string, any[]>()
    assetTagsData.forEach((row) => {
      if (!assetTagsMap.has(row.assetId)) {
        assetTagsMap.set(row.assetId, [])
      }
      assetTagsMap.get(row.assetId)!.push({
        id: row.tagId,
        name: row.tagName,
        displayName: row.tagDisplayName
      })
    })

    // Transform to SocialVariantAsset type
    const variants: SocialVariantAsset[] = variantAssets.map((asset) => {
      // Parse caption to extract metadata
      let metadata: any = {}
      try {
        if (asset.caption) {
          metadata = JSON.parse(asset.caption)
        }
      } catch (e) {
        // Caption is not JSON, skip
      }

      return {
        id: asset.id,
        fileName: asset.fileName,
        filePath: asset.filePath,
        fileType: asset.fileType as 'image' | 'video',
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        width: asset.width || 0,
        height: asset.height || 0,

        // Social variant-specific fields from metadata
        sourceAssetId: metadata.sourceAssetId || '',
        platform: metadata.platform || SocialPlatform.INSTAGRAM,
        variant: metadata.variant || '',
        ratio: metadata.cropData?.width && metadata.cropData?.height
          ? `${metadata.cropData.width}:${metadata.cropData.height}`
          : '1:1',
        cropStrategy: metadata.cropStrategy || 'smart_crop',
        crop: metadata.cropData,
        validationScore: metadata.validationScore || 0,
        validationWarnings: metadata.validationWarnings,

        // Export tracking - would come from a separate field if implemented
        exported: false,
        exportedAt: undefined,
        exportedTo: undefined,

        // Timestamps
        uploadedAt: asset.uploadedAt,
        updatedAt: asset.updatedAt,

        // Optional fields
        altText: asset.altText || undefined,
        teamMemberId: asset.teamMemberId,

        // Tags
        tags: assetTagsMap.get(asset.id) || []
      }
    })

    // Apply exported filter if specified (currently always false)
    let filteredVariants = variants
    if (exported !== null) {
      const exportedBool = exported === 'true'
      filteredVariants = variants.filter(v => v.exported === exportedBool)
    }

    const response: QueryVariantsResponse = {
      variants: filteredVariants,
      total: filteredVariants.length,
      filters: {
        platform: platform || undefined,
        sourceAssetId: sourceAssetId || undefined,
        exported: exported ? (exported === 'true') : undefined,
        createdAfter: createdAfter || undefined
      }
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error querying social variants:', error)
    return NextResponse.json(
      {
        error: 'Failed to query social variants',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
