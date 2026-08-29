import {
  hostedImageId,
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
const CACHE_VERSION = 'hosted-source-v13-native-binding'
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
const STORAGE_PATH_PREFIX = '/__storage/'
const encoder = new TextEncoder()

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

async function verifyBearer(request, expected) {
  const authorization = request.headers.get('authorization') || ''
  const provided = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : ''
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected || '')),
  ])
  return crypto.subtle.timingSafeEqual(providedHash, expectedHash)
}

async function handleStorageRequest(request, env, url) {
  if (!env.STORAGE_PROXY_TOKEN || !(await verifyBearer(request, env.STORAGE_PROXY_TOKEN))) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'cache-control': 'private, no-store' },
    })
  }

  const key = decodeURIComponent(url.pathname.slice(STORAGE_PATH_PREFIX.length))
  if (!key || key.includes('\0')) {
    return new Response('Invalid object key', { status: 400 })
  }

  if (request.method === 'PUT') {
    if (!request.body) return new Response('Request body required', { status: 400 })
    await env.BUCKET.put(key, request.body, {
      httpMetadata: {
        contentType: request.headers.get('content-type') || 'application/octet-stream',
        cacheControl: request.headers.get('cache-control') || undefined,
      },
    })
    return new Response(null, { status: 204 })
  }

  if (request.method === 'GET') {
    const object = await env.BUCKET.get(key)
    if (!object) return new Response('Not found', { status: 404 })
    const headers = new Headers({ 'cache-control': 'private, no-store' })
    object.writeHttpMetadata(headers)
    return new Response(object.body, { headers })
  }

  if (request.method === 'DELETE') {
    await env.BUCKET.delete(key)
    return new Response(null, { status: 204 })
  }

  return new Response('Method not allowed', { status: 405 })
}

function requestedBackend(key, env) {
  // Booking-provider photos remain externally owned and are always refreshed
  // from the allow-listed upstream. First-party images have exactly one
  // production source: Cloudflare Images. Rollback is a Worker version/env
  // change, never a public query-string escape hatch or automatic fallback.
  if (key === 'ext') return 'external'
  return env.IMAGE_BACKEND === 'hosted' ? 'hosted' : 'legacy'
}

function actualFormat(response, requestedFormat) {
  const contentType = (response.headers.get('content-type') || '').split(';', 1)[0].toLowerCase()
  if (contentType === 'image/avif') return 'avif'
  if (contentType === 'image/webp') return 'webp'
  if (contentType === 'image/jpeg') return 'jpeg'
  if (contentType === 'image/png') return 'png'
  if (contentType === 'image/gif') return 'gif'
  return requestedFormat
}

function responseHeaders(response, { backend, requestedFormat, renderWidth, renderHeight }) {
  const headers = new Headers(response.headers)
  const format = actualFormat(response, requestedFormat)
  headers.set('cache-control', backend === 'external'
    ? 'public, max-age=86400, stale-while-revalidate=3600'
    : 'public, max-age=31536000, immutable')
  headers.set('access-control-allow-origin', '*')
  headers.set('vary', 'Accept')
  headers.set('x-lp-img-backend', backend)
  headers.set('x-lp-img-source', backend === 'hosted'
    ? 'cloudflare-images'
    : backend === 'external'
      ? 'vagaro-rackcdn'
      : 'legacy-origin')
  headers.set('x-lp-img-format', format)
  if (format !== requestedFormat) headers.set('x-lp-img-requested-format', requestedFormat)
  if (renderHeight) headers.set('x-lp-img-crop', `${renderWidth}x${renderHeight}`)
  return headers
}

