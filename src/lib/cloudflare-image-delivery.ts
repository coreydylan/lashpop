import manifest from "@/generated/cloudflare-public-images.json"

const DELIVERY_HOST = "imagedelivery.net"
const DELIVERY_ORIGIN = `https://${DELIVERY_HOST}`
const DEFAULT_VARIANT = "public"

type Manifest = {
  accountHash: string
  sources: Record<string, string>
}

const publicManifest = manifest as Manifest

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
  return deliveryPath(imageId, DEFAULT_VARIANT)
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
