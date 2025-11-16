/**
 * Export Social Media Variants Endpoint
 *
 * POST /api/dam/social-variants/export
 *
 * Exports selected social media variants as a ZIP file with optional
 * format conversion and organization. Marks variants as exported.
 *
 * NOTE: This endpoint requires the 'archiver' package to be installed:
 *   npm install archiver @types/archiver
 *
 * Example curl:
 * curl -X POST http://localhost:3000/api/dam/social-variants/export \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "assetIds": ["123e4567-...", "234f5678-..."],
 *     "format": "jpg",
 *     "quality": 90,
 *     "organize": "by-platform",
 *     "includeMetadata": true
 *   }'
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { assets } from '@/db/schema/assets'
import { eq, inArray } from 'drizzle-orm'
import { ExportVariantsRequest, ExportVariantsResponse } from '@/types/social-variants'
import {
  downloadFromS3,
  uploadBufferToS3,
  generateExportKey,
  getPresignedDownloadUrl
} from '@/lib/dam/s3-client'
import { convertImageFormat } from '@/lib/dam/image-processor'

// Uncomment when archiver is installed:
// import archiver from 'archiver'
import { Readable, PassThrough } from 'stream'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for large exports

export async function POST(request: NextRequest) {
  try {
    const body: ExportVariantsRequest = await request.json()
    const {
      assetIds,
      format = 'original',
      quality = 90,
      organize = 'by-platform',
      includeMetadata = false
    } = body

    // Validate required fields
    if (!assetIds || assetIds.length === 0) {
      return NextResponse.json(
        { error: 'assetIds are required' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Fetch all variant assets
    const variantAssets = await db
      .select()
      .from(assets)
      .where(inArray(assets.id, assetIds))

    if (variantAssets.length === 0) {
      return NextResponse.json(
        { error: 'No variant assets found' },
        { status: 404 }
      )
    }

    console.log(`Exporting ${variantAssets.length} variants`)

    // NOTE: The following is a placeholder implementation
    // For production, install 'archiver' package and use the commented code below

    /*
    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    })

    const zipBuffer: Buffer[] = []
    const zipStream = new PassThrough()

    zipStream.on('data', (chunk) => zipBuffer.push(chunk))

    archive.pipe(zipStream)

    let totalSize = 0

    // Process each variant
    for (const asset of variantAssets) {
      try {
        // Parse metadata
        let metadata: any = {}
        try {
          if (asset.caption) {
            metadata = JSON.parse(asset.caption)
          }
        } catch (e) {
          console.error('Failed to parse metadata:', e)
        }

        // Download image from S3
        let imageBuffer = await downloadFromS3(asset.filePath)

        // Convert format if requested
        if (format !== 'original') {
          imageBuffer = await convertImageFormat(imageBuffer, format, quality)
        }

        totalSize += imageBuffer.length

        // Determine file path in ZIP based on organization
        let zipPath = ''
        const extension = format === 'png' ? '.png' : '.jpg'
        const fileName = asset.fileName.replace(/\.[^/.]+$/, '') + extension

        switch (organize) {
          case 'by-platform':
            zipPath = `${metadata.platform || 'unknown'}/${fileName}`
            break

          case 'by-variant':
            zipPath = `${metadata.platform || 'unknown'}-${metadata.variant || 'unknown'}/${fileName}`
            break

          case 'by-source':
            zipPath = `${metadata.sourceAssetId || 'unknown'}/${fileName}`
            break

          case 'flat':
          default:
            zipPath = fileName
            break
        }

        // Add file to archive
        archive.append(imageBuffer, { name: zipPath })

        // Add metadata file if requested
        if (includeMetadata) {
          const metadataJson = JSON.stringify({
            assetId: asset.id,
            fileName: asset.fileName,
            platform: metadata.platform,
            variant: metadata.variant,
            sourceAssetId: metadata.sourceAssetId,
            cropData: metadata.cropData,
            validationScore: metadata.validationScore,
            width: asset.width,
            height: asset.height,
            uploadedAt: asset.uploadedAt,
            exportedAt: new Date()
          }, null, 2)

          const metadataPath = zipPath.replace(extension, '.json')
          archive.append(metadataJson, { name: metadataPath })
        }

        console.log(`Added ${zipPath} to archive`)
      } catch (error) {
        console.error(`Failed to export asset ${asset.id}:`, error)
        // Continue with other assets
      }
    }

    // Finalize archive
    await archive.finalize()

    await new Promise((resolve) => {
      zipStream.on('end', resolve)
    })

    const finalZipBuffer = Buffer.concat(zipBuffer)

    // Upload ZIP to S3
    const zipKey = generateExportKey(`social-variants-export-${Date.now()}.zip`)
    await uploadBufferToS3(finalZipBuffer, zipKey, 'application/zip')

    // Generate presigned download URL
    const downloadUrl = await getPresignedDownloadUrl(zipKey, 3600)

    // Mark variants as exported
    for (const asset of variantAssets) {
      // Note: This requires an 'exported' field in the assets table
      // For now, we'll update the caption metadata
      try {
        let metadata: any = {}
        try {
          if (asset.caption) {
            metadata = JSON.parse(asset.caption)
          }
        } catch (e) {
          // Ignore parse errors
        }

        metadata.exported = true
        metadata.exportedAt = new Date().toISOString()

        await db
          .update(assets)
          .set({
            caption: JSON.stringify(metadata),
            updatedAt: new Date()
          })
          .where(eq(assets.id, asset.id))
      } catch (error) {
        console.error(`Failed to mark asset ${asset.id} as exported:`, error)
      }
    }

    const response: ExportVariantsResponse = {
      downloadUrl,
      expiresIn: 3600,
      fileCount: variantAssets.length * (includeMetadata ? 2 : 1),
      totalSize
    }

    console.log(`Successfully created export ZIP (${totalSize} bytes)`)

    return NextResponse.json(response, { status: 200 })
    */

    // Placeholder response until archiver is installed
    return NextResponse.json(
      {
        error: 'Export functionality requires the archiver package to be installed',
        instructions: 'Run: npm install archiver @types/archiver',
        requested: {
          assetCount: variantAssets.length,
          format,
          organize,
          includeMetadata
        }
      },
      { status: 501 } // Not Implemented
    )
  } catch (error) {
    console.error('Error exporting social variants:', error)
    return NextResponse.json(
      {
        error: 'Failed to export social variants',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
