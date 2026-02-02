/**
 * Script to optimize all existing images in the DAM
 *
 * Run with: npx tsx scripts/optimize-dam-images.ts
 *
 * Options:
 *   --dry-run     Show what would be optimized without making changes
 *   --limit=N     Only process N images
 *   --min-size=N  Only optimize images larger than N bytes (default: 500KB)
 */

import { getDb } from '../src/db'
import { assets } from '../src/db/schema/assets'
import { teamMemberPhotos } from '../src/db/schema/team_member_photos'
import { eq, and, like, or, isNotNull } from 'drizzle-orm'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-west-2'
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'lashpop-dam-assets'
const BUCKET_URL = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
})

// Parse command line args
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined
const minSizeArg = args.find(a => a.startsWith('--min-size='))
const minSize = minSizeArg ? parseInt(minSizeArg.split('=')[1]) : 500 * 1024 // 500KB default

interface OptimizationResult {
  id: string
  fileName: string
  originalSize: number
  newSize: number
  reduction: string
  newUrl: string
  width: number
  height: number
}

async function downloadFromS3(url: string): Promise<Buffer> {
  // Extract key from URL
  const key = url.replace(`${BUCKET_URL}/`, '')

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  })

  const response = await s3Client.send(command)
  const stream = response.Body as NodeJS.ReadableStream
  const chunks: Buffer[] = []

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }

  return Buffer.concat(chunks)
}

async function uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType
  })

  await s3Client.send(command)
  return `${BUCKET_URL}/${key}`
}

async function optimizeImage(buffer: Buffer): Promise<{
  buffer: Buffer
  width: number
  height: number
  format: 'webp'
}> {
  const optimized = await sharp(buffer)
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()

  const metadata = await sharp(optimized).metadata()

  return {
    buffer: optimized,
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: 'webp'
  }
}

function getOptimizedKey(originalUrl: string): string {
  // Extract key from URL and change extension to .webp
  const key = originalUrl.replace(`${BUCKET_URL}/`, '')
  const baseName = key.replace(/\.[^.]+$/, '')
  return `${baseName}.webp`
}

