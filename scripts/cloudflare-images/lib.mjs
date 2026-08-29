import { createHash } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
export const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '../..')
export const DEFAULT_LEGACY_WORKER = 'https://lashpop-img.experial.workers.dev'
export const HOSTED_UPLOAD_LIMIT = 10 * 1024 * 1024

const RUNTIME_IMAGE_SQL = `
SELECT file_path AS url, 'asset' AS source_kind, id AS source_id
FROM assets
WHERE recovery_status IS NULL
UNION ALL
SELECT file_path, 'team-photo', id
FROM team_member_photos
UNION ALL
SELECT COALESCE(NULLIF(vagaro_photo_url, ''), image_url), 'team-member', id
FROM team_members
UNION ALL
SELECT COALESCE(NULLIF(vagaro_image_url, ''), image_url), 'service', id
FROM services
WHERE COALESCE(NULLIF(vagaro_image_url, ''), image_url) IS NOT NULL
`

// Keep sparse/optional image columns in separate queries. The production query
// bridge returns HTTP 500 when some empty SELECTs are appended to a large
// UNION, even though each SELECT is valid independently.
const AUXILIARY_RUNTIME_IMAGE_SQL = [
  `SELECT crop_full_vertical_url AS url, 'team-photo-crop-full-vertical' AS source_kind, id AS source_id
   FROM team_member_photos WHERE crop_full_vertical_url IS NOT NULL`,
  `SELECT crop_full_horizontal_url AS url, 'team-photo-crop-full-horizontal' AS source_kind, id AS source_id
   FROM team_member_photos WHERE crop_full_horizontal_url IS NOT NULL`,
  `SELECT crop_medium_circle_url AS url, 'team-photo-crop-medium-circle' AS source_kind, id AS source_id
   FROM team_member_photos WHERE crop_medium_circle_url IS NOT NULL`,
  `SELECT crop_close_up_circle_url AS url, 'team-photo-crop-close-circle' AS source_kind, id AS source_id
   FROM team_member_photos WHERE crop_close_up_circle_url IS NOT NULL`,
  `SELECT crop_square_url AS url, 'team-photo-crop-square' AS source_kind, id AS source_id
   FROM team_member_photos WHERE crop_square_url IS NOT NULL`,
  `SELECT crop_url AS url, 'quiz-photo-crop' AS source_kind, id AS source_id
   FROM quiz_photos WHERE crop_url IS NOT NULL`,
  `SELECT result_image_crop_url AS url, 'quiz-result-crop' AS source_kind, id AS source_id
   FROM quiz_result_settings WHERE result_image_crop_url IS NOT NULL`,
  `SELECT assets.file_path AS url, 'quiz-result-image' AS source_kind, quiz_result_settings.lash_style AS source_id
   FROM quiz_result_settings
   INNER JOIN assets ON assets.id = quiz_result_settings.result_image_asset_id
   WHERE assets.file_path IS NOT NULL`,
  `SELECT client_image AS url, 'testimonial' AS source_kind, id AS source_id
   FROM testimonials WHERE client_image IS NOT NULL`,
  `SELECT background_image AS url, 'scrollytelling-surface' AS source_kind, id AS source_id
   FROM scrollytelling_surface_slides WHERE background_image IS NOT NULL`,
]

