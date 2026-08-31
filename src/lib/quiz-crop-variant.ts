export type QuizCropVariant = 'legacy-square' | 'portrait-safe' | 'none'

export function classifyQuizCropVariant(
  cropUrl: string | null | undefined,
): QuizCropVariant {
  if (!cropUrl) return 'none'
  if (/-square-(?:\d|canonical)/i.test(cropUrl)) return 'legacy-square'
  if (/-portrait-safe-/i.test(cropUrl)) return 'portrait-safe'
  return 'none'
}
