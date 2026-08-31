import cfImageLoader from '@/lib/cf-image-loader'
import type { QuizResultForDisplay } from '@/actions/quiz-photos'
import {
  isConstrainedImageConnection,
  isBackgroundImagePreloadingDisabled,
  isResponsiveImageReady,
  preloadResponsiveImage,
  preloadResponsiveImages,
} from '@/lib/responsive-image-preloader'
import type { LashStyle, QuizPhoto } from './types'
import { classifyQuizCropVariant } from '@/lib/quiz-crop-variant'

const COMPARISON_SIZES = '(max-width: 768px) 45vw, 200px'
const RESULT_SIZES = '(max-width: 768px) 100vw, 400px'
const COMPARISON_WIDTHS = [384, 600, 900, 1200] as const
const RESULT_WIDTHS = [600, 900, 1200] as const
const COMPARISON_FALLBACK_WIDTHS = [256] as const
const RESULT_FALLBACK_WIDTHS = [384] as const
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

export function isLegacySquareQuizCrop(url: string | null | undefined): boolean {
  return Boolean(url && /-square-(?:\d|canonical)/.test(url))
}

function cropVariant(photo: QuizPhoto) {
  return photo.cropVariant ?? classifyQuizCropVariant(photo.cropUrl)
}

export interface QuizExperienceData {
  photos: Record<LashStyle, QuizPhoto[]>
  settings: Record<LashStyle, QuizResultForDisplay>
}

let quizExperiencePromise: Promise<QuizExperienceData> | null = null

export function getQuizPhotoUrl(photo: QuizPhoto): string {
  if (photo.cropUrl && cropVariant(photo) !== 'legacy-square') return photo.cropUrl
  return photo.filePath
}

export function getQuizPhotoObjectPosition(photo: QuizPhoto): string | undefined {
  if (cropVariant(photo) !== 'legacy-square' || !photo.cropData) return undefined
  return `${photo.cropData.x}% ${photo.cropData.y}%`
}

export function getQuizPhotoObjectFit(photo: QuizPhoto): 'cover' | 'contain' {
  return cropVariant(photo) === 'legacy-square' ? 'contain' : 'cover'
}

function firstEnabledPhoto(photos: QuizPhoto[] | undefined): QuizPhoto | null {
  return photos?.find((photo) => photo.isEnabled !== false) ?? null
}

export function comparisonCandidate(photo: QuizPhoto): QuizImageCandidate {
  return {
    src: getQuizPhotoUrl(photo),
    sizes: COMPARISON_SIZES,
    widths: COMPARISON_WIDTHS,
  }
}

export function resultCandidate(src: string): QuizImageCandidate {
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

export function isQuizImageReady(src: string, sizes: string): boolean {
  const candidate = sizes === COMPARISON_SIZES
    ? { src, sizes, widths: COMPARISON_WIDTHS, quality: 90 }
    : { src, sizes, widths: RESULT_WIDTHS, quality: 90 }
  return isResponsiveImageReady(candidate)
}

export function preloadQuizImages(
  photosByStyle: Record<LashStyle, QuizPhoto[]>,
  resultImageUrls: string[] = [],
): QuizImageLoadPlan {
  const plan = getQuizImageLoadPlan(photosByStyle, resultImageUrls)

  if (typeof window === 'undefined') return plan

  plan.priority.forEach((candidate) => {
    void preloadResponsiveImage({ ...candidate, quality: 90 }, 'high')
  })

  // The quiz is a short, bounded experience. Decode every remaining comparison
  // and result image in parallel once the opening pair is in flight so moving
  // between rounds never discovers a new asset. Save-Data/2G remains respected.
  if (!isConstrainedImageConnection() && !isBackgroundImagePreloadingDisabled()) {
    const allCandidates = [...plan.priority, ...plan.background]
    // Next/Image's client-mounted fill image exposes a conservative `src`
    // before responsive `srcset` selection settles. Warm that exact fallback
    // URL too, otherwise the preload scanner can start one late request even
    // though the browser already has the final responsive candidate decoded.
    void preloadResponsiveImages(
      [
        ...plan.background.map((candidate) => ({ ...candidate, quality: 90 })),
        ...getQuizFallbackCandidates(allCandidates),
      ],
      { priority: 'low', concurrency: 6 },
    )
  }

  return plan
}

function getQuizFallbackCandidates(
  candidates: readonly QuizImageCandidate[],
) {
  return candidates.map((candidate) => ({
    src: candidate.src,
    sizes: candidate.sizes === COMPARISON_SIZES ? '256px' : '384px',
    widths: candidate.sizes === COMPARISON_SIZES
      ? COMPARISON_FALLBACK_WIDTHS
      : RESULT_FALLBACK_WIDTHS,
    quality: 90,
  }))
}

export function getQuizExperienceData(): Promise<QuizExperienceData> {
  if (!quizExperiencePromise) {
    quizExperiencePromise = import('@/actions/quiz-photos').then(({
      getQuizPhotosForQuiz,
      getResultSettingsForQuiz,
    }) => Promise.all([
      getQuizPhotosForQuiz(),
      getResultSettingsForQuiz(),
    ])).then(([photos, settings]) => ({
      photos: photos as Record<LashStyle, QuizPhoto[]>,
      settings,
    })).catch((error) => {
      quizExperiencePromise = null
      throw error
    })
  }

  return quizExperiencePromise
}

export async function preloadQuizExperience(): Promise<QuizExperienceData> {
  const data = await getQuizExperienceData()
  const resultImages = Object.values(data.settings)
    .map((setting) => setting.resultImage)
    .filter((src): src is string => Boolean(src))
  preloadQuizImages(data.photos, resultImages)
  return data
}

export async function preloadQuizExperienceFully(): Promise<QuizExperienceData> {
  const data = await preloadQuizExperience()
  const resultImages = Object.values(data.settings)
    .map((setting) => setting.resultImage)
    .filter((src): src is string => Boolean(src))
  const plan = getQuizImageLoadPlan(data.photos, resultImages)

  await Promise.all([
    preloadResponsiveImages(
      plan.priority.map((candidate) => ({ ...candidate, quality: 90 })),
      { priority: 'high', concurrency: 2 },
    ),
    isConstrainedImageConnection()
      ? Promise.resolve()
      : preloadResponsiveImages(
          [
            ...plan.background.map((candidate) => ({ ...candidate, quality: 90 })),
            ...getQuizFallbackCandidates([...plan.priority, ...plan.background]),
          ],
          { priority: 'low', concurrency: 6 },
        ),
  ])

  return data
}