const RASTER_RE = /\.(?:avif|gif|heic|heif|jpe?g|png|tiff?|webp)(?:$|[?#])/i

export function loadEnvironment() {
  const envFile = process.env.LASHPOP_ENV_FILE || path.join(PROJECT_ROOT, '.env.production.local')
  dotenv.config({ path: envFile, quiet: true })
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function canonicalSourceForUrl(value) {
  if (typeof value !== 'string' || value.includes('placeholder')) return null

  if (value.startsWith('/lashpop-images/')) {
    return { kind: 'site', locator: value.replace(/^\//, '') }
  }

  let url
  try {
    url = new URL(value)
  } catch {
    return null
  }

  const r2 = url.hostname.match(/^pub-[a-f0-9]+\.r2\.dev$/i)
  if (r2) return { kind: 'r2', locator: decodeURIComponent(url.pathname.replace(/^\/+/, '')) }
  if (/\.rackcdn\.com$/i.test(url.hostname)) return { kind: 'ext', locator: url.toString() }
  return null
}

export function canonicalSource(descriptor) {
  return `${descriptor.kind}:${descriptor.locator}`
}

export function hostedImageId(descriptor) {
  return `lp/${sha256(canonicalSource(descriptor))}`
}

export function legacyWorkerUrl(descriptor, options = {}, workerBase = DEFAULT_LEGACY_WORKER) {
  const url = descriptor.kind === 'ext'
    ? new URL('/ext', workerBase)
    : descriptor.kind === 'site'
      ? new URL(`/site/${descriptor.locator}`, workerBase)
      : new URL(`/${descriptor.locator}`, workerBase)

  if (descriptor.kind === 'ext') url.searchParams.set('url', descriptor.locator)
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

export function sourceUrl(descriptor, originalUrl, siteOrigin = 'https://lashpop.vercel.app') {
  if (descriptor.kind === 'site') return new URL(`/${descriptor.locator}`, siteOrigin).toString()
  return originalUrl
}

async function walkFiles(root) {
  const results = []
  const entries = await readdir(root, { withFileTypes: true })
  for (const entry of entries) {
    const absolute = path.join(root, entry.name)
    if (entry.isDirectory()) results.push(...await walkFiles(absolute))
    else results.push(absolute)
  }
  return results
}

async function runtimeLocalReferences() {
  const references = new Set()
  for (const rootName of ['src', 'workers']) {
    const root = path.join(PROJECT_ROOT, rootName)
    const files = await walkFiles(root)
    for (const file of files) {
      if (!/\.(?:css|js|jsx|ts|tsx)$/.test(file)) continue
      const contents = await readFile(file, 'utf8')
      for (const match of contents.matchAll(/(\/lashpop-images\/[A-Za-z0-9_./@%+\-]+)/g)) {
        const imagePath = match[1].split(/[?#]/, 1)[0]
        if (RASTER_RE.test(imagePath)) references.add(imagePath)
      }
    }
  }
  return references
}

async function queryProductionRows() {
  const databaseUrl = process.env.CLOUDFLARE_DB_URL?.replace(/\/$/, '')
  const databaseToken = process.env.CLOUDFLARE_DB_TOKEN
  if (!databaseUrl || !databaseToken) {
    throw new Error('CLOUDFLARE_DB_URL and CLOUDFLARE_DB_TOKEN are required for the runtime inventory')
  }

  async function query(sql, label) {
    const response = await fetch(`${databaseUrl}/query`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${databaseToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ sql, params: [], method: 'all' }),
    })
    if (!response.ok) {
      throw new Error(`Production image inventory query failed for ${label} (${response.status})`)
    }
    const payload = await response.json()
    return Array.isArray(payload.rows)
      ? payload.rows.map(([url, source_kind, source_id]) => ({ url, source_kind, source_id }))
      : []
  }

  const groups = await Promise.all([
    query(RUNTIME_IMAGE_SQL, 'primary sources'),
    ...AUXILIARY_RUNTIME_IMAGE_SQL.map((sql, index) => query(sql, `auxiliary source ${index + 1}`)),
  ])
  return groups.flat()
}

export async function buildRuntimeInventory() {
  loadEnvironment()
  const rows = await queryProductionRows()
  const byCanonical = new Map()

  for (const row of rows) {
    const descriptor = canonicalSourceForUrl(row.url)
    if (!descriptor) continue
    const canonical = canonicalSource(descriptor)
    const existing = byCanonical.get(canonical)
    if (existing) {
      existing.references.push({ kind: row.source_kind, id: row.source_id })
      continue
    }
    byCanonical.set(canonical, {
      canonical,
      descriptor,
      imageId: hostedImageId(descriptor),
      originalUrl: row.url,
      references: [{ kind: row.source_kind, id: row.source_id }],
    })
  }

  for (const localPath of await runtimeLocalReferences()) {
    const descriptor = canonicalSourceForUrl(localPath)
    if (!descriptor) continue
    const canonical = canonicalSource(descriptor)
    if (byCanonical.has(canonical)) continue
    byCanonical.set(canonical, {
      canonical,
      descriptor,
      imageId: hostedImageId(descriptor),
      originalUrl: localPath,
      references: [{ kind: 'site-code', id: localPath }],
    })
  }

  return [...byCanonical.values()].sort((a, b) => a.canonical.localeCompare(b.canonical))
}

export async function localSourceFile(item) {
  if (item.descriptor.kind !== 'site') return null
  const absolute = path.join(PROJECT_ROOT, 'public', item.descriptor.locator)
  const info = await stat(absolute)
  if (!info.isFile()) throw new Error(`Local image is not a file: ${item.descriptor.locator}`)
  return { absolute, size: info.size }
}

export function accountConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  if (!accountId || !apiToken) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required')
  }
  return { accountId, apiToken }
}

export async function imagesApi(pathname, init = {}) {
  const { accountId, apiToken } = accountConfig()
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}${pathname}`
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await fetch(endpoint, {
      ...init,
      headers: {
        authorization: `Bearer ${apiToken}`,
        ...init.headers,
      },
    })
    const text = await response.text()
    let payload = null
    try {
      payload = text ? JSON.parse(text) : null
    } catch {
      payload = { raw: text }
    }
    if (response.status !== 429 || attempt === 5) return { response, payload }

    const retryAfter = Number(response.headers.get('retry-after'))
    const delay = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : Math.min(4000, 250 * (2 ** attempt))
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
  throw new Error('Cloudflare Images API retry loop exited unexpectedly')
}

export async function hostedImageDetails(imageId) {
  const encoded = encodeURIComponent(imageId)
  const { response, payload } = await imagesApi(`/images/v1/${encoded}`)
  if (response.status === 404) return null
  if (!response.ok || payload?.success === false) {
    throw new Error(`Cloudflare image lookup failed (${response.status})`)
  }
  return payload.result
}

export function accountHashFromImage(image) {
  for (const variant of image?.variants || []) {
    const match = String(variant).match(/^https:\/\/imagedelivery\.net\/([^/]+)\//)
    if (match) return match[1]
  }
  return null
}
