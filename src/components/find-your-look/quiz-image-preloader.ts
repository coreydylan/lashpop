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

// Retain the detached image elements for the lifetime of the page. Besides
// preventing duplicate requests when the quiz is reopened, this lets the
// browser keep the decoded image data warm between comparison rounds.
const preloadCache = new Map<string, HTMLImageElement>()

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

function requestQuizImage(candidate: QuizImageCandidate, priority: 'high' | 'low') {
  if (typeof window === 'undefined') return

  const cacheKey = `${candidate.src}|${candidate.sizes}`
  if (preloadCache.has(cacheKey)) return

  const image = new window.Image()
  image.decoding = 'async'
  image.fetchPriority = priority
  image.sizes = candidate.sizes
  image.srcset = getQuizImageSrcSet(candidate)
  image.src = cfImageLoader({
    src: candidate.src,
    width: candidate.widths[candidate.widths.length - 1],
    quality: 90,
  })
  image.onerror = () => preloadCache.delete(cacheKey)
  preloadCache.set(cacheKey, image)
}

export function preloadQuizImages(
  photosByStyle: Record<LashStyle, QuizPhoto[]>,
  resultImageUrls: string[] = [],
): QuizImageLoadPlan {
  const plan = getQuizImageLoadPlan(photosByStyle, resultImageUrls)

  if (typeof window === 'undefined') return plan

  plan.priority.forEach((candidate) => requestQuizImage(candidate, 'high'))

  // Let the two high-priority requests enter the browser queue first, then
  // enqueue the rest in the very next microtask without waiting for them.
  window.queueMicrotask(() => {
    plan.background.forEach((candidate) => requestQuizImage(candidate, 'low'))
  })

  return plan
}
