import {
  hostedImageId,
  hostedVariantId,
  sourceDescriptor,
} from './hosted.js'

// Zero-downtime image router and legacy on-the-fly resizer for the LashPop DAM.
// Reads originals from the lashpop-dam R2 bucket and transforms via the
// Cloudflare Images binding. Lives on the experialstudio account (no zone
// needed) since the old account's cdn.lashpopstudios.com transform is offline.
//
//   GET /<key>?w=<width>&h=<height>&fit=cover&gx=<0..1>&gy=<0..1>        optional focal crop
//   GET /site/<path>?w=&q=                                              site /public asset (proxied from SITE_ORIGIN)
//   GET /ext?url=<https://...rackcdn.com/...>&w=&q=                     allow-listed external origin (Vagaro CDN)
//
// Quality features:
//  - Per-request format negotiation from the Accept header: AVIF > WebP > JPEG.
//    AVIF is ~20-30% smaller than WebP at equal quality, so modern browsers get
//    the best bytes-per-quality; older ones fall back cleanly.
//  - HEIC/HEIF inputs are transcoded to a web format (browsers can't render
//    HEIC). Cloudflare Images added HEIC ingest in Jul 2025.
//  - Retina via dpr (1-2): multiplies the rendered resolution for crisp output
//    on high-density screens without upscaling the source.
//  - Mild sharpen on downscale to keep detail crisp after resize.
//  - fit=scale-down so we never upscale past the original.
//  - Cache key is format-aware and responses carry `Vary: Accept`, so an AVIF
//    payload is never served to a WebP-only client (or vice versa).
//
// Successful transformed variants are edge-cached immutable for a year. The
// internal cache version is deliberately part of every key so a pipeline fix
// cannot keep serving responses written by an older Worker implementation.
// Failed transforms are never cached and never masquerade as optimized files.

// 3840 covers a 2x-retina ~1920-CSS-px hero without browser upscale — a 2400
// cap forced 1.5-1.7x upscaling on large Mac displays, which read as blurry.
const MAX_WIDTH = 3840 // cap so a bare (no-width) request still optimizes huge originals
const MAX_HEIGHT = 4096
// 90, not 82: faces dominate this site and AVIF/WebP at 82 visibly smooths
// skin texture vs the originals. Bytes are still 10-20x under the raw files.
const DEFAULT_QUALITY = 90
const CACHE_VERSION = 'hosted-source-v12-public-url-reference'
const HOSTED_BLOB_CACHE_VERSION = 'hosted-blob-v1'
const SITE_ORIGIN = 'https://lashpop.vercel.app'
// Only proxy site paths under this prefix — everything image-like in /public
// lives here, and it keeps the worker from becoming an open proxy to the app.
const SITE_PATH_PREFIX = 'lashpop-images/'
// External hosts we'll fetch and optimize. Vagaro serves staff photos as
// multi-MB "/Original/" JPEGs from Rackspace CDN.
const EXT_HOST_RE = /\.rackcdn\.com$/i
// R2 contains operational objects in addition to public DAM media. Never let
// an image URL become a generic object-download endpoint for private prefixes.
const PRIVATE_KEY_PREFIXES = ['backups/', '.backups/']
// These two active DAM originals are 16-bit PNGs larger than Hosted Images'
// 10 MB source limit. Exact legacy outputs are precomputed into Hosted Images
// for every Next.js width/format. Unknown transforms stay on legacy rather
// than silently changing pixels.
const PRECOMPUTED_SOURCE_IDS = new Set([
  'lp/65812e87532b1be2944eacad12bcc22df48e4a06912601e06dc880bbf0548bb3',
  'lp/23ee938fcb1970fc68363207a1ffb1c714963111f6729d499b37f7a3ee72fa6d',
])
// The production legacy decoder returns 502 for this retired placeholder.
// Preserve that observable before-state instead of reviving an unused asset as
// part of the storage cutover.
const LEGACY_ONLY_SOURCE_IDS = new Set([
  'lp/9c79376ce6ff916a825f4811dc634f8092e22d3ebccba4c81a1e224682c56254',
])

const OUTPUT = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  png: 'image/png',
}

