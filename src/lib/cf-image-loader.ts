import {
  cloudflareFlexibleVariantUrl,
  isCloudflareImageDeliveryUrl,
  staticCloudflareImageUrl,
} from "@/lib/cloudflare-image-delivery"

type Props = { src: string; width: number; quality?: number }

type PortraitProps = Props & {
  aspectRatio: number
}

const MAX_DELIVERY_WIDTH = 3840
const PORTRAIT_SOURCE_ASPECT_CEILING = 2
const PUBLIC_RASTER = /^\/lashpop-images\/.*\.(?:avif|heic|heif|jpe?g|png|tiff?|webp)(?:$|[?#])/i

function qualityForWidth(width: number, requested?: number): number {
  return requested ?? (width >= 3200 ? 78 : width >= 1800 ? 85 : 90)
}

function directSource(src: string): string | null {
  if (isCloudflareImageDeliveryUrl(src)) return src
  return staticCloudflareImageUrl(src)
}

export default function cfImageLoader({ src, width, quality }: Props): string {
  if (/\.(svg|gif)(\?|$)/i.test(src)) return src

  const direct = directSource(src)
  if (!direct && PUBLIC_RASTER.test(src)) {
    throw new Error(`Public raster is missing from the Cloudflare Images manifest: ${src}`)
  }
  if (!direct) return src

  return cloudflareFlexibleVariantUrl(direct, width, qualityForWidth(width, quality))
}

/**
 * Request enough source pixels for a tall portrait viewport without baking a
 * crop into the derivative. CSS object-position remains the crop authority.
 */
export function cfPortraitImageLoader({
  src,
  width,
  quality,
  aspectRatio,
}: PortraitProps): string {
  const direct = directSource(src)
  if (!direct || !Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return cfImageLoader({ src, width, quality })
  }

  const portraitHeight = width / aspectRatio
  const sourceWidth = Math.min(
    MAX_DELIVERY_WIDTH,
    Math.max(width, Math.ceil(portraitHeight * PORTRAIT_SOURCE_ASPECT_CEILING)),
  )
  return cloudflareFlexibleVariantUrl(direct, sourceWidth, qualityForWidth(sourceWidth, quality))
}
