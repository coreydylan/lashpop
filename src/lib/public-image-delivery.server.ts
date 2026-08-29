import "server-only"

import { createHash } from "node:crypto"

import {
  cloudflareImageDeliveryUrl,
  isCloudflareImageDeliveryUrl,
  staticCloudflareImageUrl,
} from "@/lib/cloudflare-image-delivery"

const RASTER_SOURCE = /\.(?:avif|heic|heif|jpe?g|png|tiff?|webp)(?:$|[?#])/i

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

function canonicalSource(value: string): string | null {
  const source = value.trim()
  if (!source || source.includes("placeholder") || !RASTER_SOURCE.test(source)) return null

  if (source.startsWith("/lashpop-images/")) {
    return `site:${source.replace(/^\//, "").split(/[?#]/, 1)[0]}`
  }

  let url: URL
  try {
    url = new URL(source)
  } catch {
    return null
  }

  if (/^pub-[a-f0-9]+\.r2\.dev$/i.test(url.hostname)) {
    return `r2:${decodeURIComponent(url.pathname.replace(/^\/+/, ""))}`
  }
  if (/\.rackcdn\.com$/i.test(url.hostname)) {
    return `ext:${url.toString()}`
  }
  return null
}

export function resolvePublicImageUrl(value: string): string {
  if (isCloudflareImageDeliveryUrl(value)) return value
  const staticUrl = staticCloudflareImageUrl(value)
  if (staticUrl) return staticUrl
  const canonical = canonicalSource(value)
  return canonical ? cloudflareImageDeliveryUrl(`lp/${sha256(canonical)}`) : value
}

export function resolvePublicImages<T>(value: T): T {
  if (typeof value === "string") return resolvePublicImageUrl(value) as T
  if (Array.isArray(value)) return value.map(resolvePublicImages) as T
  if (!value || typeof value !== "object" || value instanceof Date) return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, resolvePublicImages(child)]),
  ) as T
}

export const publicImageDeliveryInternals = { canonicalSource }
