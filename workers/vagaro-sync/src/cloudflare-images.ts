const HOSTED_UPLOAD_LIMIT = 10 * 1024 * 1024
const DELIVERY_HOST = 'imagedelivery.net'

export interface CloudflareImagesEnv {
  DB: D1Database
  CLOUDFLARE_ACCOUNT_ID: string
  CLOUDFLARE_IMAGES_ACCOUNT_HASH: string
  CLOUDFLARE_IMAGES_API_TOKEN?: string
}

export interface VagaroImageRequest {
  sourceKey: string
  sourceKind: 'vagaro-service' | 'vagaro-staff'
  sourceUrl: string
}

export interface ImageRegistryRow {
  source_key: string
  source_kind: string
  source_url: string
  cloudflare_image_id: string
  delivery_url: string
  previous_cloudflare_image_id: string | null
  source_etag: string | null
  source_last_modified: string | null
  source_content_length: number | null
  source_content_hash: string | null
  status: string
  failure_count: number
  last_error: string | null
  checked_at: number
  ingested_at: number
  refreshed_at: number
}

export interface ImageRegistry {
  get(sourceKey: string): Promise<ImageRegistryRow | null>
  recordSuccess(input: {
    request: VagaroImageRequest
    imageId: string
    deliveryUrl: string
    previousImageId: string | null
    etag: string | null
    lastModified: string | null
    contentLength: number
    contentHash: string
    now: number
  }): Promise<void>
  recordFailure(sourceKey: string, message: string, now: number): Promise<void>
  touch(sourceKey: string, now: number): Promise<void>
}

export interface VagaroImageResult {
  status: 'ready' | 'existing' | 'preserved'
  imageId: string
  deliveryUrl: string
  sourceUrl: string
}

function cleanHeader(value: string | null): string | null {
  const cleaned = value?.trim()
  return cleaned ? cleaned : null
}

