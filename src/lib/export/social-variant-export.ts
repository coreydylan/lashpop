/**
 * Social Variant Export Service
 *
 * Handles exporting social media variants as ZIP archives with various organization strategies.
 *
 * DEPENDENCIES REQUIRED:
 * Run: npm install archiver @types/archiver
 *
 * USAGE EXAMPLES:
 *
 * // Example 1: Export with default settings (original format, flat organization)
 * const result = await exportSocialVariants({
 *   assetIds: ['uuid-1', 'uuid-2', 'uuid-3']
 * })
 *
 * // Example 2: Export organized by platform with JPEG conversion
 * const result = await exportSocialVariants({
 *   assetIds: ['uuid-1', 'uuid-2'],
 *   format: 'jpg',
 *   quality: 90,
 *   organize: 'by-platform',
 *   includeMetadata: true
 * })
 *
 * // Example 3: Export with source images included
 * const result = await exportSocialVariants({
 *   assetIds: ['uuid-1', 'uuid-2'],
 *   organize: 'by-source',
 *   includeSourceImages: true,
 *   includeMetadata: true
 * })
 */

import archiver from 'archiver'
import sharp from 'sharp'
import { Readable } from 'stream'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getDb } from '@/db'
import { socialVariants } from '@/db/schema/social_variants'
import { assets } from '@/db/schema/assets'
import { inArray, eq } from 'drizzle-orm'

const AWS_REGION = process.env.AWS_REGION || 'us-west-2'
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || ''
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || ''
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'lashpop-dam-assets'

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
})

export interface ExportOptions {
  assetIds: string[]  // Variant IDs to export
  format?: 'original' | 'jpg' | 'png'
  quality?: number  // 0-100 for JPEG
  organize?: 'flat' | 'by-variant' | 'by-platform' | 'by-source'
  includeMetadata?: boolean
  includeSourceImages?: boolean
}

export interface ExportResult {
  zipBuffer: Buffer
  fileCount: number
  totalSize: number
  manifest: {
    files: Array<{
      path: string
      size: number
      originalAssetId: string
    }>
  }
}

interface VariantWithSource {
  variant: typeof socialVariants.$inferSelect
  sourceAsset: typeof assets.$inferSelect | null
}

/**
 * Download a file from S3 and return as Buffer
 */
async function downloadFromS3(filePath: string): Promise<Buffer> {
  // Extract S3 key from URL
  const key = filePath.replace(/^https?:\/\/[^/]+\//, '')

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  })

  const response = await s3Client.send(command)
  const stream = response.Body as Readable

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

/**
 * Convert image format using Sharp
 */
async function convertImageFormat(
  buffer: Buffer,
  format: 'jpg' | 'png',
  quality?: number
): Promise<Buffer> {
  let sharpInstance = sharp(buffer)

  if (format === 'jpg') {
    sharpInstance = sharpInstance.jpeg({ quality: quality || 90 })
  } else if (format === 'png') {
    sharpInstance = sharpInstance.png({ quality: quality || 90 })
  }

  return await sharpInstance.toBuffer()
}

/**
 * Generate file path based on organization strategy
 */
function generateFilePath(
  variant: typeof socialVariants.$inferSelect,
  sourceAsset: typeof assets.$inferSelect | null,
  organize: string,
  format: string,
  index: number
): string {
  const ext = format === 'original' ? variant.fileName.split('.').pop() : format
  const baseName = variant.fileName.replace(/\.[^.]+$/, '')

  switch (organize) {
    case 'by-platform':
      return `${variant.platform}/${baseName}.${ext}`

    case 'by-variant':
      return `${variant.platform}-${variant.variant}/${baseName}.${ext}`

    case 'by-source':
      const sourceName = sourceAsset?.fileName.replace(/\.[^.]+$/, '') || 'unknown'
      return `${sourceName}/${variant.platform}_${variant.variant}.${ext}`

    case 'flat':
    default:
      return `${baseName}.${ext}`
  }
}

/**
 * Generate metadata JSON for a variant
 */
function generateMetadataJson(
  variant: typeof socialVariants.$inferSelect,
  sourceAsset: typeof assets.$inferSelect | null
): string {
  const metadata = {
    fileName: variant.fileName,
    sourceAsset: sourceAsset?.fileName || 'unknown',
    platform: variant.platform,
    variant: variant.variant,
    dimensions: variant.dimensions,
    ratio: variant.ratio,
    generatedAt: variant.createdAt.toISOString(),
    cropStrategy: variant.cropStrategy,
    validationScore: variant.validationScore,
    validationWarnings: variant.validationWarnings,
    exported: variant.exported,
    exportedAt: variant.exportedAt?.toISOString(),
    metadata: variant.metadata
  }

  return JSON.stringify(metadata, null, 2)
}

/**
 * Generate README.txt explaining the export structure
 */
function generateReadme(organize: string, fileCount: number, format: string): string {
  const organizationDocs: Record<string, string> = {
    'flat': 'All files are in the root directory with their original names.',
    'by-platform': `Files are organized into folders by platform (instagram/, facebook/, etc.).
Each folder contains all variants for that platform.`,
    'by-variant': `Files are organized by platform and variant type (instagram-square/, facebook-post/, etc.).
Each folder contains all images for that specific variant type.`,
    'by-source': `Files are organized by source image name.
Each folder contains all variants generated from that source image.`
  }

  return `Social Media Variant Export
============================

Export Date: ${new Date().toISOString()}
Total Files: ${fileCount}
Format: ${format.toUpperCase()}

Organization Strategy: ${organize}
${organizationDocs[organize] || ''}

Folder Structure:
${organize === 'by-platform' ? `
  /instagram/
    square_post_1.jpg
    story_1.jpg
  /facebook/
    link_preview_1.jpg
` : organize === 'by-variant' ? `
  /instagram-square/
    image1.jpg
    image2.jpg
  /instagram-story/
    image1.jpg
` : organize === 'by-source' ? `
  /summer_hero/
    instagram_square.jpg
    facebook_post.jpg
  /winter_promo/
    instagram_square.jpg
` : `
  image1.jpg
  image2.jpg
  image3.jpg
`}

Metadata Files:
If metadata JSON files are included, you'll find a .json file alongside each image
with detailed information about platform, dimensions, crop strategy, and validation scores.

---
Generated by Lashpop DAM Export Service
`
}

