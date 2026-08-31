import cfImageLoader from '@/lib/cf-image-loader'

export const SERVICE_CARD_SIZES = '(max-width: 767px) calc(50vw - 22px), 274px'
export const SERVICE_CARD_WIDTHS = [320, 600] as const

interface ServiceImageSource {
  imageUrl: string | null
}

export interface ServiceImageCandidate {
  src: string
  sizes: string
  widths: readonly number[]
}

export interface ServiceImageLoadPlan {
  priority: ServiceImageCandidate[]
  background: ServiceImageCandidate[]
}

type PreloadMode = 'active' | 'intent'

interface CachedImage {
  image: HTMLImageElement
  promise: Promise<void>
  ready: boolean
}

// Keep detached elements alive for the page lifetime so their responsive
// variants and decoded pixels remain warm when Next/Image mounts the card.
const imageCache = new Map<string, CachedImage>()
let backgroundGeneration = 0

function candidate(src: string): ServiceImageCandidate {
  return {
    src,
    sizes: SERVICE_CARD_SIZES,
    widths: SERVICE_CARD_WIDTHS,
  }
}

export function getServiceImageLoadPlan(
  services: readonly ServiceImageSource[],
  priorityCount: number,
): ServiceImageLoadPlan {
  const seen = new Set<string>()
  const candidates: ServiceImageCandidate[] = []

  for (const service of services) {
    const src = service.imageUrl?.trim()
    if (!src || seen.has(src)) continue
    seen.add(src)
    candidates.push(candidate(src))
  }

  return {
    priority: candidates.slice(0, priorityCount),
    background: candidates.slice(priorityCount),
  }
}

export function getServiceImageSrcSet(image: ServiceImageCandidate): string {
  return image.widths
    .map((width) => `${cfImageLoader({ src: image.src, width, quality: 90 })} ${width}w`)
    .join(', ')
}

function cacheKey(image: ServiceImageCandidate): string {
  return `${image.src}|${image.sizes}`
}

export function isServiceImageReady(src: string | null | undefined): boolean {
  const trimmed = src?.trim()
  return Boolean(trimmed && imageCache.get(cacheKey(candidate(trimmed)))?.ready)
}

function requestImage(
  image: ServiceImageCandidate,
  priority: 'high' | 'low',
): Promise<void> {
  const key = cacheKey(image)
  const cached = imageCache.get(key)
  if (cached) return cached.promise

  const element = new window.Image()
  element.decoding = 'async'
  element.fetchPriority = priority
  element.sizes = image.sizes
  element.srcset = getServiceImageSrcSet(image)

  let entry: CachedImage
  const promise = new Promise<void>((resolve) => {
    element.onload = () => {
      // decode() is best-effort: a successful network load is still useful if
      // a browser declines the detached decode request.
      void element.decode().catch(() => undefined).finally(() => {
        entry.ready = true
        resolve()
      })
    }
    element.onerror = () => {
      imageCache.delete(key)
      resolve()
    }
  })

  entry = { image: element, promise, ready: false }
  imageCache.set(key, entry)
  element.src = cfImageLoader({
    src: image.src,
    width: image.widths[image.widths.length - 1],
    quality: 90,
  })

  return promise
}

function isConstrainedConnection(): boolean {
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string }
  }).connection

  return Boolean(
    connection?.saveData ||
    connection?.effectiveType === 'slow-2g' ||
    connection?.effectiveType === '2g',
  )
}

function scheduleIdle(callback: () => void): number {
  const idle = (window as Window & {
    requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number
  }).requestIdleCallback

  return idle
    ? idle(callback, { timeout: 1200 })
    : window.setTimeout(callback, 120)
}

/**
 * Warm the responsive variants used by service cards.
 *
 * Active lists prioritize the visible rows and then serialize the remaining
 * requests during idle time. Pointer/focus intent only warms the first pair,
 * avoiding a category-wide download when someone merely passes over a tab.
 */
export function preloadServiceCardImages(
  services: readonly ServiceImageSource[],
  mode: PreloadMode = 'active',
): ServiceImageLoadPlan {
  const priorityCount = mode === 'intent'
    ? 2
    : window.matchMedia('(max-width: 767px)').matches
      ? 4
      : 6
  const plan = getServiceImageLoadPlan(services, priorityCount)
  const generation = ++backgroundGeneration
  const requestPriority = mode === 'intent' ? 'low' : 'high'

  const foreground = plan.priority.map((image) => requestImage(image, requestPriority))

  if (mode === 'active' && !isConstrainedConnection()) {
    void Promise.allSettled(foreground).then(() => {
      if (generation !== backgroundGeneration) return

      let index = 0
      const loadNext = () => {
        if (generation !== backgroundGeneration || index >= plan.background.length) return
        const next = plan.background[index++]
        void requestImage(next, 'low').then(() => scheduleIdle(loadNext))
      }

      scheduleIdle(loadNext)
    })
  }

  return mode === 'intent'
    ? { priority: plan.priority, background: [] }
    : plan
}
