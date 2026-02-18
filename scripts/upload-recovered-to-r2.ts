/**
 * Upload recovered Chrome cache images to R2, skipping ones that already exist.
 *
 * Usage: npx tsx scripts/upload-recovered-to-r2.ts [--dry-run]
 */

import * as fs from 'fs'
import * as path from 'path'
import { AwsClient } from 'aws4fetch'
import { config } from 'dotenv'
config({ path: '.env.local' })

const RECOVERY_DIR = path.join(process.cwd(), 's3-recovery/chrome-cache')
const dryRun = process.argv.includes('--dry-run')

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'lashpop-dam'
const BUCKET_URL = process.env.NEXT_PUBLIC_R2_BUCKET_URL || `https://${BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.dev`
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

const r2 = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  region: 'auto',
  service: 's3',
})

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case '.jpg': case '.jpeg': return 'image/jpeg'
    case '.png': return 'image/png'
    case '.webp': return 'image/webp'
    case '.avif': return 'image/avif'
    case '.heic': return 'image/heic'
    default: return 'application/octet-stream'
  }
}

async function checkExists(key: string): Promise<boolean> {
  try {
    const url = `${R2_ENDPOINT}/${BUCKET_NAME}/${key}`
    const res = await r2.fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<boolean> {
  const url = `${R2_ENDPOINT}/${BUCKET_NAME}/${key}`
  const res = await r2.fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: new Uint8Array(buffer),
  })
  return res.ok
}

async function main() {
  console.log('Upload Recovered Images to R2')
  console.log('=============================')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'UPLOAD'}`)
  console.log('')

  const manifestPath = path.join(RECOVERY_DIR, 'manifest.json')
  if (!fs.existsSync(manifestPath)) {
    console.error('No manifest.json found. Run extract-chrome-cache.ts first.')
    process.exit(1)
  }

  const manifest: { key: string; type: string; size: number }[] = JSON.parse(
    fs.readFileSync(manifestPath, 'utf-8')
  )

  // Deduplicate by key - keep the largest version of each key
  const byKey = new Map<string, typeof manifest[0]>()
  for (const entry of manifest) {
    // Clean up key - remove trailing garbage from cache extraction
    let cleanKey = entry.key
    // Remove anything after common image extensions that shouldn't be there
    cleanKey = cleanKey.replace(/(\.jpg|\.jpeg|\.JPG|\.JPEG|\.png|\.PNG|\.webp|\.avif|\.heic).*$/i, '$1')

    const existing = byKey.get(cleanKey)
    if (!existing || entry.size > existing.size) {
      byKey.set(cleanKey, { ...entry, key: cleanKey })
    }
  }

  const unique = Array.from(byKey.values())
  console.log(`Manifest: ${manifest.length} entries, ${unique.length} unique keys`)
  console.log('')

  let uploaded = 0
  let skipped = 0
  let errors = 0
  let alreadyExists = 0

  for (const entry of unique) {
    // Find the file on disk - use the original key from manifest to locate
    const originalEntry = manifest.find(m => {
      const cleanedOriginal = m.key.replace(/(\.jpg|\.jpeg|\.JPG|\.JPEG|\.png|\.PNG|\.webp|\.avif|\.heic).*$/i, '$1')
      return cleanedOriginal === entry.key
    })

    if (!originalEntry) continue

    const filePath = path.join(RECOVERY_DIR, originalEntry.key)

    if (!fs.existsSync(filePath)) {
      // Try the cleaned key
      const cleanFilePath = path.join(RECOVERY_DIR, entry.key)
      if (!fs.existsSync(cleanFilePath)) {
        console.log(`  SKIP (file not found): ${entry.key}`)
        skipped++
        continue
      }
    }

    const actualPath = fs.existsSync(path.join(RECOVERY_DIR, originalEntry.key))
      ? path.join(RECOVERY_DIR, originalEntry.key)
      : path.join(RECOVERY_DIR, entry.key)

    // Check if already in R2
    const exists = await checkExists(entry.key)
    if (exists) {
      alreadyExists++
      continue
    }

    const contentType = getMimeType(entry.key)
    const buffer = fs.readFileSync(actualPath)

    if (dryRun) {
      console.log(`  WOULD UPLOAD: ${entry.key} (${(buffer.length / 1024).toFixed(0)} KB)`)
      uploaded++
      continue
    }

    try {
      const ok = await uploadToR2(buffer, entry.key, contentType)
      if (ok) {
        console.log(`  UPLOADED: ${entry.key} (${(buffer.length / 1024).toFixed(0)} KB)`)
        uploaded++
      } else {
        console.log(`  FAILED: ${entry.key}`)
        errors++
      }
    } catch (err) {
      console.log(`  ERROR: ${entry.key} - ${err}`)
      errors++
    }
  }

  console.log('')
  console.log('=============================')
  console.log(`Already in R2: ${alreadyExists}`)
  console.log(`Uploaded: ${uploaded}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errors: ${errors}`)
}

main().catch(console.error)