/**
 * Main export function - creates ZIP archive with social variants
 */
export async function exportSocialVariants(options: ExportOptions): Promise<ExportResult> {
  const {
    assetIds,
    format = 'original',
    quality = 90,
    organize = 'flat',
    includeMetadata = false,
    includeSourceImages = false
  } = options

  // Validate inputs
  if (!assetIds || assetIds.length === 0) {
    throw new Error('No asset IDs provided for export')
  }

  // Fetch variants from database
  const db = getDb()
  const variants = await db
    .select({
      variant: socialVariants,
      sourceAsset: assets
    })
    .from(socialVariants)
    .leftJoin(assets, eq(socialVariants.sourceAssetId, assets.id))
    .where(inArray(socialVariants.id, assetIds))

  if (variants.length === 0) {
    throw new Error('No variants found with the provided IDs')
  }

  // Create archive
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  })

  const manifest: ExportResult['manifest'] = {
    files: []
  }

  let totalSize = 0

  // Collect all archive data in memory
  const chunks: Buffer[] = []
  archive.on('data', (chunk) => chunks.push(chunk))

  // Process each variant
  for (let i = 0; i < variants.length; i++) {
    const { variant, sourceAsset } = variants[i]

    try {
      // Download variant from S3
      let imageBuffer = await downloadFromS3(variant.filePath)

      // Convert format if needed
      if (format !== 'original' && (format === 'jpg' || format === 'png')) {
        imageBuffer = await convertImageFormat(imageBuffer, format, quality)
      }

      // Generate file path
      const filePath = generateFilePath(variant, sourceAsset, organize, format, i)

      // Add to archive
      archive.append(imageBuffer, { name: filePath })

      // Track in manifest
      manifest.files.push({
        path: filePath,
        size: imageBuffer.length,
        originalAssetId: variant.id
      })

      totalSize += imageBuffer.length

      // Add metadata JSON if requested
      if (includeMetadata) {
        const metadataJson = generateMetadataJson(variant, sourceAsset)
        const metadataPath = filePath.replace(/\.[^.]+$/, '.json')
        archive.append(metadataJson, { name: metadataPath })

        manifest.files.push({
          path: metadataPath,
          size: Buffer.byteLength(metadataJson),
          originalAssetId: variant.id
        })

        totalSize += Buffer.byteLength(metadataJson)
      }

      // Add source image if requested
      if (includeSourceImages && sourceAsset) {
        const sourceBuffer = await downloadFromS3(sourceAsset.filePath)
        const sourcePath = organize === 'by-source'
          ? `${sourceAsset.fileName.replace(/\.[^.]+$/, '')}/source_${sourceAsset.fileName}`
          : `sources/${sourceAsset.fileName}`

        archive.append(sourceBuffer, { name: sourcePath })

        manifest.files.push({
          path: sourcePath,
          size: sourceBuffer.length,
          originalAssetId: sourceAsset.id
        })

        totalSize += sourceBuffer.length
      }

    } catch (error) {
      console.error(`Error processing variant ${variant.id}:`, error)
      // Continue with other variants
    }
  }

  // Add README
  const readme = generateReadme(organize, manifest.files.length, format)
  archive.append(readme, { name: 'README.txt' })
  manifest.files.push({
    path: 'README.txt',
    size: Buffer.byteLength(readme),
    originalAssetId: 'readme'
  })
  totalSize += Buffer.byteLength(readme)

  // Finalize archive
  await archive.finalize()

  // Wait for all data to be collected
  await new Promise((resolve) => archive.on('end', resolve))

  const zipBuffer = Buffer.concat(chunks)

  return {
    zipBuffer,
    fileCount: manifest.files.length,
    totalSize,
    manifest
  }
}

/**
 * Helper function to estimate export size before creating the archive
 */
export async function estimateExportSize(assetIds: string[]): Promise<number> {
  const db = getDb()
  const variants = await db
    .select({
      fileSize: socialVariants.fileSize
    })
    .from(socialVariants)
    .where(inArray(socialVariants.id, assetIds))

  return variants.reduce((sum, v) => sum + (v.fileSize || 0), 0)
}

/**
 * Helper function to get organization folder structure preview
 */
export async function getOrganizationPreview(
  assetIds: string[],
  organize: 'flat' | 'by-variant' | 'by-platform' | 'by-source'
): Promise<Record<string, number>> {
  const db = getDb()
  const variants = await db
    .select()
    .from(socialVariants)
    .where(inArray(socialVariants.id, assetIds))

  const folderCounts: Record<string, number> = {}

  for (const variant of variants) {
    let folder = ''

    switch (organize) {
      case 'by-platform':
        folder = variant.platform
        break
      case 'by-variant':
        folder = `${variant.platform}-${variant.variant}`
        break
      case 'by-source':
        folder = 'source-folders'
        break
      case 'flat':
      default:
        folder = 'root'
        break
    }

    folderCounts[folder] = (folderCounts[folder] || 0) + 1
  }

  return folderCounts
}
