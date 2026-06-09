/**
 * Upload the recovered DAM images to a NEW R2 bucket, keyed exactly as the
 * dead bucket's object keys, so the existing file_path values only need a
 * domain swap (see repoint SQL printed at the end).
 *
 * Reads the asset->file mapping from /tmp/asset_upload_map.json
 * (built during recovery: [{asset_id, key, file_name, src}]).
 *
 * Required env (the NEW experialstudio R2 account):
 *   NEW_R2_ACCOUNT_ID, NEW_R2_ACCESS_KEY_ID, NEW_R2_SECRET_ACCESS_KEY, NEW_R2_BUCKET
 *
 * Usage:
 *   node scripts/upload-to-new-r2.mjs [--dry-run]
 */
import fs from 'fs'
import path from 'path'
import { AwsClient } from 'aws4fetch'

const DRY = process.argv.includes('--dry-run')
const ACC = process.env.NEW_R2_ACCOUNT_ID
const AK  = process.env.NEW_R2_ACCESS_KEY_ID
const SK  = process.env.NEW_R2_SECRET_ACCESS_KEY
const BUCKET = process.env.NEW_R2_BUCKET
if (!DRY && (!ACC || !AK || !SK || !BUCKET)) {
  console.error('Missing NEW_R2_ACCOUNT_ID / NEW_R2_ACCESS_KEY_ID / NEW_R2_SECRET_ACCESS_KEY / NEW_R2_BUCKET')
  process.exit(1)
}
const ENDPOINT = `https://${ACC}.r2.cloudflarestorage.com`
const r2 = new AwsClient({ accessKeyId: AK, secretAccessKey: SK, region: 'auto', service: 's3' })

const mime = (f) => ({ '.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png',
  '.webp':'image/webp','.heic':'image/heic','.avif':'image/avif' }[path.extname(f).toLowerCase()] || 'application/octet-stream')

const map = JSON.parse(fs.readFileSync('/tmp/asset_upload_map.json','utf8'))
console.log(`${DRY?'[DRY] ':''}uploading ${map.length} mapped images to bucket ${BUCKET}`)
let ok=0, err=0
for (const m of map) {
  if (!fs.existsSync(m.src)) { console.log('  SKIP missing', m.src); continue }
  if (DRY) { ok++; continue }
  try {
    const body = fs.readFileSync(m.src)
    const res = await r2.fetch(`${ENDPOINT}/${BUCKET}/${m.key}`, {
      method:'PUT', headers:{ 'Content-Type': mime(m.src) }, body: new Uint8Array(body) })
    if (res.ok) { ok++; if (ok%50===0) console.log(`  ${ok}/${map.length}`) }
    else { err++; console.log('  FAIL', res.status, m.key) }
  } catch(e){ err++; console.log('  ERR', m.key, String(e).slice(0,60)) }
}
console.log(`done. uploaded ${ok}, errors ${err}`)
console.log(`\n--- after upload, repoint the DB (332 mapped rows) ---`)
console.log(`-- swap the dead bucket domain to the new one. Set NEW_PUBLIC = your new bucket public URL.`)
console.log(`UPDATE assets SET file_path = replace(file_path,`)
console.log(`  'https://pub-f98565faaf544aa98c908360653eb5db.r2.dev', '<NEW_PUBLIC_BASE>')`)
console.log(`WHERE file_path LIKE '%pub-f98565%';`)
