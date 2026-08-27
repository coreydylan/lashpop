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

  // The admin-selected image (including its generated crop URL) is the public
  // result contract. Current same-style assets only protect against a missing
  // or failed configuration; the static result image is the final legacy fallback.
  return uniqueImageCandidates(configuredImage || '', [
    selectedPhoto ? getQuizPhotoUrl(selectedPhoto) : null,
    sameStylePhoto ? getQuizPhotoUrl(sameStylePhoto) : null,
    bookingImage,
    legacyFallbackImage,
  ])
}