function negotiateFormat(request, override) {
  if (override && OUTPUT[override]) return override
  const accept = request.headers.get('accept') || ''
  if (/image\/avif/.test(accept)) return 'avif'
  if (/image\/webp/.test(accept)) return 'webp'
  return 'jpeg'
}

// Resolve the source bytes for a request. The Images binding accepts a
// ReadableStream; passing an ArrayBuffer throws before transformation begins.
// Keep every source streaming so large originals do not consume Worker memory.
async function getSource(url, key, env) {
  if (key === 'ext') {
    const target = url.searchParams.get('url') || ''
    let ext
    try {
      ext = new URL(target)
    } catch {
      return new Response('Bad url param', { status: 400 })
    }
    if (ext.protocol !== 'https:' || !EXT_HOST_RE.test(ext.hostname)) {
      return new Response('Host not allowed', { status: 403 })
    }
    const resp = await fetch(ext.toString(), { cf: { cacheTtl: 86400, cacheEverything: true } })
    if (!resp.ok) return new Response('Upstream fetch failed', { status: 502 })
    if (!resp.body) return new Response('Upstream response had no body', { status: 502 })
    return { body: resp.body, contentType: resp.headers.get('content-type') || 'image/jpeg' }
  }

  if (key.startsWith('site/')) {
    const path = key.slice('site/'.length)
    if (!path.startsWith(SITE_PATH_PREFIX)) {
      return new Response('Path not allowed', { status: 403 })
    }
    const resp = await fetch(`${SITE_ORIGIN}/${path}`, { cf: { cacheTtl: 86400, cacheEverything: true } })
    if (!resp.ok) return new Response('Not found', { status: resp.status === 404 ? 404 : 502 })
    if (!resp.body) return new Response('Upstream response had no body', { status: 502 })
    return { body: resp.body, contentType: resp.headers.get('content-type') || 'image/jpeg' }
  }

  const obj = await env.BUCKET.get(key)
  if (!obj) return new Response('Not found', { status: 404 })
  if (!obj.body) return new Response('Object had no body', { status: 502 })
  return { body: obj.body, contentType: obj.httpMetadata?.contentType || 'image/jpeg' }
}

function messageFromError(error) {
  return error instanceof Error ? error.message : String(error)
}

function requestedBackend(url, env) {
  const override = (url.searchParams.get('backend') || '').toLowerCase()
  // A request may force the safe rollback path for diagnostics, but it cannot
  // opt production into Hosted Images. IMAGE_BACKEND remains the one cutover
  // control; the preview Worker sets that environment value to "hosted".
  if (override === 'legacy') return override
  return env.IMAGE_BACKEND === 'hosted' ? 'hosted' : 'legacy'
}

function responseHeaders(response, { backend, format, renderWidth, renderHeight, fallback }) {
  const headers = new Headers(response.headers)
  headers.set('cache-control', fallback
    ? 'public, max-age=300, stale-while-revalidate=60'
    : 'public, max-age=31536000, immutable')
  headers.set('access-control-allow-origin', '*')
  headers.set('vary', 'Accept')
  headers.set('x-lp-img-backend', backend)
  headers.set('x-lp-img-format', format)
  if (fallback) headers.set('x-lp-img-fallback', fallback)
  if (renderHeight) headers.set('x-lp-img-crop', `${renderWidth}x${renderHeight}`)
  return headers
}

async function getHostedSource(env, descriptor) {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_IMAGES_API_TOKEN) {
    return { source: null, failure: 'missing-hosted-credentials' }
  }

  const imageId = await hostedImageId(descriptor)
  const blob = await getHostedBlob(env, imageId)
  if (!blob.response) return { source: null, failure: blob.failure, imageId }

  return {
    source: {
      body: blob.response.body,
      contentType: blob.response.headers.get('content-type') || 'image/jpeg',
    },
    failure: null,
    imageId,
  }
}

const hostedBlobRequests = new Map()

