// On-the-fly image resizer for the lashpop DAM.
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
const CACHE_VERSION = 'stream-input-v2'
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

    // Format-aware cache key (URL has no format, negotiation is by Accept).
    const cacheUrl = new URL(request.url)
    cacheUrl.searchParams.set('fmt', format)
    cacheUrl.searchParams.set('dpr', String(dpr))
    cacheUrl.searchParams.set('lpv', CACHE_VERSION)
    const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' })
    const cache = caches.default
    const hit = await cache.match(cacheKey)
    if (hit) {
      // A transformed variant can outlive its source object because variants
      // are cached for a year. Confirm R2-backed sources still exist before
      // serving a hit so an owner deletion takes effect immediately. External
      // and site-proxied sources keep their upstream cache behavior.
      if (key !== 'ext' && !key.startsWith('site/')) {
        const sourceStillExists = await env.BUCKET.head(key)
        if (!sourceStillExists) {
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

    const src = await getSource(url, key, env)
    if (src instanceof Response) return src
    if (!/^image\//i.test(src.contentType)) {
      return new Response('Unsupported media type', {
        status: 415,
        headers: { 'cache-control': 'private, no-store' },
      })
    }

    // SVGs can't go through the Images binding — serve as-is.
    const isSvg = /image\/svg/.test(src.contentType) || /\.svg(\?|$)/i.test(key)

    // Effective render width accounting for retina. scale-down still prevents
    // upscaling past the source, so dpr only ever helps when the source is big.
    const renderWidth = width ? width * dpr : MAX_WIDTH * dpr
    const renderHeight = height ? height * dpr : 0

    let resp
    if (isSvg) {
      resp = new Response(src.body, { headers: { 'content-type': 'image/svg+xml' } })
    } else {
      try {
        const transform = renderHeight
          ? { fit, width: renderWidth, height: renderHeight, gravity }
          : { fit: 'scale-down', width: renderWidth }
        // Light sharpening helps perceived crispness after downscaling photos.
        if (sharpen) transform.sharpen = sharpen
        const out = await env.IMAGES.input(src.body)
          .transform(transform)
          .output({ format: OUTPUT[format], quality })
        resp = out.response()
        if (!resp.ok) {
          throw new Error(`Images binding returned HTTP ${resp.status}`)
        }
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

    const headers = new Headers(resp.headers)
    headers.set('cache-control', 'public, max-age=31536000, immutable')
    headers.set('access-control-allow-origin', '*')
    headers.set('vary', 'Accept')
    headers.set('x-lp-img-format', format)
    if (renderHeight) headers.set('x-lp-img-crop', `${renderWidth}x${renderHeight}`)
    const final = new Response(resp.body, { status: resp.status, headers })
    ctx.waitUntil(
      cache.put(cacheKey, final.clone()).catch((error) => {
        console.warn(JSON.stringify({
          message: 'image cache write failed',
          error: messageFromError(error),
          key,
          format,
        }))
      }),
    )
    return request.method === 'HEAD'
      ? new Response(null, { status: final.status, headers: final.headers })
      : final
  },
}

export default lashpopImageWorker