async function optimizeDamAssets() {
  console.log('🖼️  DAM Image Optimization Script')
  console.log('================================')
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`)
  console.log(`Min size threshold: ${(minSize / 1024).toFixed(0)}KB`)
  if (limit) console.log(`Limit: ${limit} images`)
  console.log('')

  const db = getDb()

  // Fetch all image assets that might need optimization
  // We look for images that are NOT already webp and have S3 URLs
  const allAssets = await db
    .select()
    .from(assets)
    .where(
      and(
        eq(assets.fileType, 'image'),
        like(assets.filePath, `${BUCKET_URL}%`)
      )
    )

  // Filter to images that need optimization
  const assetsToOptimize = allAssets.filter(asset => {
    // Skip if already webp
    if (asset.mimeType === 'image/webp' || asset.filePath.endsWith('.webp')) {
      return false
    }
    // Skip if below size threshold (if we have size info)
    if (asset.fileSize && asset.fileSize < minSize) {
      return false
    }
    return true
  })

  const toProcess = limit ? assetsToOptimize.slice(0, limit) : assetsToOptimize

  console.log(`Found ${allAssets.length} total image assets`)
  console.log(`${assetsToOptimize.length} need optimization`)
  console.log(`Processing ${toProcess.length} images...`)
  console.log('')

  const results: OptimizationResult[] = []
  let totalOriginalSize = 0
  let totalNewSize = 0
  let errors = 0

  for (let i = 0; i < toProcess.length; i++) {
    const asset = toProcess[i]
    const progress = `[${i + 1}/${toProcess.length}]`

    try {
      console.log(`${progress} Processing: ${asset.fileName}`)

      if (dryRun) {
        console.log(`  ⏭️  Would optimize (dry run)`)
        continue
      }

      // Download original
      const originalBuffer = await downloadFromS3(asset.filePath)
      const originalSize = originalBuffer.length
      totalOriginalSize += originalSize

      // Optimize
      const optimized = await optimizeImage(originalBuffer)
      const newSize = optimized.buffer.length
      totalNewSize += newSize

      // Generate new key
      const newKey = getOptimizedKey(asset.filePath)

      // Upload optimized version
      const newUrl = await uploadToS3(optimized.buffer, newKey, 'image/webp')

      // Update database
      await db
        .update(assets)
        .set({
          filePath: newUrl,
          mimeType: 'image/webp',
          fileSize: newSize,
          width: optimized.width,
          height: optimized.height,
          updatedAt: new Date()
        })
        .where(eq(assets.id, asset.id))

      const reduction = ((1 - newSize / originalSize) * 100).toFixed(1)
      console.log(`  ✅ ${(originalSize / 1024).toFixed(0)}KB → ${(newSize / 1024).toFixed(0)}KB (${reduction}% smaller)`)

      results.push({
        id: asset.id,
        fileName: asset.fileName,
        originalSize,
        newSize,
        reduction: `${reduction}%`,
        newUrl,
        width: optimized.width,
        height: optimized.height
      })
    } catch (error) {
      console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      errors++
    }
  }

  // Summary
  console.log('')
  console.log('================================')
  console.log('📊 Summary')
  console.log('================================')

  if (dryRun) {
    console.log(`Would optimize ${toProcess.length} images`)
  } else {
    console.log(`Optimized: ${results.length} images`)
    console.log(`Errors: ${errors}`)
    if (results.length > 0) {
      const totalReduction = ((1 - totalNewSize / totalOriginalSize) * 100).toFixed(1)
      console.log(`Total size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB → ${(totalNewSize / 1024 / 1024).toFixed(2)}MB (${totalReduction}% reduction)`)
    }
  }
}

async function optimizeTeamMemberPhotos() {
  console.log('')
  console.log('👥 Team Member Photos Optimization')
  console.log('===================================')

  const db = getDb()

  // Fetch all team member photos that might need optimization
  const allPhotos = await db
    .select()
    .from(teamMemberPhotos)
    .where(like(teamMemberPhotos.filePath, `${BUCKET_URL}%`))

  // Filter to images that need optimization
  const photosToOptimize = allPhotos.filter(photo => {
    // Skip if already webp
    if (photo.filePath.endsWith('.webp')) {
      return false
    }
    return true
  })

  const toProcess = limit ? photosToOptimize.slice(0, limit) : photosToOptimize

  console.log(`Found ${allPhotos.length} total team member photos`)
  console.log(`${photosToOptimize.length} need optimization`)
  console.log(`Processing ${toProcess.length} photos...`)
  console.log('')

  let totalOriginalSize = 0
  let totalNewSize = 0
  let optimized = 0
  let errors = 0

  for (let i = 0; i < toProcess.length; i++) {
    const photo = toProcess[i]
    const progress = `[${i + 1}/${toProcess.length}]`

    try {
      console.log(`${progress} Processing: ${photo.fileName}`)

      if (dryRun) {
        console.log(`  ⏭️  Would optimize (dry run)`)
        continue
      }

      // Download original
      const originalBuffer = await downloadFromS3(photo.filePath)
      const originalSize = originalBuffer.length
      totalOriginalSize += originalSize

      // Optimize
      const result = await optimizeImage(originalBuffer)
      const newSize = result.buffer.length
      totalNewSize += newSize

      // Generate new key
      const newKey = getOptimizedKey(photo.filePath)

      // Upload optimized version
      const newUrl = await uploadToS3(result.buffer, newKey, 'image/webp')

      // Update database
      await db
        .update(teamMemberPhotos)
        .set({
          filePath: newUrl,
          updatedAt: new Date()
        })
        .where(eq(teamMemberPhotos.id, photo.id))

      const reduction = ((1 - newSize / originalSize) * 100).toFixed(1)
      console.log(`  ✅ ${(originalSize / 1024).toFixed(0)}KB → ${(newSize / 1024).toFixed(0)}KB (${reduction}% smaller)`)
      optimized++
    } catch (error) {
      console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      errors++
    }
  }

  // Summary
  console.log('')
  if (!dryRun && optimized > 0) {
    const totalReduction = ((1 - totalNewSize / totalOriginalSize) * 100).toFixed(1)
    console.log(`Team photos optimized: ${optimized}`)
    console.log(`Total size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB → ${(totalNewSize / 1024 / 1024).toFixed(2)}MB (${totalReduction}% reduction)`)
  }
}

async function main() {
  try {
    await optimizeDamAssets()
    await optimizeTeamMemberPhotos()
    console.log('')
    console.log('✨ Done!')
    process.exit(0)
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

main()
