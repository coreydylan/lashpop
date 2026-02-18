/**
 * Extract images from Chrome's cache that came from our S3/R2 bucket.
 * Chrome Simple Cache format: binary header → URL → HTTP headers → body
 *
 * Usage: npx tsx scripts/extract-chrome-cache.ts [--dry-run]
 */

import * as fs from 'fs'
import * as path from 'path'

const CACHE_DIR = path.join(
  process.env.HOME || '',
  'Library/Caches/Google/Chrome/Profile 1/Cache/Cache_Data'
)

const OUTPUT_DIR = path.join(process.cwd(), 's3-recovery/chrome-cache')
const S3_PATTERN = 'lashpop-dam-assets.s3.us-west-2.amazonaws.com'
const R2_PATTERN = 'pub-f98565faaf544aa98c908360653eb5db.r2.dev'
const NEXT_IMAGE_PATTERN = '_next/image'

const dryRun = process.argv.includes('--dry-run')

// Image magic bytes
const JPEG_MAGIC = Buffer.from([0xFF, 0xD8, 0xFF])
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4E, 0x47]) // \x89PNG
const WEBP_MAGIC = Buffer.from('RIFF')
const AVIF_FTYP = Buffer.from('ftyp')

function findImageStart(data: Buffer): { offset: number; type: string } | null {
  // Search for image magic bytes
  for (let i = 0; i < Math.min(data.length, 50000); i++) {
    // JPEG
    if (i + 3 <= data.length && data[i] === 0xFF && data[i + 1] === 0xD8 && data[i + 2] === 0xFF) {
      return { offset: i, type: 'jpeg' }
    }
    // PNG
    if (i + 4 <= data.length && data.subarray(i, i + 4).equals(PNG_MAGIC)) {
      return { offset: i, type: 'png' }
    }
    // WebP (RIFF....WEBP)
    if (i + 12 <= data.length && data.subarray(i, i + 4).equals(WEBP_MAGIC) && data.subarray(i + 8, i + 12).toString() === 'WEBP') {
      return { offset: i, type: 'webp' }
    }
    // AVIF (....ftypavif)
    if (i + 12 <= data.length && data.subarray(i + 4, i + 8).equals(AVIF_FTYP)) {
      return { offset: i, type: 'avif' }
    }
  }
  return null
}

function extractUrl(data: Buffer): string | null {
  // Look for our S3/R2 URLs in the cache entry
  const text = data.subarray(0, Math.min(data.length, 10000)).toString('latin1')

  // Direct S3 URL
  let match = text.match(/https?:\/\/lashpop-dam-assets\.s3\.us-west-2\.amazonaws\.com\/([^\s\x00"']+)/)
  if (match) return match[1]

  // R2 URL
  match = text.match(/https?:\/\/pub-f98565faaf544aa98c908360653eb5db\.r2\.dev\/([^\s\x00"']+)/)
  if (match) return match[1]

  // Next.js image proxy (extract the original URL param)
  match = text.match(/_next\/image\?url=([^&\s\x00]+)/)
  if (match) {
    const decoded = decodeURIComponent(match[1])
    const keyMatch = decoded.match(/(?:amazonaws\.com|r2\.dev)\/(.+)/)
    if (keyMatch) return keyMatch[1]
  }

  return null
}

function getExtForType(type: string): string {
  switch (type) {
    case 'jpeg': return '.jpg'
    case 'png': return '.png'
    case 'webp': return '.webp'
    case 'avif': return '.avif'
    default: return '.bin'
  }
}

async function main() {
  console.log('Chrome Cache Image Extractor')
  console.log('============================')
  console.log(`Cache dir: ${CACHE_DIR}`)
  console.log(`Output dir: ${OUTPUT_DIR}`)
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'EXTRACT'}`)
  console.log('')

  if (!fs.existsSync(CACHE_DIR)) {
    console.error('Cache directory not found!')
    process.exit(1)
  }

  if (!dryRun) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const files = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('_0'))
  console.log(`Scanning ${files.length} cache entries...`)
  console.log('')

  const extracted: { file: string; key: string; type: string; size: number }[] = []
  let scanned = 0

  for (const file of files) {
    const filePath = path.join(CACHE_DIR, file)
    const stat = fs.statSync(filePath)

    // Skip small files (unlikely to be images)
    if (stat.size < 5000) continue

    scanned++
    const data = fs.readFileSync(filePath)

    // Check if this cache entry references our bucket
    const text = data.subarray(0, Math.min(data.length, 10000)).toString('latin1')
    if (!text.includes(S3_PATTERN) && !text.includes(R2_PATTERN)) continue

    // Extract the R2/S3 key
    const key = extractUrl(data)
    if (!key) continue

    // Find image data
    const imgStart = findImageStart(data)
    if (!imgStart) continue

    // Extract image bytes — find the end by looking for Chrome's EOF record marker
    // Chrome appends a ~40 byte trailer. We'll extract to the end and trim if needed.
    let imgEnd = data.length

    // Look for the SHA256 hash marker that Chrome appends at the end
    // It's a 24-byte structure with magic bytes followed by hash
    // For simplicity, check the last 100 bytes for non-image data patterns
    const trailer = data.subarray(Math.max(0, data.length - 100))
    for (let i = trailer.length - 1; i >= 0; i--) {
      // Chrome simple cache EOF marker starts with specific bytes
      if (trailer[i] === 0x00 && i > 20) {
        // Found possible end of image data
        const candidateEnd = data.length - 100 + i
        if (candidateEnd > imgStart.offset + 1000) {
          // Validate: for JPEG, look for the EOI marker (FF D9)
          if (imgStart.type === 'jpeg') {
            for (let j = candidateEnd; j > imgStart.offset; j--) {
              if (data[j] === 0xD9 && data[j - 1] === 0xFF) {
                imgEnd = j + 1
                break
              }
            }
          }
          break
        }
      }
    }

    // For JPEG, find the actual end (FF D9)
    if (imgStart.type === 'jpeg' && imgEnd === data.length) {
      for (let j = data.length - 1; j > imgStart.offset; j--) {
        if (data[j] === 0xD9 && data[j - 1] === 0xFF) {
          imgEnd = j + 1
          break
        }
      }
    }

    const imgData = data.subarray(imgStart.offset, imgEnd)
    const size = imgData.length

    // Skip if too small to be a real image
    if (size < 1000) continue

    console.log(`Found: ${key} (${imgStart.type}, ${(size / 1024).toFixed(0)} KB)`)

    if (!dryRun) {
      // Save with original key structure
      const outPath = path.join(OUTPUT_DIR, key)
      fs.mkdirSync(path.dirname(outPath), { recursive: true })
      fs.writeFileSync(outPath, imgData)
    }

    extracted.push({ file, key, type: imgStart.type, size })
  }

  console.log('')
  console.log('============================')
  console.log(`Scanned: ${scanned} cache entries`)
  console.log(`Extracted: ${extracted.length} images`)

  if (extracted.length > 0) {
    const totalSize = extracted.reduce((sum, e) => sum + e.size, 0)
    console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(1)} MB`)
  }

  if (!dryRun && extracted.length > 0) {
    // Write manifest
    const manifest = extracted.map(e => ({
      key: e.key,
      type: e.type,
      size: e.size,
    }))
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    )
    console.log(`\nManifest written to ${OUTPUT_DIR}/manifest.json`)
  }
}

main().catch(console.error)