async function fetchHostedBlob(env, imageId) {
  const cache = caches.default
  const cacheKey = new Request(
    `https://lashpop-hosted-blob-cache.invalid/${encodeURIComponent(imageId)}?v=${HOSTED_BLOB_CACHE_VERSION}`,
  )
  const cached = await cache.match(cacheKey)
  if (cached) {
    return {
      bytes: await cached.arrayBuffer(),
      contentType: cached.headers.get('content-type') || 'application/octet-stream',
      failure: null,
    }
  }

  let lastFailure = 'hosted-fetch-failed'
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1/${encodeURIComponent(imageId)}/blob`,
      { headers: { authorization: `Bearer ${env.CLOUDFLARE_IMAGES_API_TOKEN}` } },
    )

    if (response.ok && response.body) {
      const bytes = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || 'application/octet-stream'
      const cacheable = new Response(bytes, {
        status: 200,
        headers: {
          'cache-control': 'public, max-age=31536000, immutable',
          'content-type': contentType,
        },
      })
      await cache.put(cacheKey, cacheable).catch((error) => {
        console.warn(JSON.stringify({
          message: 'hosted blob cache write failed',
          error: messageFromError(error),
          imageId,
        }))
      })
      return { bytes, contentType, failure: null }
    }

    lastFailure = `hosted-http-${response.status}`
    response.body?.cancel().catch(() => {})
    if (response.status !== 429 && response.status < 500) break
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 50 * (2 ** attempt)))
  }
  return { response: null, failure: lastFailure }
}

async function getHostedBlob(env, imageId) {
  let pending = hostedBlobRequests.get(imageId)
  if (!pending) {
    pending = fetchHostedBlob(env, imageId).finally(() => hostedBlobRequests.delete(imageId))
    hostedBlobRequests.set(imageId, pending)
  }
  const result = await pending
  return result.bytes
    ? {
        response: new Response(result.bytes.slice(0), {
          status: 200,
          headers: { 'content-type': result.contentType },
        }),
        failure: null,
      }
    : result
}

async function unwrapExactVariant(response) {
  if (!/image\/svg\+xml/i.test(response.headers.get('content-type') || '')) return response
  const text = await response.text()
  const match = text.match(/<metadata id="lp-exact" data-mime="(image\/(?:avif|webp|jpeg))">([A-Za-z0-9+/=]+)<\/metadata>/)
  if (!match) {
    return new Response(text, { status: response.status, headers: response.headers })
  }
  const binary = atob(match[2])
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new Response(bytes, {
    status: response.status,
    headers: { 'content-type': match[1] },
  })
}

async function transformSource(src, env, { fit, renderWidth, renderHeight, gravity, sharpen, format, quality }) {
  const transform = renderHeight
    ? { fit, width: renderWidth, height: renderHeight, gravity }
    : { fit: 'scale-down', width: renderWidth }
  if (sharpen) transform.sharpen = sharpen
  const output = format === 'png' ? { format: OUTPUT[format] } : { format: OUTPUT[format], quality }
  const out = await env.IMAGES.input(src.body)
    .transform(transform)
    .output(output)
  const response = out.response()
  if (!response.ok) {
    throw new Error(`Images binding returned HTTP ${response.status}`)
  }
  return response
}

async function cacheFinalResponse(cache, cacheKey, final, ctx, details) {
  ctx.waitUntil(cache.put(cacheKey, final.clone()).catch((error) => {
    console.warn(JSON.stringify({
      message: 'image cache write failed',
      error: messageFromError(error),
      ...details,
    }))
  }))
}

function unsupportedSource(src) {
  if (!/^image\//i.test(src.contentType)) {
    return new Response('Unsupported media type', {
      status: 415,
      headers: { 'cache-control': 'private, no-store' },
    })
  }
  return null
}

function svgResponse(src, key) {
  const isSvg = /image\/svg/.test(src.contentType) || /\.svg(\?|$)/i.test(key)
  return isSvg
    ? new Response(src.body, { headers: { 'content-type': 'image/svg+xml' } })
    : null
}

async function sourceForBackend(url, key, env, backend, transformRequest) {
  if (backend !== 'hosted') {
    return { source: await getSource(url, key, env), backend: 'legacy', fallback: null, imageId: null }
  }

  let descriptor
  try {
    descriptor = sourceDescriptor(url, key)
  } catch {
    return { source: new Response('Bad url param', { status: 400 }), backend: 'hosted', fallback: null, imageId: null }
  }

  try {
    const imageId = await hostedImageId(descriptor)
    if (LEGACY_ONLY_SOURCE_IDS.has(imageId)) {
      return {
        source: await getSource(url, key, env),
        response: null,
        backend: 'legacy-pinned',
        fallback: 'production-legacy-unavailable',
        imageId,
      }
    }
    if (transformRequest.format === 'avif' || PRECOMPUTED_SOURCE_IDS.has(imageId)) {
      const variantId = await hostedVariantId(imageId, transformRequest)
      const variant = await getHostedBlob(env, variantId)
      if (variant.response) {
        const exactResponse = await unwrapExactVariant(variant.response)
        return {
          source: null,
          response: exactResponse,
          backend: 'hosted',
          fallback: null,
          imageId: variantId,
        }
      }
      // AVIF derivatives are pinned because Hosted Images source ingestion can
      // alter their decoded pixels even when JPEG/WebP remain exact. A new or
      // uncommon width stays on legacy until the next exact-variant backfill.
      return {
        source: await getSource(url, key, env),
        response: null,
        backend: 'legacy-pinned',
        fallback: variant.failure,
        imageId: variantId,
      }
    }

    const hosted = await getHostedSource(env, descriptor)
    if (hosted.source) {
      return { source: hosted.source, response: null, backend: 'hosted', fallback: null, imageId: hosted.imageId }
    }
    return {
      source: await getSource(url, key, env),
      response: null,
      backend: 'legacy',
      fallback: hosted.failure,
      imageId: hosted.imageId,
    }
  } catch (error) {
    console.warn(JSON.stringify({
      message: 'hosted image source failed; using legacy source',
      error: messageFromError(error),
      key,
    }))
    return {
      source: await getSource(url, key, env),
      response: null,
      backend: 'legacy',
      fallback: 'hosted-fetch-failed',
      imageId: null,
    }
  }
}

const lashpopImageWorker = {
  async fetch(request, env, ctx) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 })
    }
    const url = new URL(request.url)
    const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''))
    if (!key) return new Response('lashpop-img ok', { status: 200 })
    const normalizedKey = key.toLowerCase()
    if (PRIVATE_KEY_PREFIXES.some((prefix) => normalizedKey.startsWith(prefix))) {
      return new Response('Not found', {
        status: 404,
        headers: { 'cache-control': 'private, no-store' },
      })
    }

    const fmtOverride = (url.searchParams.get('f') || url.searchParams.get('format') || '').toLowerCase()
    const format = negotiateFormat(request, fmtOverride === 'auto' ? '' : fmtOverride)

    let width = parseInt(url.searchParams.get('w') || url.searchParams.get('width') || '', 10)
    if (isNaN(width) || width <= 0) width = 0
    if (width > MAX_WIDTH) width = MAX_WIDTH

    let quality = parseInt(url.searchParams.get('q') || url.searchParams.get('quality') || '', 10)
    if (isNaN(quality) || quality <= 0 || quality > 100) quality = DEFAULT_QUALITY

    let dpr = parseInt(url.searchParams.get('dpr') || '1', 10)
    if (isNaN(dpr) || dpr < 1) dpr = 1
    if (dpr > 2) dpr = 2

    let height = parseInt(url.searchParams.get('h') || url.searchParams.get('height') || '', 10)
    if (isNaN(height) || height <= 0) height = 0
    if (height > MAX_HEIGHT) height = MAX_HEIGHT

    const fit = height && url.searchParams.get('fit') === 'cover' ? 'cover' : 'scale-down'
    const normalizedGravity = (name) => {
      const value = Number.parseFloat(url.searchParams.get(name) || '')
      return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5
    }
    const gravity = { x: normalizedGravity('gx'), y: normalizedGravity('gy') }

    // Optional sharpen override (s=0..5). Default 1 on downscales — the CF
    // resize kernel is slightly soft; docs recommend 1 for downscaled photos.
    let sharpen = parseFloat(url.searchParams.get('s') ?? '')
    if (isNaN(sharpen) || sharpen < 0) sharpen = width ? 1 : 0
    if (sharpen > 5) sharpen = 5

    // Effective render width accounting for retina. scale-down still prevents
    // upscaling past the source, so dpr only ever helps when the source is big.
    const renderWidth = width ? width * dpr : MAX_WIDTH * dpr
    const renderHeight = height ? height * dpr : 0
    const backend = requestedBackend(url, env)

    // Format- and backend-aware cache key. A production flag flip must never
    // inherit a year-long cached response from the other delivery service.
    const cacheUrl = new URL(request.url)
    cacheUrl.searchParams.set('fmt', format)
    cacheUrl.searchParams.set('dpr', String(dpr))
    cacheUrl.searchParams.set('lp-backend', backend)
    cacheUrl.searchParams.set('lpv', CACHE_VERSION)
    const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' })
    const cache = caches.default
    const hit = await cache.match(cacheKey)
    if (hit) {
      return request.method === 'HEAD'
        ? new Response(null, { status: hit.status, headers: hit.headers })
        : hit
    }

    const transformRequest = {
      fit,
      width: renderWidth,
      height: renderHeight,
      gravity,
      quality,
      format,
      sharpen,
    }
    const selected = await sourceForBackend(url, key, env, backend, transformRequest)
    if (selected.response) {
      const headers = responseHeaders(selected.response, {
        backend: selected.backend,
        format,
        renderWidth,
        renderHeight,
        fallback: selected.fallback,
      })
      headers.set('x-lp-img-id', selected.imageId)
      const final = new Response(selected.response.body, { status: selected.response.status, headers })
      if (request.method === 'GET') {
        await cacheFinalResponse(cache, cacheKey, final, ctx, {
          key,
          format,
          backend: selected.backend,
          precomputed: true,
        })
      }
      return request.method === 'HEAD'
        ? new Response(null, { status: final.status, headers: final.headers })
        : final
    }
    const src = selected.source
    if (src instanceof Response) return src
    const unsupported = unsupportedSource(src)
    if (unsupported) return unsupported

    let resp
    const svg = svgResponse(src, key)
    if (svg) {
      resp = svg
    } else {
      const bindingTransformRequest = {
        fit,
        renderWidth,
        renderHeight,
        gravity,
        sharpen,
        format,
        quality,
      }
      try {
        resp = await transformSource(src, env, bindingTransformRequest)
      } catch (error) {
        // A small number of recovered objects have stale MIME metadata or an
        // unsupported original encoding. If the legacy decoder fails, retry
        // from the normalized Hosted Images copy before returning an error.
        if (backend === 'legacy' && selected.backend === 'legacy' && !selected.fallback) {
          try {
            const descriptor = sourceDescriptor(url, key)
            const hosted = await getHostedSource(env, descriptor)
            if (hosted.source) {
              resp = await transformSource(hosted.source, env, bindingTransformRequest)
              selected.backend = 'hosted-repair'
              selected.imageId = hosted.imageId
            }
          } catch (repairError) {
            console.warn(JSON.stringify({
              message: 'hosted repair source also failed',
              error: messageFromError(repairError),
              key,
              format,
            }))
          }
        }
        if (!resp) {
          console.error(JSON.stringify({
            message: 'image transformation failed',
            error: messageFromError(error),
            key,
            width: renderWidth,
            height: renderHeight || undefined,
            format,
          }))
          return new Response('Image transformation failed', {
            status: 502,
            headers: {
              'cache-control': 'private, no-store',
              'content-type': 'text/plain; charset=utf-8',
              'x-lp-img-error': 'transform-failed',
            },
          })
        }
      }
    }

    const headers = responseHeaders(resp, {
      backend: selected.backend,
      format,
      renderWidth,
      renderHeight,
      fallback: selected.fallback,
    })
    if (selected.imageId) headers.set('x-lp-img-id', selected.imageId)
    const final = new Response(resp.body, { status: resp.status, headers })
    // Do not pin a legacy fallback under the hosted cache namespace. The short
    // browser/CDN TTL keeps the site available while a missing hosted object is
    // repaired, then the very next edge miss can use Hosted Images.
    if (!selected.fallback && request.method === 'GET') {
      await cacheFinalResponse(cache, cacheKey, final, ctx, { key, format, backend: selected.backend })
    }
    return request.method === 'HEAD'
      ? new Response(null, { status: final.status, headers: final.headers })
      : final
  },
}

export default lashpopImageWorker
