import type { LashStyle, QuizPhoto } from './types'
import { getQuizPhotoUrl } from './quiz-image-preloader'

export function uniqueImageCandidates(
  primarySrc: string,
  fallbackSrcs: Array<string | null | undefined> = [],
): string[] {
  return Array.from(
    new Set([primarySrc, ...fallbackSrcs].filter((src): src is string => Boolean(src))),
  )
}

interface QuizResultImageCandidatesInput {
  style: LashStyle
  configuredImage?: string | null
  selectedPhoto: QuizPhoto | null
  photosByStyle: Record<LashStyle, QuizPhoto[]>
  bookingImage?: string | null
  legacyFallbackImage?: string | null
}

export function getQuizResultImageCandidates({
  style,
  configuredImage,
  selectedPhoto,
  photosByStyle,
  bookingImage,
  legacyFallbackImage,
}: QuizResultImageCandidatesInput): string[] {
  const sameStylePhoto = photosByStyle[style]?.find((photo) => photo.isEnabled !== false)

  // When a guest explicitly chose a photo for the winning style, that exact
  // current photo is the clearest result contract. The admin result image is
  // retained as the first fallback for all-skipped paths and load failures.
  return uniqueImageCandidates(selectedPhoto ? getQuizPhotoUrl(selectedPhoto) : '', [
    configuredImage,
    sameStylePhoto ? getQuizPhotoUrl(sameStylePhoto) : null,
    bookingImage,
    legacyFallbackImage,
  ])
}
