const CDN_BASE = "https://cdn.lashpopstudios.com"
// On-the-fly resizer on the experialstudio account (workers/lashpop-img):
// reads from the lashpop-dam R2 bucket (bare keys), the site's /public
// assets (/site/<path>), and allow-listed external hosts (/ext?url=), and
// returns a width-scaled image whose format is negotiated per-request from
// the Accept header (AVIF > WebP > JPEG), transcoding HEIC originals to a
// web format. Lives on workers.dev because the lashpopstudios.com zone
// hasn't moved accounts yet — swap to cdn.lashpopstudios.com once the NS
// flip lands.
const DEFAULT_IMG_WORKER_BASE = "https://lashpop-img.experial.workers.dev"

export function getImageWorkerBase(): string {
  return (process.env.NEXT_PUBLIC_IMAGE_WORKER_BASE || DEFAULT_IMG_WORKER_BASE).replace(/\/$/, "")
}

type Props = { src: string; width: number; quality?: number }

type PortraitProps = Props & {
  aspectRatio: number
}

const MAX_WORKER_WIDTH = 3840
const PORTRAIT_SOURCE_ASPECT_CEILING = 2

function workerUrl(path: string, params: Record<string, string | number>): string {
  const url = new URL(path, `${getImageWorkerBase()}/`)
  Object.entries(params).forEach(([name, value]) => url.searchParams.set(name, String(value)))
  return url.toString()
}

export default function cfImageLoader({ src, width, quality }: Props): string {
  // Quality scales inversely with width. Small variants render near 1:1 on
  // screen where compression artifacts on faces are obvious — keep them at 90.
  // Huge variants only exist for 2x-retina displays, where the downscale to
  // device pixels masks artifacts — spend the byte budget on resolution
  // (full 3840 width) instead of quality there.
  const q = quality ?? (width >= 3200 ? 78 : width >= 1800 ? 85 : 90)

  // Vector/animated formats gain nothing from the resizer.
  if (/\.(svg|gif)(\?|$)/i.test(src)) return src

  if (src.startsWith(CDN_BASE)) {
    const opts = `width=${width},quality=${q},format=auto,fit=scale-down`
    const path = src.slice(CDN_BASE.length).replace(/^\//, "")
    return `${CDN_BASE}/cdn-cgi/image/${opts}/${path}`
  }

  const r2Match = src.match(/^https?:\/\/pub-[a-f0-9]+\.r2\.dev\/(.+)$/)
  if (r2Match) {
    return workerUrl(r2Match[1], { w: width, q })
  }

  // Site /public images — the worker proxies them from the deployed origin,
  // so in local dev (where the origin may be ahead of prod) serve directly.
  if (src.startsWith("/lashpop-images/")) {
    if (process.env.NODE_ENV === "development") return src
    return workerUrl(`site${src}`, { w: width, q })
  }

  // Vagaro staff photos are multi-MB "/Original/" JPEGs on Rackspace CDN.
  if (/^https:\/\/[^/]+\.rackcdn\.com\//i.test(src)) {
    return workerUrl('ext', { url: src, w: width, q })
  }

  return src
}

/**
 * Request enough source pixels for a tall portrait viewport without baking a
 * crop into the derivative. The mobile hero is 85dvh, so its actual aspect
 * ratio changes as browser chrome expands and collapses. A fixed server crop
 * shifts the accepted composition between those states. Oversampling the full
 * frame lets CSS object-position remain the single source of crop truth while
 * still preventing the browser from enlarging a short landscape derivative.
 */
export function cfPortraitImageLoader({
  src,
  width,
  quality,
  aspectRatio,
}: PortraitProps): string {
  const optimized = cfImageLoader({ src, width, quality })
  if (
    !optimized.startsWith(`${getImageWorkerBase()}/`) ||
    !Number.isFinite(aspectRatio) ||
    aspectRatio <= 0
  ) {
    return optimized
  }

  const url = new URL(optimized)
  const portraitHeight = width / aspectRatio
  const sourceWidth = Math.min(
    MAX_WORKER_WIDTH,
    Math.max(width, Math.ceil(portraitHeight * PORTRAIT_SOURCE_ASPECT_CEILING)),
  )
  url.searchParams.set('w', String(sourceWidth))
  return url.toString()
}
