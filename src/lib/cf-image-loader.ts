const CDN_BASE = "https://cdn.lashpopstudios.com"

type Props = { src: string; width: number; quality?: number }

export default function cfImageLoader({ src, width, quality }: Props): string {
  const q = quality ?? 80
  const opts = `width=${width},quality=${q},format=auto,fit=scale-down`

  if (src.startsWith(CDN_BASE)) {
    const path = src.slice(CDN_BASE.length).replace(/^\//, "")
    return `${CDN_BASE}/cdn-cgi/image/${opts}/${path}`
  }

  const r2Match = src.match(/^https?:\/\/pub-[a-f0-9]+\.r2\.dev\/(.+)$/)
  if (r2Match) {
    return `${CDN_BASE}/cdn-cgi/image/${opts}/${r2Match[1]}`
  }

  return src
}