async function getHostedSource(env, descriptor) {
  const imageId = await hostedImageId(descriptor)
  if (!env.IMAGES?.hosted) {
    return { source: null, failure: 'hosted-binding-unavailable', imageId }
  }

  try {
    const body = await env.IMAGES.hosted.image(imageId).bytes()
    return { source: { body, contentType: 'image/hosted' }, failure: null, imageId }
  } catch (error) {
    const message = messageFromError(error)
    const failure = error?.status === 404 || /(?:404|not found)/i.test(message)
      ? 'hosted-not-found'
      : 'hosted-source-failed'
    return { source: null, failure, imageId }
  }
}

async function hostedSourceStatus(env, descriptor) {
  if (!env.IMAGES?.hosted) return 'unknown'
  const imageId = await hostedImageId(descriptor)
  try {
    await env.IMAGES.hosted.image(imageId).details()
    return 'present'
  } catch (error) {
    const message = messageFromError(error)
    return error?.status === 404 || /(?:404|not found)/i.test(message)
      ? 'missing'
      : 'unknown'
  }
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

async function sourceForBackend(url, key, env, backend) {
  if (backend === 'external') {
    return { source: await getSource(url, key, env), backend: 'external', imageId: null }
  }
  if (backend !== 'hosted') {
    return { source: await getSource(url, key, env), backend: 'legacy', imageId: null }
  }

  let descriptor
  try {
    descriptor = sourceDescriptor(url, key)
  } catch {
    return { source: new Response('Bad url param', { status: 400 }), backend: 'hosted', imageId: null }
  }

  const hosted = await getHostedSource(env, descriptor)
  if (hosted.source) {
    return { source: hosted.source, backend: 'hosted', imageId: hosted.imageId }
  }
  const status = hosted.failure === 'hosted-not-found' ? 404 : 502
  return {
    source: new Response(status === 404 ? 'Not found' : 'Hosted image source unavailable', {
      status,
      headers: {
        'cache-control': 'private, no-store',
        'content-type': 'text/plain; charset=utf-8',
        'x-lp-img-backend': 'hosted',
        'x-lp-img-error': hosted.failure,
        'x-lp-img-id': hosted.imageId,
        'x-lp-img-source': 'cloudflare-images',
      },
    }),
    backend: 'hosted',
    imageId: hosted.imageId,
  }
}

const lashpopImageWorker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (url.pathname.startsWith(STORAGE_PATH_PREFIX)) {
      return handleStorageRequest(request, env, url)
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 })
    }
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
    const backend = requestedBackend(key, env)

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
      // Isolated verification environments re-check the selected source of
      // truth before serving a year-lived transform so deletions take effect.
      if (env.VERIFY_SOURCE_ON_CACHE_HIT === 'true') {
        let sourceStatus = 'present'
        if (backend === 'hosted') {
          try {
            sourceStatus = await hostedSourceStatus(env, sourceDescriptor(url, key))
          } catch {
            sourceStatus = 'missing'
          }
        } else if (backend === 'legacy' && !key.startsWith('site/')) {
          sourceStatus = await env.BUCKET.head(key) ? 'present' : 'missing'
        }
        if (sourceStatus === 'missing') {
          ctx.waitUntil(cache.delete(cacheKey))
          return new Response('Not found', {
            status: 404,
            headers: { 'cache-control': 'private, no-store' },
          })
        }
      }
      return request.method === 'HEAD'
        ? new Response(null, { status: hit.status, headers: hit.headers })
        : hit
    }

    const selected = await sourceForBackend(url, key, env, backend)
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

    const headers = responseHeaders(resp, {
      backend: selected.backend,
      requestedFormat: format,
      renderWidth,
      renderHeight,
    })
    if (selected.imageId) headers.set('x-lp-img-id', selected.imageId)
    const final = new Response(resp.body, { status: resp.status, headers })
    if (request.method === 'GET') {
      await cacheFinalResponse(cache, cacheKey, final, ctx, { key, format, backend: selected.backend })
    }
    return request.method === 'HEAD'
      ? new Response(null, { status: final.status, headers: final.headers })
      : final
  },
}

export default lashpopImageWorker
