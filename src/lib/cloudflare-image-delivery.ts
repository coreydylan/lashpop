import manifest from "@/generated/cloudflare-public-images.json"

const DELIVERY_HOST = "imagedelivery.net"
const DELIVERY_ORIGIN = `https://${DELIVERY_HOST}`
const DEFAULT_VARIANT = "public"

type Manifest = {
  accountHash: string
  sources: Record<string, string>
}

const publicManifest = manifest as Manifest

// Explicit incident switch, compiled into the exact reviewed deployment.
// An empty value preserves the existing production delivery contract.
function recoveryOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_IMAGE_RECOVERY_ORIGIN
  if (!configured) return null
  const url = new URL(configured)
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('Image recovery origin must be a plain HTTPS origin')
  }
  return url.origin
}

function imageIdFromDelivery(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.hostname !== DELIVERY_HOST) return null
    const segments = url.pathname.split('/').filter(Boolean)
    return segments.length >= 3 && segments[0] === publicManifest.accountHash
      ? segments.slice(1, -1).join('/') : null
  } catch {
    return null
  }
}

function recoveryUrl(imageId: string, width = 1800, quality = 90): string | null {
  const origin = recoveryOrigin()
  if (!origin) return null
  const sitePath = Object.entries(publicManifest.sources).find(([, id]) => id === imageId)?.[0]
  if (sitePath) return sitePath
  return `${origin}/image/${imageId}?w=${Math.max(1, Math.min(3840, Math.round(width)))}&q=${Math.max(1, Math.min(100, Math.round(quality)))}`
}

export function publicCloudflareDeliveryUrl(value: string): string {
  const imageId = imageIdFromDelivery(value)
  return imageId ? (recoveryUrl(imageId) ?? value) : value
}

export function getCloudflareImageDeliveryOrigin(): string {
  return DELIVERY_ORIGIN
}

function cleanSource(value: string): string {
  return value.trim()
}

function deliveryPath(imageId: string, variant: string): string {
  return `${DELIVERY_ORIGIN}/${publicManifest.accountHash}/${imageId}/${variant}`
}

export function cloudflareImageDeliveryUrl(imageId: string): string {
  return recoveryUrl(imageId) ?? deliveryPath(imageId, DEFAULT_VARIANT)
}

export function isCloudflareImageDeliveryUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "https:" && url.hostname === DELIVERY_HOST
  } catch {
    return false
  }
}

export function staticCloudflareImageUrl(value: string): string | null {
  const source = cleanSource(value).split(/[?#]/, 1)[0]
  const imageId = publicManifest.sources[source]
  return imageId ? cloudflareImageDeliveryUrl(imageId) : null
}

export function requiredStaticCloudflareImageUrl(value: string): string {
  const directUrl = staticCloudflareImageUrl(value)
  if (!directUrl) throw new Error(`Public raster is missing from the Cloudflare Images manifest: ${value}`)
  return directUrl
}

export function cloudflareFlexibleVariantUrl(
  deliveryUrl: string,
  width: number,
  quality: number,
): string {
  const recovery = recoveryOrigin()
  if (recovery) {
    if (publicManifest.sources[deliveryUrl]) return deliveryUrl
    const recoveryPath = `${recovery}/image/`
    if (deliveryUrl.startsWith(recoveryPath)) {
      return recoveryUrl(new URL(deliveryUrl).pathname.slice('/image/'.length), width, quality)!
    }
    const imageId = imageIdFromDelivery(deliveryUrl)
    if (imageId) return recoveryUrl(imageId, width, quality)!
  }
  const url = new URL(deliveryUrl)
  if (url.protocol !== "https:" || url.hostname !== DELIVERY_HOST) return deliveryUrl

  const segments = url.pathname.split("/").filter(Boolean)
  if (segments.length < 3 || segments[0] !== publicManifest.accountHash) return deliveryUrl

  const imageId = segments.slice(1, -1).join("/")
  if (!imageId) return deliveryUrl

  return deliveryPath(
    imageId,
    `w=${Math.max(1, Math.round(width))},q=${Math.max(1, Math.min(100, Math.round(quality)))},fit=scale-down,metadata=none`,
  )
}

export const cloudflareImageDeliveryInternals = {
  accountHash: publicManifest.accountHash,
  deliveryHost: DELIVERY_HOST,
}
