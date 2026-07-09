const CDN_BASE = "https://cdn.lashpopstudios.com"
// On-the-fly resizer on the experialstudio account (workers/lashpop-img):
// reads from the lashpop-dam R2 bucket (bare keys), the site's /public
// assets (/site/<path>), and allow-listed external hosts (/ext?url=), and
// returns a width-scaled image whose format is negotiated per-request from
// the Accept header (AVIF > WebP > JPEG), transcoding HEIC originals to a
// web format. Lives on workers.dev because the lashpopstudios.com zone
// hasn't moved accounts yet — swap to cdn.lashpopstudios.com once the NS
// flip lands.
const IMG_WORKER_BASE = "https://lashpop-img.experial.workers.dev"

type Props = { src: string; width: number; quality?: number }

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
    return `${IMG_WORKER_BASE}/${r2Match[1]}?w=${width}&q=${q}`
  }

  // Site /public images — the worker proxies them from the deployed origin,
  // so in local dev (where the origin may be ahead of prod) serve directly.
  if (src.startsWith("/lashpop-images/")) {
    if (process.env.NODE_ENV === "development") return src
    return `${IMG_WORKER_BASE}/site${src}?w=${width}&q=${q}`
  }

  // Vagaro staff photos are multi-MB "/Original/" JPEGs on Rackspace CDN.
  if (/^https:\/\/[^/]+\.rackcdn\.com\//i.test(src)) {
    return `${IMG_WORKER_BASE}/ext?url=${encodeURIComponent(src)}&w=${width}&q=${q}`
  }

  return src
}
