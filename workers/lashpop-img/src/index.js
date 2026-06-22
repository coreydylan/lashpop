// On-the-fly image resizer for the lashpop DAM.
// Reads originals from the lashpop-dam R2 bucket and transforms via the
// Cloudflare Images binding. Lives on the experialstudio account (no zone
// needed) since the old account's cdn.lashpopstudios.com transform is offline.
//
//   GET /<key>?w=<width>&q=<quality>&dpr=<1|2>&f=<auto|avif|webp|jpeg>
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

const MAX_WIDTH = 2400 // cap so a bare (no-width) request still optimizes huge originals
const DEFAULT_QUALITY = 82

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

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 })
    }
    const url = new URL(request.url)
    const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''))
    if (!key) return new Response('lashpop-img ok', { status: 200 })

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

    // Format-aware cache key (URL has no format, negotiation is by Accept).
    const cacheUrl = new URL(request.url)
    cacheUrl.searchParams.set('fmt', format)
    cacheUrl.searchParams.set('dpr', String(dpr))
    const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' })
    const cache = caches.default
    const hit = await cache.match(cacheKey)
    if (hit) return hit

    const obj = await env.BUCKET.get(key)
    if (!obj) return new Response('Not found', { status: 404 })
    const srcCT = obj.httpMetadata?.contentType || 'image/jpeg'

    // Effective render width accounting for retina. scale-down still prevents
    // upscaling past the source, so dpr only ever helps when the source is big.
    const renderWidth = width ? width * dpr : MAX_WIDTH * dpr

    let resp
    try {
      const transform = { fit: 'scale-down', width: renderWidth }
      // Light sharpening helps perceived crispness after downscaling photos.
      if (width) transform.sharpen = 1
      const out = await env.IMAGES.input(obj.body)
        .transform(transform)
        .output({ format: OUTPUT[format], quality })
      resp = out.response()
    } catch (e) {
      // Transform failed (unsupported/corrupt input) -> serve original bytes.
      const fb = await env.BUCKET.get(key)
      resp = new Response(fb.body, { headers: { 'content-type': srcCT } })
    }

    const headers = new Headers(resp.headers)
    headers.set('cache-control', 'public, max-age=31536000, immutable')
    headers.set('access-control-allow-origin', '*')
    headers.set('vary', 'Accept')
    headers.set('x-lp-img-format', format)
    const final = new Response(resp.body, { status: resp.status, headers })
    ctx.waitUntil(cache.put(cacheKey, final.clone()))
    return final
  },
}
