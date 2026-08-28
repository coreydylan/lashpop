export interface QuizCropData {
  x: number
  y: number
  scale: number
}

export interface QuizCropPercentBox {
  widthPercent: number
  heightPercent: number
}

const BASE_WIDTH_PERCENT = 70
const MIN_CROP_PERCENT = 15
const MAX_CROP_PERCENT = 95

export const QUIZ_COMPARISON_CROP_ASPECT = 3 / 4
export const QUIZ_RESULT_CROP_ASPECT = 1

export function clampQuizCropValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Convert the admin center/zoom model into an extraction box expressed in
 * percentages of the source image. cropAspect is width / height.
 *
 * When the requested box would exceed either source edge, both dimensions
 * shrink together. This is the important responsive-safe behavior: a square
 * source can produce the widest possible 3:4 portrait master without a second
 * frontend crop silently cutting more from the sides.
 */
export function getQuizCropPercentBox(
  crop: QuizCropData,
  imageAspect: number,
  cropAspect: number,
): QuizCropPercentBox {
  const safeImageAspect = imageAspect > 0 ? imageAspect : 1
  const safeCropAspect = cropAspect > 0 ? cropAspect : 1
  const safeScale = crop.scale > 0 ? crop.scale : 1

  let widthPercent = clampQuizCropValue(
    BASE_WIDTH_PERCENT / safeScale,
    MIN_CROP_PERCENT,
    MAX_CROP_PERCENT,
  )
  let heightPercent = widthPercent * safeImageAspect / safeCropAspect

  if (heightPercent > MAX_CROP_PERCENT) {
    heightPercent = MAX_CROP_PERCENT
    widthPercent = heightPercent * safeCropAspect / safeImageAspect
  }

  return { widthPercent, heightPercent }
}

export function clampQuizCropToBounds(
  crop: QuizCropData,
  imageAspect: number,
  cropAspect: number,
  scaleLimits = { min: 0.5, max: 2.5 },
): QuizCropData {
  const normalizedScale = clampQuizCropValue(crop.scale, scaleLimits.min, scaleLimits.max)
  const { widthPercent, heightPercent } = getQuizCropPercentBox(
    { ...crop, scale: normalizedScale },
    imageAspect,
    cropAspect,
  )

  const halfWidth = widthPercent / 2
  const halfHeight = heightPercent / 2

  return {
    x: clampQuizCropValue(crop.x, halfWidth, 100 - halfWidth),
    y: clampQuizCropValue(crop.y, halfHeight, 100 - halfHeight),
    scale: normalizedScale,
  }
}