async function sha256(value: string | ArrayBuffer): Promise<string> {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

export function validateVagaroImageSource(sourceUrl: string): URL {
  const url = new URL(sourceUrl)
  if (url.protocol !== 'https:' || !/\.rackcdn\.com$/i.test(url.hostname)) {
    throw new Error('Vagaro image source must be HTTPS on an allow-listed rackcdn.com host')
  }
  return url
}

function deliveryUrl(accountHash: string, imageId: string): string {
  return `https://${DELIVERY_HOST}/${accountHash}/${imageId}/public`
}

function createD1Registry(database: D1Database): ImageRegistry {
  return {
    async get(sourceKey) {
      return await database
        .prepare('SELECT * FROM public_image_sources WHERE source_key = ? LIMIT 1')
        .bind(sourceKey)
        .first<ImageRegistryRow>()
    },
    async recordSuccess(input) {
      await database.prepare(`
        INSERT INTO public_image_sources (
          source_key, source_kind, source_url, cloudflare_image_id, delivery_url,
          previous_cloudflare_image_id, source_etag, source_last_modified,
          source_content_length, source_content_hash, status, failure_count,
          last_error, checked_at, ingested_at, refreshed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready', 0, NULL, ?, ?, ?, ?, ?)
        ON CONFLICT(source_key) DO UPDATE SET
          source_kind = excluded.source_kind,
          source_url = excluded.source_url,
          cloudflare_image_id = excluded.cloudflare_image_id,
          delivery_url = excluded.delivery_url,
          previous_cloudflare_image_id = excluded.previous_cloudflare_image_id,
          source_etag = excluded.source_etag,
          source_last_modified = excluded.source_last_modified,
          source_content_length = excluded.source_content_length,
          source_content_hash = excluded.source_content_hash,
          status = 'ready', failure_count = 0, last_error = NULL,
          checked_at = excluded.checked_at,
          refreshed_at = excluded.refreshed_at,
          updated_at = excluded.updated_at
      `).bind(
        input.request.sourceKey,
        input.request.sourceKind,
        input.request.sourceUrl,
        input.imageId,
        input.deliveryUrl,
        input.previousImageId,
        input.etag,
        input.lastModified,
        input.contentLength,
        input.contentHash,
        input.now,
        input.now,
        input.now,
        input.now,
        input.now,
      ).run()
    },
    async recordFailure(sourceKey, message, now) {
      await database.prepare(`
        UPDATE public_image_sources
        SET failure_count = failure_count + 1, last_error = ?, checked_at = ?, updated_at = ?
        WHERE source_key = ?
      `).bind(message.slice(0, 500), now, now, sourceKey).run()
    },
    async touch(sourceKey, now) {
      await database.prepare(`
        UPDATE public_image_sources
        SET checked_at = ?, failure_count = 0, last_error = NULL, updated_at = ?
        WHERE source_key = ?
      `).bind(now, now, sourceKey).run()
    },
  }
}

async function uploadCloudflareImage(
  env: CloudflareImagesEnv,
  request: VagaroImageRequest,
  imageId: string,
  contentType: string,
  bytes: ArrayBuffer,
  contentHash: string,
): Promise<'uploaded' | 'existing'> {
  const token = env.CLOUDFLARE_IMAGES_API_TOKEN?.trim()
  if (!token) throw new Error('CLOUDFLARE_IMAGES_API_TOKEN is required for Vagaro image ingestion')

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1`
  const headers = { authorization: `Bearer ${token}` }
  const existing = await fetch(`${endpoint}/${encodeURIComponent(imageId)}`, { headers })
  if (existing.ok) return 'existing'
  if (existing.status !== 404) throw new Error(`Cloudflare Images lookup failed (${existing.status})`)

  const form = new FormData()
  form.set('id', imageId)
  form.set('requireSignedURLs', 'false')
  form.set('metadata', JSON.stringify({
    lpVersion: 2,
    kind: request.sourceKind,
    sourceKey: request.sourceKey,
    sourceHash: await sha256(request.sourceUrl),
    contentHash,
  }))
  form.set('file', new Blob([bytes], { type: contentType }), 'vagaro-image')

  const response = await fetch(endpoint, { method: 'POST', headers, body: form })
  if (!response.ok) throw new Error(`Cloudflare Images upload failed (${response.status})`)
  return 'uploaded'
}

export async function ingestVagaroImage(
  env: CloudflareImagesEnv,
  registry: ImageRegistry,
  request: VagaroImageRequest,
): Promise<VagaroImageResult> {
  validateVagaroImageSource(request.sourceUrl)
  const now = Date.now()
  const current = await registry.get(request.sourceKey)

  const conditionalHeaders = new Headers()
  if (current?.source_url === request.sourceUrl && current.source_etag) {
    conditionalHeaders.set('if-none-match', current.source_etag)
  }
  if (current?.source_url === request.sourceUrl && current.source_last_modified) {
    conditionalHeaders.set('if-modified-since', current.source_last_modified)
  }

  try {
    const source = await fetch(request.sourceUrl, { headers: conditionalHeaders })
    if (source.status === 304 && current?.status === 'ready') {
      await registry.touch(request.sourceKey, now)
      return {
        status: 'existing',
        imageId: current.cloudflare_image_id,
        deliveryUrl: current.delivery_url,
        sourceUrl: request.sourceUrl,
      }
    }
    if (!source.ok) throw new Error(`Vagaro image source returned ${source.status}`)

    const contentType = cleanHeader(source.headers.get('content-type'))?.split(';', 1)[0] ?? ''
    if (!contentType.startsWith('image/')) throw new Error(`Vagaro source is not an image (${contentType || 'unknown'})`)

    const declaredLength = Number(source.headers.get('content-length') || 0)
    if (declaredLength > HOSTED_UPLOAD_LIMIT) {
      throw new Error(`Vagaro image exceeds Cloudflare Images upload limit (${declaredLength})`)
    }

    const bytes = await source.arrayBuffer()
    if (bytes.byteLength > HOSTED_UPLOAD_LIMIT) {
      throw new Error(`Vagaro image exceeds Cloudflare Images upload limit (${bytes.byteLength})`)
    }

    const contentHash = await sha256(bytes)
    if (
      current?.status === 'ready'
      && current.source_url === request.sourceUrl
      && !current.source_content_hash
    ) {
      await registry.recordSuccess({
        request,
        imageId: current.cloudflare_image_id,
        deliveryUrl: current.delivery_url,
        previousImageId: current.previous_cloudflare_image_id,
        etag: cleanHeader(source.headers.get('etag')),
        lastModified: cleanHeader(source.headers.get('last-modified')),
        contentLength: bytes.byteLength,
        contentHash,
        now,
      })
      return {
        status: 'existing',
        imageId: current.cloudflare_image_id,
        deliveryUrl: current.delivery_url,
        sourceUrl: request.sourceUrl,
      }
    }
    if (
      current?.status === 'ready'
      && current.source_url === request.sourceUrl
      && current.source_content_hash === contentHash
    ) {
      await registry.touch(request.sourceKey, now)
      return {
        status: 'existing',
        imageId: current.cloudflare_image_id,
        deliveryUrl: current.delivery_url,
        sourceUrl: request.sourceUrl,
      }
    }

    const entityHash = await sha256(request.sourceKey)
    const imageId = `lp/vagaro/${entityHash}/${contentHash}`
    const uploadStatus = await uploadCloudflareImage(env, request, imageId, contentType, bytes, contentHash)
    const directUrl = deliveryUrl(env.CLOUDFLARE_IMAGES_ACCOUNT_HASH, imageId)
    await registry.recordSuccess({
      request,
      imageId,
      deliveryUrl: directUrl,
      previousImageId: current?.cloudflare_image_id ?? null,
      etag: cleanHeader(source.headers.get('etag')),
      lastModified: cleanHeader(source.headers.get('last-modified')),
      contentLength: bytes.byteLength,
      contentHash,
      now,
    })
    return { status: uploadStatus === 'existing' ? 'existing' : 'ready', imageId, deliveryUrl: directUrl, sourceUrl: request.sourceUrl }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await registry.recordFailure(request.sourceKey, message, now)
    if (current?.status === 'ready') {
      return {
        status: 'preserved',
        imageId: current.cloudflare_image_id,
        deliveryUrl: current.delivery_url,
        sourceUrl: current.source_url,
      }
    }
    throw error
  }
}

export function createVagaroImageIngestor(env: CloudflareImagesEnv) {
  const registry = createD1Registry(env.DB)
  return (request: VagaroImageRequest) => ingestVagaroImage(env, registry, request)
}

export const cloudflareImagesInternals = {
  HOSTED_UPLOAD_LIMIT,
  createD1Registry,
  deliveryUrl,
  sha256,
}
