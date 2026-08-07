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

export function getQuizResultFallbackImages(
  style: LashStyle,
  photosByStyle: Record<LashStyle, QuizPhoto[]>,
  bookingImage?: string | null,
): string[] {
  const sameStylePhoto = photosByStyle[style]?.find((photo) => photo.isEnabled !== false)

  return uniqueImageCandidates('', [
    sameStylePhoto ? getQuizPhotoUrl(sameStylePhoto) : null,
    bookingImage,
  ])
}
