/**
 * Save Social Media Variants Endpoint
 *
 * POST /api/dam/social-variants/save
 *
 * Saves generated social media variants to the database and optionally
 * creates a collection to organize them.
 *
 * Example curl:
 * curl -X POST http://localhost:3000/api/dam/social-variants/save \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "sourceAssetId": "123e4567-e89b-12d3-a456-426614174000",
 *     "variants": [{
 *       "platform": "instagram",
 *       "variant": "square",
 *       "s3Key": "social-variants/.../instagram/square/...",
 *       "validationScore": 85
 *     }],
 *     "tags": ["social-media", "instagram"]
 *   }'
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { assets } from '@/db/schema/assets'
import { assetTags } from '@/db/schema/asset_tags'
import { tags } from '@/db/schema/tags'
import { eq, and } from 'drizzle-orm'
import { SaveVariantsRequest, SaveVariantsResponse } from '@/types/social-variants'
import { BUCKET_URL } from '@/lib/dam/s3-client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body: SaveVariantsRequest = await request.json()
    const { sourceAssetId, variants, collectionName, tags: tagNames } = body

    // Validate required fields
    if (!sourceAssetId || !variants || variants.length === 0) {
      return NextResponse.json(
        { error: 'sourceAssetId and variants are required' },
        { status: 400 }
      )
    }

    const db = getDb()
    const savedAssetIds: string[] = []

    // Verify source asset exists
    const [sourceAsset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, sourceAssetId))
      .limit(1)

    if (!sourceAsset) {
      return NextResponse.json(
        { error: 'Source asset not found' },
        { status: 404 }
      )
    }

    console.log(`Saving ${variants.length} variants for source asset ${sourceAssetId}`)

    // Save each variant as a new asset
    for (const variant of variants) {
      try {
        const fileName = `${sourceAsset.fileName.replace(/\.[^/.]+$/, '')}_${variant.platform}_${variant.variant}.jpg`

        // Calculate dimensions from crop data if available
        const width = variant.cropData?.width || 1080
        const height = variant.cropData?.height || 1080

        // Insert asset record
        const [savedAsset] = await db
          .insert(assets)
          .values({
            fileName,
            filePath: variant.s3Key,
            fileType: 'image',
            mimeType: 'image/jpeg',
            fileSize: 0, // We don't have file size from generate step, will be 0
            width,
            height,
            teamMemberId: sourceAsset.teamMemberId,
            altText: `${sourceAsset.altText || sourceAsset.fileName} - ${variant.platform} ${variant.variant}`,
            caption: JSON.stringify({
              sourceAssetId,
              platform: variant.platform,
              variant: variant.variant,
              cropData: variant.cropData,
              validationScore: variant.validationScore
            })
          })
          .returning()

        savedAssetIds.push(savedAsset.id)

        // Auto-tag with platform and variant type
        const autoTags = [
          `social:${variant.platform}`,
          `variant:${variant.variant}`,
          'social-variant'
        ]

        if (tagNames) {
          autoTags.push(...tagNames)
        }

        // Find or create tags and associate them
        for (const tagName of autoTags) {
          // Try to find existing tag
          const [existingTag] = await db
            .select()
            .from(tags)
            .where(eq(tags.name, tagName))
            .limit(1)

          let tagId: string

          if (existingTag) {
            tagId = existingTag.id
          } else {
            // Create new tag
            const [newTag] = await db
              .insert(tags)
              .values({
                name: tagName,
                displayName: tagName
                  .split(':')
                  .pop()!
                  .replace(/-/g, ' ')
                  .replace(/\b\w/g, l => l.toUpperCase()),
                categoryId: null // Default category
              })
              .returning()

            tagId = newTag.id
          }

          // Associate tag with asset
          await db
            .insert(assetTags)
            .values({
              assetId: savedAsset.id,
              tagId
            })
            .onConflictDoNothing()
        }

        console.log(`Saved variant ${variant.platform}/${variant.variant} as asset ${savedAsset.id}`)
      } catch (error) {
        console.error(`Failed to save variant ${variant.platform}/${variant.variant}:`, error)
        // Continue with other variants even if one fails
      }
    }

    if (savedAssetIds.length === 0) {
      return NextResponse.json(
        { error: 'Failed to save any variants' },
        { status: 500 }
      )
    }

    // TODO: Create collection if collectionName is provided
    // This requires a collections table which may not exist yet
    let collectionId: string | undefined

    const response: SaveVariantsResponse = {
      saved: savedAssetIds.length,
      assetIds: savedAssetIds,
      collectionId
    }

    console.log(`Successfully saved ${savedAssetIds.length} variants`)

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error saving social variants:', error)
    return NextResponse.json(
      {
        error: 'Failed to save social variants',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
