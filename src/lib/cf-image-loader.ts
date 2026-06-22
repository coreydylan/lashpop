const CDN_BASE = "https://cdn.lashpopstudios.com"
// On-the-fly resizer on the experialstudio account (workers/lashpop-img):
// reads from the lashpop-dam R2 bucket and returns a width-scaled image whose
// format is negotiated per-request from the Accept header (AVIF > WebP > JPEG),
// transcoding HEIC originals to a web format. Lives on workers.dev because the
// lashpopstudios.com zone hasn't moved accounts yet — swap to
// cdn.lashpopstudios.com once the NS flip lands.
const IMG_WORKER_BASE = "https://lashpop-img.experial.workers.dev"

type Props = { src: string; width: number; quality?: number }

export default function cfImageLoader({ src, width, quality }: Props): string {
  const q = quality ?? 82

  if (src.startsWith(CDN_BASE)) {
    const opts = `width=${width},quality=${q},format=auto,fit=scale-down`
    const path = src.slice(CDN_BASE.length).replace(/^\//, "")
    return `${CDN_BASE}/cdn-cgi/image/${opts}/${path}`
  }

  const r2Match = src.match(/^https?:\/\/pub-[a-f0-9]+\.r2\.dev\/(.+)$/)
  if (r2Match) {
    return `${IMG_WORKER_BASE}/${r2Match[1]}?w=${width}&q=${q}`
  }

  return src
}
