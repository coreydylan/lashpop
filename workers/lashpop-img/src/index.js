// On-the-fly image resizer for the lashpop DAM.
// Reads originals from the lashpop-dam R2 bucket and transforms via the
// Cloudflare Images binding. Lives on the experialstudio account (no zone
// needed) since the old account's cdn.lashpopstudios.com transform is offline.
//   GET /<key>?w=<width>&q=<quality>
export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 })
    }
    const url = new URL(request.url)
    const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''))
    if (!key) return new Response('lashpop-img ok', { status: 200 })

    const cache = caches.default
    const hit = await cache.match(request)
    if (hit) return hit

    const obj = await env.BUCKET.get(key)
    if (!obj) return new Response('Not found', { status: 404 })

    const width = parseInt(url.searchParams.get('w') || url.searchParams.get('width') || '', 10)
    const quality = parseInt(url.searchParams.get('q') || url.searchParams.get('quality') || '80', 10)
    const srcCT = obj.httpMetadata?.contentType || 'image/jpeg'

    let resp
    try {
      if (!width || srcCT === 'image/heic' || srcCT === 'image/heif') {
        resp = new Response(obj.body, { headers: { 'content-type': srcCT } })
      } else {
        const out = await env.IMAGES.input(obj.body)
          .transform({ width })
          .output({ format: 'image/webp', quality: isNaN(quality) ? 80 : quality })
        resp = out.response()
      }
    } catch (e) {
      // transform failed (e.g. unsupported input) -> serve original
      const fb = await env.BUCKET.get(key)
      resp = new Response(fb.body, { headers: { 'content-type': srcCT } })
    }

    const headers = new Headers(resp.headers)
    headers.set('cache-control', 'public, max-age=31536000, immutable')
    headers.set('access-control-allow-origin', '*')
    const final = new Response(resp.body, { status: resp.status, headers })
    ctx.waitUntil(cache.put(request, final.clone()))
    return final
  }
}
