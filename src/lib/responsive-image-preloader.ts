import cfImageLoader from '@/lib/cf-image-loader'

export interface ResponsiveImageCandidate {
  src: string
  sizes: string
  widths: readonly number[]
  quality?: number
}

interface CachedResponsiveImage {
  image: HTMLImageElement
  promise: Promise<void>
  ready: boolean
}

const imageCache = new Map<string, CachedResponsiveImage>()
let backgroundPreloadDisabled = false

export function setBackgroundImagePreloadingDisabled(disabled: boolean): void {
  backgroundPreloadDisabled = disabled
}

export function isBackgroundImagePreloadingDisabled(): boolean {
  return backgroundPreloadDisabled
}

function cacheKey(candidate: ResponsiveImageCandidate): string {
  return [
    candidate.src,
    candidate.sizes,
    candidate.widths.join(','),
    candidate.quality ?? 90,
  ].join('|')
}

export function getResponsiveImageSrcSet(candidate: ResponsiveImageCandidate): string {
  const quality = candidate.quality ?? 90
  return candidate.widths
    .map((width) => `${cfImageLoader({ src: candidate.src, width, quality })} ${width}w`)
    .join(', ')
}

export function isResponsiveImageReady(candidate: ResponsiveImageCandidate): boolean {
  return imageCache.get(cacheKey(candidate))?.ready === true
}

export function isConstrainedImageConnection(): boolean {
  if (typeof navigator === 'undefined') return false

  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string }
  }).connection

  return Boolean(
    connection?.saveData ||
    connection?.effectiveType === 'slow-2g' ||
    connection?.effectiveType === '2g',
  )
}

export function preloadResponsiveImage(
  candidate: ResponsiveImageCandidate,
  priority: 'high' | 'low' = 'low',
): Promise<void> {
  if (typeof window === 'undefined' || !candidate.src) return Promise.resolve()

  const key = cacheKey(candidate)
  const cached = imageCache.get(key)
  if (cached) {
    if (priority === 'high') cached.image.fetchPriority = 'high'
    return cached.promise
  }

  const image = new window.Image()
  image.decoding = 'async'
  image.fetchPriority = priority
  image.referrerPolicy = 'no-referrer'
  image.sizes = candidate.sizes

  const entry: CachedResponsiveImage = {
    image,
    ready: false,
    promise: Promise.resolve(),
  }

  entry.promise = new Promise<void>((resolve) => {
    image.onload = () => {
      void image.decode().catch(() => undefined).finally(() => {
        entry.ready = true
        resolve()
      })
    }
    image.onerror = () => {
      imageCache.delete(key)
      resolve()
    }
  })

  imageCache.set(key, entry)
  image.srcset = getResponsiveImageSrcSet(candidate)
  image.src = cfImageLoader({
    src: candidate.src,
    width: candidate.widths[candidate.widths.length - 1],
    quality: candidate.quality ?? 90,
  })

  return entry.promise
}

export async function preloadResponsiveImages(
  candidates: readonly ResponsiveImageCandidate[],
  options: { priority?: 'high' | 'low'; concurrency?: number } = {},
): Promise<void> {
  const priority = options.priority ?? 'low'
  const concurrency = Math.max(1, options.concurrency ?? 6)
  const unique = Array.from(
    new Map(candidates.map((candidate) => [cacheKey(candidate), candidate])).values(),
  )
  let index = 0

  const worker = async () => {
    while (index < unique.length) {
      const candidate = unique[index++]
      await preloadResponsiveImage(candidate, priority)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, unique.length) }, () => worker()),
  )
}
