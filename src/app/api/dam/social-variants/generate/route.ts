/**
 * Generate Social Media Variants Endpoint
 *
 * POST /api/dam/social-variants/generate
 *
 * Generates optimized social media variants from a source asset using
 * smart cropping algorithms. Returns preview URLs for user confirmation.
 *
 * Example curl:
 * curl -X POST http://localhost:3000/api/dam/social-variants/generate \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "sourceAssetId": "123e4567-e89b-12d3-a456-426614174000",
 *     "platforms": ["instagram", "facebook"],
 *     "cropStrategy": "smart_crop"
 *   }'
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { assets } from '@/db/schema/assets'
import { eq } from 'drizzle-orm'
import {
  GenerateVariantsRequest,
  GenerateVariantsResponse,
  GeneratedVariant,
  SocialPlatform,
  CropStrategy,
  getVariantSpecs
} from '@/types/social-variants'
import {
  downloadFromS3,
  uploadBufferToS3,
  generateSocialVariantKey,
  getPresignedDownloadUrl
} from '@/lib/dam/s3-client'
import { generateVariant, getImageMetadata } from '@/lib/dam/image-processor'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for batch processing

export async function POST(request: NextRequest) {
  try {
    const body: GenerateVariantsRequest = await request.json()
    const { sourceAssetId, platforms, variants: variantNames, cropStrategy, skipPreview } = body

    // Validate required fields
    if (!sourceAssetId || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'sourceAssetId and platforms are required' },
        { status: 400 }
      )
    }

    // Fetch source asset from database
    const db = getDb()
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

    // Download source image from S3
    console.log(`Downloading source asset: ${sourceAsset.filePath}`)
    const sourceBuffer = await downloadFromS3(sourceAsset.filePath)

    // Get image metadata
    const metadata = await getImageMetadata(sourceBuffer)

    // Get variant specifications based on requested platforms and variants
    const specs = getVariantSpecs(platforms, variantNames)

    if (specs.length === 0) {
      return NextResponse.json(
        { error: 'No valid variant specifications found for the requested platforms' },
        { status: 400 }
      )
    }

    // Generate all variants
    const generatedVariants: GeneratedVariant[] = []
    const strategy = cropStrategy || CropStrategy.SMART_CROP

    console.log(`Generating ${specs.length} variants with strategy: ${strategy}`)

    for (const spec of specs) {
      try {
        // Generate cropped variant
        const result = await generateVariant(
          sourceBuffer,
          spec,
          strategy
        )

        // Upload to S3
        const s3Key = generateSocialVariantKey(
          sourceAssetId,
          spec.platform,
          spec.variant
        )

        await uploadBufferToS3(result.buffer, s3Key, 'image/jpeg')

        // Generate presigned URL for preview
        const previewUrl = await getPresignedDownloadUrl(s3Key, 3600)

        // Create variant response
        const variant: GeneratedVariant = {
          id: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          platform: spec.platform as SocialPlatform,
          variant: spec.variant,
          width: result.width,
          height: result.height,
          ratio: spec.aspectRatio,
          cropData: result.cropData,
          validationScore: result.cropData.score,
          validationWarnings: result.cropData.score < 50
            ? [`Low crop quality score (${result.cropData.score}/100) - significant portion of image may be cropped out`]
            : result.cropData.score < 70
            ? [`Moderate crop quality (${result.cropData.score}/100) - some content may be lost`]
            : undefined,
          previewUrl
        }

        generatedVariants.push(variant)

        console.log(`Generated ${spec.platform} ${spec.variant} (score: ${result.cropData.score})`)
      } catch (error) {
        console.error(`Failed to generate variant ${spec.platform}/${spec.variant}:`, error)
        // Continue with other variants even if one fails
      }
    }

    if (generatedVariants.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any variants' },
        { status: 500 }
      )
    }

    // Build summary
    const summary = {
      total: generatedVariants.length,
      byPlatform: generatedVariants.reduce((acc, v) => {
        const platform = v.platform.toString()
        acc[platform] = (acc[platform] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    const response: GenerateVariantsResponse = {
      variants: generatedVariants,
      sourceAsset: {
        id: sourceAsset.id,
        fileName: sourceAsset.fileName,
        width: metadata.width,
        height: metadata.height
      },
      summary
    }

    console.log(`Successfully generated ${generatedVariants.length} variants`)

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error generating social variants:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate social variants',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
