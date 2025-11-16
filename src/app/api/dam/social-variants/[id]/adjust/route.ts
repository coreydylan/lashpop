/**
 * Adjust Crop Endpoint
 *
 * PATCH /api/dam/social-variants/:id/adjust
 *
 * Adjusts the crop coordinates of a social variant and optionally
 * regenerates the image with the new crop.
 *
 * Example curl:
 * curl -X PATCH http://localhost:3000/api/dam/social-variants/123e4567.../adjust \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "cropData": {
 *       "x": 100,
 *       "y": 50,
 *       "width": 1000,
 *       "height": 1000,
 *       "score": 85,
 *       "safeZones": []
 *     },
 *     "regenerate": true
 *   }'
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { assets } from '@/db/schema/assets'
import { eq } from 'drizzle-orm'
import { AdjustCropRequest, AdjustCropResponse, SocialVariantAsset, SocialPlatform } from '@/types/social-variants'
import {
  downloadFromS3,
  uploadBufferToS3,
  generateSocialVariantKey,
  getPresignedDownloadUrl
} from '@/lib/dam/s3-client'
import { regenerateWithCrop } from '@/lib/dam/image-processor'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body: AdjustCropRequest = await request.json()
    const { cropData, regenerate } = body

    // Validate required fields
    if (!cropData) {
      return NextResponse.json(
        { error: 'cropData is required' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Fetch the variant asset
    const [variantAsset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, id))
      .limit(1)

    if (!variantAsset) {
      return NextResponse.json(
        { error: 'Variant asset not found' },
        { status: 404 }
      )
    }

    // Parse existing metadata from caption
    let metadata: any = {}
    try {
      if (variantAsset.caption) {
        metadata = JSON.parse(variantAsset.caption)
      }
    } catch (e) {
      console.error('Failed to parse variant metadata:', e)
    }

    let newPreviewUrl: string | undefined

    if (regenerate) {
      // Download source asset
      const sourceAssetId = metadata.sourceAssetId
      if (!sourceAssetId) {
        return NextResponse.json(
          { error: 'Cannot regenerate: source asset ID not found in metadata' },
          { status: 400 }
        )
      }

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

      console.log(`Regenerating variant ${id} from source ${sourceAssetId}`)

      // Download source image
      const sourceBuffer = await downloadFromS3(sourceAsset.filePath)

      // Regenerate with new crop
      const regeneratedBuffer = await regenerateWithCrop(
        sourceBuffer,
        variantAsset.width || 1080,
        variantAsset.height || 1080,
        cropData
      )

      // Generate new S3 key
      const newS3Key = generateSocialVariantKey(
        sourceAssetId,
        metadata.platform || 'instagram',
        metadata.variant || 'square'
      )

      // Upload regenerated image
      await uploadBufferToS3(regeneratedBuffer, newS3Key, 'image/jpeg')

      // Update file path in database
      await db
        .update(assets)
        .set({
          filePath: newS3Key,
          updatedAt: new Date()
        })
        .where(eq(assets.id, id))

      // Generate presigned URL for preview
      newPreviewUrl = await getPresignedDownloadUrl(newS3Key, 3600)

      variantAsset.filePath = newS3Key
    }

    // Update metadata with new crop data
    metadata.cropData = cropData
    metadata.validationScore = cropData.score

    // Update caption in database
    await db
      .update(assets)
      .set({
        caption: JSON.stringify(metadata),
        width: cropData.width,
        height: cropData.height,
        updatedAt: new Date()
      })
      .where(eq(assets.id, id))

    // Build updated asset response
    const updatedAsset: SocialVariantAsset = {
      id: variantAsset.id,
      fileName: variantAsset.fileName,
      filePath: variantAsset.filePath,
      fileType: variantAsset.fileType as 'image' | 'video',
      mimeType: variantAsset.mimeType,
      fileSize: variantAsset.fileSize,
      width: cropData.width,
      height: cropData.height,

      sourceAssetId: metadata.sourceAssetId || '',
      platform: metadata.platform || SocialPlatform.INSTAGRAM,
      variant: metadata.variant || '',
      ratio: `${cropData.width}:${cropData.height}`,
      cropStrategy: metadata.cropStrategy || 'smart_crop',
      crop: cropData,
      validationScore: cropData.score,

      exported: false,
      uploadedAt: variantAsset.uploadedAt,
      updatedAt: new Date(),

      altText: variantAsset.altText || undefined,
      teamMemberId: variantAsset.teamMemberId
    }

    const response: AdjustCropResponse = {
      success: true,
      updatedAsset,
      newPreviewUrl
    }

    console.log(`Successfully adjusted crop for variant ${id}${regenerate ? ' (regenerated)' : ''}`)

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error adjusting crop:', error)
    return NextResponse.json(
      {
        error: 'Failed to adjust crop',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
