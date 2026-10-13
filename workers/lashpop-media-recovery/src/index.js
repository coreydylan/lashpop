import { registryRevision, sources } from './sources.js'

const WIDTHS = [64, 128, 256, 320, 384, 600, 900, 1152, 1200, 1440, 1600, 1800, 2400, 2880, 3200, 3840]
const MAX_SOURCE_BYTES = 20 * 1024 * 1024
const MIME = { avif: 'image/avif', webp: 'image/webp', jpeg: 'image/jpeg', png: 'image/png' }
const CACHE_VERSION = `recovery-v1-${registryRevision}`

function failure(status, message) {
  return new Response(message, { status, headers: { 'cache-control': 'private, no-store', 'content-type': 'text/plain; charset=utf-8', 'x-content-type-options': 'nosniff' } })
}

export function imageOptions(request, url, source) {
  const requested = Number(url.searchParams.get('w') || 1800)
  const quality = Number(url.searchParams.get('q') || 90)
  if (!Number.isFinite(requested) || requested <= 0 || !Number.isFinite(quality) || quality <= 0) return null
  const width = WIDTHS.find(value => value >= requested) || WIDTHS.at(-1)
  const normalizedQuality = quality <= 78 ? 78 : quality <= 85 ? 85 : 90
  const accept = new Map((request.headers.get('accept') || '').split(',').map(part => {
    const [mime, ...params] = part.trim().toLowerCase().split(';')
    const q = params.find(value => value.trim().startsWith('q='))
    return [mime, q ? Number(q.trim().slice(2)) : 1]
  }))
  // PNG fallback preserves alpha in logos/crops for clients without WebP/AVIF.
  const locator = source.key || source.url
  const fallback = /\.png(?:$|[?#])/i.test(locator) ? 'png' : 'jpeg'
  const format = (accept.get('image/avif') || 0) > 0 ? 'avif' : (accept.get('image/webp') || 0) > 0 ? 'webp' : fallback
  return { width, quality: normalizedQuality, format }
}

function limitedStream(body) {
  let bytes = 0
  return body.pipeThrough(new TransformStream({
    transform(chunk, controller) {
      bytes += chunk.byteLength
      if (bytes > MAX_SOURCE_BYTES) throw new Error('Source exceeds image input limit')
      controller.enqueue(chunk)
    },
  }))
}

async function sourceBytes(source, env) {
  if (source.kind === 'r2') {
    const object = await env.BUCKET.get(source.key)
    if (!object?.body) return failure(404, 'Image unavailable')
    if (object.size > MAX_SOURCE_BYTES) return failure(413, 'Image exceeds input limit')
    return limitedStream(object.body)
  }
  // This URL comes solely from the pinned public registry, never request input.
  const url = new URL(source.url)
  const allowed = source.kind === 'site'
    ? url.hostname === 'lashpopstudios.com' && url.pathname.startsWith('/lashpop-images/')
    : url.hostname === 'assets.vagaro.com' || url.hostname.endsWith('.rackcdn.com')
  if (!allowed || url.protocol !== 'https:' || url.username || url.password || url.port) return failure(403, 'Source not allowed')
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000) })
  if (!response.ok || !response.body) return failure(502, 'Image source unavailable')
  if (!/^image\//i.test(response.headers.get('content-type') || '')) return failure(415, 'Unsupported image source')
  if (Number(response.headers.get('content-length')) > MAX_SOURCE_BYTES) return failure(413, 'Image exceeds input limit')
  return limitedStream(response.body)
}

const mediaRecoveryWorker = {
  async fetch(request, env, ctx) {
    if (!['GET', 'HEAD'].includes(request.method)) return failure(405, 'Method not allowed')
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/image/') || url.pathname.includes('%')) return failure(404, 'Image not registered')
    const id = url.pathname.slice('/image/'.length)
    const source = Object.hasOwn(sources, id) ? sources[id] : null
    if (!source) return failure(404, 'Image not registered')
    if ([...url.searchParams.keys()].some(key => !['w', 'q'].includes(key))) return failure(400, 'Unsupported image option')
    const options = imageOptions(request, url, source)
    if (!options) return failure(400, 'Invalid image option')
    const cacheUrl = new URL(`/image/${id}`, url.origin)
    cacheUrl.search = new URLSearchParams({ ...Object.fromEntries(Object.entries(options).map(([key, value]) => [key, String(value)])), version: CACHE_VERSION }).toString()
    const cacheKey = new Request(cacheUrl, { method: 'GET' })
    const cache = caches.default
    const cached = await cache.match(cacheKey)
    if (cached) return request.method === 'HEAD' ? new Response(null, { headers: cached.headers }) : cached
    try {
      const body = await sourceBytes(source, env)
      if (body instanceof Response) return body
      const result = await env.IMAGES.input(body)
        .transform({ width: options.width, fit: 'scale-down' })
        .output({ format: MIME[options.format], ...(options.format === 'png' ? {} : { quality: options.quality }) })
      const response = result.response()
      if (!response.ok || response.headers.get('content-type')?.split(';')[0] !== MIME[options.format]) return failure(502, 'Image conversion unavailable')
      const headers = new Headers({
        'content-type': MIME[options.format],
        'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
        'vary': 'Accept',
        'access-control-allow-origin': '*',
        'x-content-type-options': 'nosniff',
        'x-lp-media-revision': CACHE_VERSION,
        'x-lp-media-format': options.format,
      })
      const final = new Response(response.body, { headers })
      ctx.waitUntil(cache.put(cacheKey, final.clone()).catch(() => {}))
      return request.method === 'HEAD' ? new Response(null, { headers }) : final
    } catch {
      return failure(502, 'Image conversion unavailable')
    }
  },
}

export default mediaRecoveryWorker
