import cfImageLoader from '@/lib/cf-image-loader'
import type { LashStyle, QuizPhoto } from './types'

const COMPARISON_SIZES = '(max-width: 768px) 45vw, 200px'
const RESULT_SIZES = '(max-width: 768px) 100vw, 400px'
const COMPARISON_WIDTHS = [384, 600] as const
const RESULT_WIDTHS = [600, 900] as const
const FIRST_PAIR_STYLES: LashStyle[] = ['classic', 'volume']
const ALL_STYLES: LashStyle[] = ['classic', 'wetAngel', 'hybrid', 'volume']

export interface QuizImageCandidate {
  src: string
  sizes: string
  widths: readonly number[]
}

export interface QuizImageLoadPlan {
  priority: QuizImageCandidate[]
  background: QuizImageCandidate[]
}

interface CachedQuizImage {
  image: HTMLImageElement
  promise: Promise<void>
}

// Retain the detached image elements for the lifetime of the page. Besides
// preventing duplicate requests when the quiz is reopened, this lets the
// browser keep the decoded image data warm between comparison rounds.
const preloadCache = new Map<string, CachedQuizImage>()
let backgroundGeneration = 0

export function getQuizPhotoUrl(photo: QuizPhoto): string {
  return photo.cropUrl || photo.filePath
}

function firstEnabledPhoto(photos: QuizPhoto[] | undefined): QuizPhoto | null {
  return photos?.find((photo) => photo.isEnabled !== false) ?? null
}

function comparisonCandidate(photo: QuizPhoto): QuizImageCandidate {
  return {
    src: getQuizPhotoUrl(photo),
    sizes: COMPARISON_SIZES,
    widths: COMPARISON_WIDTHS,
  }
}

function resultCandidate(src: string): QuizImageCandidate {
  return {
    src,
    sizes: RESULT_SIZES,
    widths: RESULT_WIDTHS,
  }
}

export function getQuizImageLoadPlan(
  photosByStyle: Record<LashStyle, QuizPhoto[]>,
  resultImageUrls: string[] = [],
): QuizImageLoadPlan {
  const seen = new Set<string>()
  const priority: QuizImageCandidate[] = []
  const background: QuizImageCandidate[] = []

  const add = (bucket: QuizImageCandidate[], candidate: QuizImageCandidate | null) => {
    if (!candidate?.src || seen.has(candidate.src)) return
    seen.add(candidate.src)
    bucket.push(candidate)
  }

  // The quiz always opens with Classic vs Volume. These exact sorted photos
  // are also preferred by useQuizAlgorithm, so the high-priority requests are
  // guaranteed to be the first pair the guest sees.
  FIRST_PAIR_STYLES.forEach((style) => {
    const photo = firstEnabledPhoto(photosByStyle[style])
    add(priority, photo ? comparisonCandidate(photo) : null)
  })

  // Start every other comparison image immediately afterward at low browser
  // priority. Optimized 384/600px candidates are intentionally much cheaper
  // than fetching the multi-megabyte R2 originals.
  ALL_STYLES.forEach((style) => {
    photosByStyle[style]
      .filter((photo) => photo.isEnabled !== false)
      .forEach((photo) => add(background, comparisonCandidate(photo)))
  })

  resultImageUrls.forEach((src) => add(background, resultCandidate(src)))

  return { priority, background }
}

export function getQuizImageSrcSet(candidate: QuizImageCandidate): string {
  return candidate.widths
    .map((width) => `${cfImageLoader({ src: candidate.src, width, quality: 90 })} ${width}w`)
    .join(', ')
}

function requestQuizImage(
  candidate: QuizImageCandidate,
  priority: 'high' | 'low',
): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  const cacheKey = `${candidate.src}|${candidate.sizes}`
  const cached = preloadCache.get(cacheKey)
  if (cached) return cached.promise

  const image = new window.Image()
  image.decoding = 'async'
  image.fetchPriority = priority
  image.sizes = candidate.sizes

  const promise = new Promise<void>((resolve) => {
    image.onload = () => {
      void image.decode().catch(() => undefined).finally(resolve)
    }
    image.onerror = () => {
      preloadCache.delete(cacheKey)
      resolve()
    }
  })

  preloadCache.set(cacheKey, { image, promise })
  image.srcset = getQuizImageSrcSet(candidate)
  image.src = cfImageLoader({
    src: candidate.src,
    width: candidate.widths[candidate.widths.length - 1],
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
    ? idle(callback, { timeout: 1500 })
    : window.setTimeout(callback, 150)
}

export function preloadQuizImages(
  photosByStyle: Record<LashStyle, QuizPhoto[]>,
  resultImageUrls: string[] = [],
): QuizImageLoadPlan {
  const plan = getQuizImageLoadPlan(photosByStyle, resultImageUrls)

  if (typeof window === 'undefined') return plan

  const generation = ++backgroundGeneration
  const foreground = plan.priority.map((candidate) => requestQuizImage(candidate, 'high'))

  // The first comparison pair is the only immediate work. Once it has loaded,
  // warm the remaining candidates one at a time during idle periods. Respect
  // Save-Data and constrained connections instead of turning one quiz open
  // into a background download of the entire photo library.
  if (!isConstrainedConnection()) {
    void Promise.allSettled(foreground).then(() => {
      if (generation !== backgroundGeneration) return

      let index = 0
      const loadNext = () => {
        if (generation !== backgroundGeneration || index >= plan.background.length) return
        const candidate = plan.background[index++]
        void requestQuizImage(candidate, 'low').then(() => scheduleIdle(loadNext))
      }

      scheduleIdle(loadNext)
    })
  }

  return plan
}
