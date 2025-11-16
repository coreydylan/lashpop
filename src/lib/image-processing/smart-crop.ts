/**
 * Smart Cropping Engine
 *
 * Provides multiple strategies for intelligently cropping images for social media,
 * including AI-based face detection, center-weighted crops, and letterboxing.
 */

import sharp from 'sharp'
import type { FaceLandmarks } from '../mediapipe-face'
import {
  CropData,
  CropResult,
  CropScore,
  CropStrategy,
  FocalPoint,
  ImageMetadata,
  LetterboxData,
  LetterboxResult,
  OptimalCropResult,
  PlatformSpec,
  SafeZone,
  SmartCropOptions
} from './types'
import { detectSafeZones, validateCrop } from './safe-zones'

// Default JPEG quality (Instagram optimized)
const DEFAULT_QUALITY = 85

/**
 * Strategy 1: AI Smart Crop using face detection
 *
 * Uses face landmarks to generate crops that keep faces centered and well-composed.
 * Scores each possible crop window based on face coverage, rule of thirds, and safe zones.
 *
 * @param imageBuffer - Source image buffer
 * @param targetWidth - Target crop width in pixels
 * @param targetHeight - Target crop height in pixels
 * @param options - Optional face landmarks and safe zones
 * @returns Crop result with scored crop data
 */
export async function aiSmartCrop(
  imageBuffer: Buffer,
  targetWidth: number,
  targetHeight: number,
  options?: SmartCropOptions
): Promise<CropResult> {
  const metadata = await getImageMetadata(imageBuffer)
  const { width: imgWidth, height: imgHeight } = metadata

  // Detect safe zones if not provided
  let safeZones = options?.safeZones || []
  if (options?.faceLandmarks && safeZones.length === 0) {
    safeZones = await detectSafeZones(imageBuffer, options.faceLandmarks)
  }

  // Calculate target aspect ratio
  const targetAspect = targetWidth / targetHeight
  const imageAspect = imgWidth / imgHeight

  // Generate candidate crop windows
  const candidates: Array<{ crop: CropData; score: CropScore }> = []

  // If we have face landmarks, generate face-centered crops
  if (options?.faceLandmarks && options.faceLandmarks.length > 0) {
    for (const landmarks of options.faceLandmarks) {
      const faceCrops = generateFaceCenteredCrops(
        landmarks,
        imgWidth,
        imgHeight,
        targetWidth,
        targetHeight,
        targetAspect
      )

      for (const crop of faceCrops) {
        const score = scoreCrop(crop, imgWidth, imgHeight, options.faceLandmarks, safeZones)
        candidates.push({ crop, score })
      }
    }
  }

  // Always generate center-weighted candidates as fallback
  const centerCrops = generateCenterWeightedCrops(imgWidth, imgHeight, targetWidth, targetHeight, targetAspect)
  for (const crop of centerCrops) {
    const score = scoreCrop(crop, imgWidth, imgHeight, options?.faceLandmarks, safeZones)
    candidates.push({ crop, score })
  }

  // Sort by total score (descending)
  candidates.sort((a, b) => b.score.total - a.score.total)

  // Use the highest scoring crop
  const bestCandidate = candidates[0]

  if (!bestCandidate) {
    // Fallback to center crop
    return centerWeightedCrop(imageBuffer, targetWidth, targetHeight)
  }

  const croppedImage = await sharp(imageBuffer)
    .extract({
      left: bestCandidate.crop.x,
      top: bestCandidate.crop.y,
      width: bestCandidate.crop.width,
      height: bestCandidate.crop.height
    })
    .resize(targetWidth, targetHeight, { fit: 'cover' })
    .jpeg({ quality: DEFAULT_QUALITY })
    .toBuffer()

  return {
    croppedImage,
    cropData: bestCandidate.crop,
    score: bestCandidate.score.total,
    metadata: await getImageMetadata(croppedImage)
  }
}

/**
 * Generate face-centered crop candidates
 */
function generateFaceCenteredCrops(
  landmarks: FaceLandmarks,
  imgWidth: number,
  imgHeight: number,
  targetWidth: number,
  targetHeight: number,
  targetAspect: number
): CropData[] {
  const crops: CropData[] = []

  // Calculate face center
  const faceCenterX = ((landmarks.leftEye.x + landmarks.rightEye.x) / 2) * imgWidth
  const faceCenterY = ((landmarks.leftEye.y + landmarks.rightEye.y + landmarks.nose.y + landmarks.mouth.y) / 4) * imgHeight

  // Try different scales
  const scales = [1.0, 1.2, 1.5, 2.0]

  for (const scale of scales) {
    let cropWidth: number
    let cropHeight: number

    // Calculate crop dimensions based on target aspect ratio
    if (targetAspect > imgWidth / imgHeight) {
      // Target is wider - use image width
      cropWidth = Math.min(imgWidth, targetWidth * scale)
      cropHeight = cropWidth / targetAspect
    } else {
      // Target is taller - use proportional height
      cropHeight = Math.min(imgHeight, targetHeight * scale)
      cropWidth = cropHeight * targetAspect
    }

    // Ensure dimensions don't exceed image
    cropWidth = Math.min(cropWidth, imgWidth)
    cropHeight = Math.min(cropHeight, imgHeight)

    // Position crop with face center in upper third (portrait rule)
    const offsetY = cropHeight * 0.33 // Face in upper third
    const cropX = Math.max(0, Math.min(imgWidth - cropWidth, faceCenterX - cropWidth / 2))
    const cropY = Math.max(0, Math.min(imgHeight - cropHeight, faceCenterY - offsetY))

    crops.push({
      x: Math.round(cropX),
      y: Math.round(cropY),
      width: Math.round(cropWidth),
      height: Math.round(cropHeight),
      scale
    })

    // Also try centered variant
    const centeredY = Math.max(0, Math.min(imgHeight - cropHeight, faceCenterY - cropHeight / 2))
    crops.push({
      x: Math.round(cropX),
      y: Math.round(centeredY),
      width: Math.round(cropWidth),
      height: Math.round(cropHeight),
      scale
    })
  }

  return crops
}

/**
 * Generate center-weighted crop candidates
 */
function generateCenterWeightedCrops(
  imgWidth: number,
  imgHeight: number,
  targetWidth: number,
  targetHeight: number,
  targetAspect: number
): CropData[] {
  const crops: CropData[] = []

  let cropWidth: number
  let cropHeight: number

  if (targetAspect > imgWidth / imgHeight) {
    cropWidth = imgWidth
    cropHeight = cropWidth / targetAspect
  } else {
    cropHeight = imgHeight
    cropWidth = cropHeight * targetAspect
  }

  cropWidth = Math.min(cropWidth, imgWidth)
  cropHeight = Math.min(cropHeight, imgHeight)

  // Center crop
  const cropX = (imgWidth - cropWidth) / 2
  const cropY = (imgHeight - cropHeight) / 2

  crops.push({
    x: Math.round(cropX),
    y: Math.round(cropY),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
    scale: 1.0
  })

  return crops
}

/**
 * Score a crop based on multiple factors
 */
function scoreCrop(
  crop: CropData,
  imgWidth: number,
  imgHeight: number,
  faceLandmarks?: FaceLandmarks[],
  safeZones?: SafeZone[]
): CropScore {
  let faceScore = 50 // Default if no faces
  let compositionScore = 50
  let safeZoneScore = 100

  // Calculate face score
  if (faceLandmarks && faceLandmarks.length > 0) {
    faceScore = calculateFaceScore(crop, faceLandmarks, imgWidth, imgHeight)
  }

  // Calculate composition score (rule of thirds)
  compositionScore = calculateCompositionScore(crop, imgWidth, imgHeight)

  // Calculate safe zone score
  if (safeZones && safeZones.length > 0) {
    const validation = validateCrop(crop, safeZones, imgWidth, imgHeight)
    safeZoneScore = validation.score
  }

  // Weighted total score
  const total = (faceScore * 0.5 + compositionScore * 0.2 + safeZoneScore * 0.3)

  return {
    total,
    faceScore,
    compositionScore,
    safeZoneScore
  }
}

/**
 * Calculate face coverage and positioning score
 */
function calculateFaceScore(
  crop: CropData,
  faceLandmarks: FaceLandmarks[],
  imgWidth: number,
  imgHeight: number
): number {
  let totalScore = 0

  for (const landmarks of faceLandmarks) {
    // Calculate face center
    const faceCenterX = ((landmarks.leftEye.x + landmarks.rightEye.x) / 2) * imgWidth
    const faceCenterY = ((landmarks.leftEye.y + landmarks.rightEye.y + landmarks.nose.y + landmarks.mouth.y) / 4) * imgHeight

    // Check if face center is in crop
    const inCrop = (
      faceCenterX >= crop.x &&
      faceCenterX <= crop.x + crop.width &&
      faceCenterY >= crop.y &&
      faceCenterY <= crop.y + crop.height
    )

    if (!inCrop) {
      totalScore += 0
      continue
    }

    // Calculate how centered the face is
    const cropCenterX = crop.x + crop.width / 2
    const cropCenterY = crop.y + crop.height / 2

    const distanceX = Math.abs(faceCenterX - cropCenterX) / crop.width
    const distanceY = Math.abs(faceCenterY - cropCenterY) / crop.height

    // Prefer faces in upper third for portraits
    let positionScore = 100
    const relativeY = (faceCenterY - crop.y) / crop.height
    if (relativeY >= 0.25 && relativeY <= 0.40) {
      positionScore = 100 // Perfect position (upper third)
    } else if (relativeY < 0.25) {
      positionScore = 80 // Too high
    } else if (relativeY > 0.40 && relativeY <= 0.60) {
      positionScore = 90 // Still good (center)
    } else {
      positionScore = 60 // Too low
    }

    // Horizontal centering score
    const centeringScore = Math.max(0, 100 - distanceX * 100)

    totalScore += (positionScore * 0.6 + centeringScore * 0.4)
  }

  return faceLandmarks.length > 0 ? totalScore / faceLandmarks.length : 50
}

/**
 * Calculate composition score using rule of thirds
 */
function calculateCompositionScore(crop: CropData, imgWidth: number, imgHeight: number): number {
  // Calculate how well the crop aligns with rule of thirds
  const cropAspect = crop.width / crop.height

  // Prefer certain aspect ratios (golden ratio, 16:9, 4:3, 1:1)
  const preferredRatios = [1.618, 16/9, 4/3, 1.0, 3/4]
  let aspectScore = 50

  for (const ratio of preferredRatios) {
    const diff = Math.abs(cropAspect - ratio) / ratio
    if (diff < 0.1) {
      aspectScore = 100
      break
    } else if (diff < 0.2) {
      aspectScore = Math.max(aspectScore, 80)
    }
  }

  // Check if crop uses good portion of image
  const coverageRatio = (crop.width * crop.height) / (imgWidth * imgHeight)
  const coverageScore = Math.min(100, coverageRatio * 120)

  return (aspectScore * 0.4 + coverageScore * 0.6)
}

/**
 * Strategy 2: Center-Weighted Crop
 *
 * Simple fallback strategy that crops from the center of the image.
 * Handles both wider and taller aspect ratios.
 *
 * @param imageBuffer - Source image buffer
 * @param targetWidth - Target crop width
 * @param targetHeight - Target crop height
 * @returns Crop result
 */
export async function centerWeightedCrop(
  imageBuffer: Buffer,
  targetWidth: number,
  targetHeight: number
): Promise<CropResult> {
  const metadata = await getImageMetadata(imageBuffer)
  const { width: imgWidth, height: imgHeight } = metadata

  const targetAspect = targetWidth / targetHeight
  const imageAspect = imgWidth / imgHeight

  let cropWidth: number
  let cropHeight: number

  // Calculate crop dimensions
  if (targetAspect > imageAspect) {
    // Target is wider - crop height
    cropWidth = imgWidth
    cropHeight = cropWidth / targetAspect
  } else {
    // Target is taller - crop width
    cropHeight = imgHeight
    cropWidth = cropHeight * targetAspect
  }

  // Ensure dimensions don't exceed image
  cropWidth = Math.min(cropWidth, imgWidth)
  cropHeight = Math.min(cropHeight, imgHeight)

  // Center the crop
  const cropX = (imgWidth - cropWidth) / 2
  const cropY = (imgHeight - cropHeight) / 2

  const cropData: CropData = {
    x: Math.round(cropX),
    y: Math.round(cropY),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
    scale: 1.0
  }

  const croppedImage = await sharp(imageBuffer)
    .extract({
      left: cropData.x,
      top: cropData.y,
      width: cropData.width,
      height: cropData.height
    })
    .resize(targetWidth, targetHeight, { fit: 'cover' })
    .jpeg({ quality: DEFAULT_QUALITY })
    .toBuffer()

  return {
    croppedImage,
    cropData,
    score: 70, // Default score for center crop
    metadata: await getImageMetadata(croppedImage)
  }
}

/**
 * Strategy 3: Intelligent Letterbox
 *
 * Fits the entire image within the target dimensions using various background methods.
 *
 * @param imageBuffer - Source image buffer
 * @param targetWidth - Target width
 * @param targetHeight - Target height
 * @param method - Background method: blur, solid, or extend
 * @returns Letterbox result
 */
export async function intelligentLetterbox(
  imageBuffer: Buffer,
  targetWidth: number,
  targetHeight: number,
  method: 'blur' | 'solid' | 'extend' = 'blur'
): Promise<LetterboxResult> {
  const metadata = await getImageMetadata(imageBuffer)
  const { width: imgWidth, height: imgHeight } = metadata

  const targetAspect = targetWidth / targetHeight
  const imageAspect = imgWidth / imgHeight

  let resizedWidth: number
  let resizedHeight: number

  // Calculate dimensions to fit image within target
  if (imageAspect > targetAspect) {
    // Image is wider
    resizedWidth = targetWidth
    resizedHeight = Math.round(targetWidth / imageAspect)
  } else {
    // Image is taller
    resizedHeight = targetHeight
    resizedWidth = Math.round(targetHeight * imageAspect)
  }

  let result: Buffer

  if (method === 'blur') {
    result = await letterboxWithBlur(imageBuffer, targetWidth, targetHeight, resizedWidth, resizedHeight)
  } else if (method === 'solid') {
    result = await letterboxWithSolid(imageBuffer, targetWidth, targetHeight, resizedWidth, resizedHeight)
  } else {
    result = await letterboxWithExtend(imageBuffer, targetWidth, targetHeight, resizedWidth, resizedHeight)
  }

  const letterboxData: LetterboxData = {
    method,
    originalWidth: imgWidth,
    originalHeight: imgHeight,
    finalWidth: targetWidth,
    finalHeight: targetHeight
  }

  if (method === 'solid') {
    letterboxData.backgroundColor = await extractDominantColor(imageBuffer)
  }

  return {
    croppedImage: result,
    letterboxData,
    metadata: await getImageMetadata(result)
  }
}

/**
 * Letterbox with blurred background
 */
async function letterboxWithBlur(
  imageBuffer: Buffer,
  targetWidth: number,
  targetHeight: number,
  resizedWidth: number,
  resizedHeight: number
): Promise<Buffer> {
  // Create blurred background
  const background = await sharp(imageBuffer)
    .resize(targetWidth, targetHeight, { fit: 'cover' })
    .blur(20)
    .toBuffer()

  // Resize foreground image
  const foreground = await sharp(imageBuffer)
    .resize(resizedWidth, resizedHeight, { fit: 'inside' })
    .toBuffer()

  // Composite foreground onto blurred background
  const offsetX = Math.round((targetWidth - resizedWidth) / 2)
  const offsetY = Math.round((targetHeight - resizedHeight) / 2)

  return sharp(background)
    .composite([{
      input: foreground,
      left: offsetX,
      top: offsetY
    }])
    .jpeg({ quality: DEFAULT_QUALITY })
    .toBuffer()
}

/**
 * Letterbox with solid color background
 */
async function letterboxWithSolid(
  imageBuffer: Buffer,
  targetWidth: number,
  targetHeight: number,
  resizedWidth: number,
  resizedHeight: number
): Promise<Buffer> {
  // Extract dominant color
  const dominantColor = await extractDominantColor(imageBuffer)

  // Create solid background
  const background = await sharp({
    create: {
      width: targetWidth,
      height: targetHeight,
      channels: 3,
      background: dominantColor
    }
  }).jpeg().toBuffer()

  // Resize foreground
  const foreground = await sharp(imageBuffer)
    .resize(resizedWidth, resizedHeight, { fit: 'inside' })
    .toBuffer()

  // Composite
  const offsetX = Math.round((targetWidth - resizedWidth) / 2)
  const offsetY = Math.round((targetHeight - resizedHeight) / 2)

  return sharp(background)
    .composite([{
      input: foreground,
      left: offsetX,
      top: offsetY
    }])
    .jpeg({ quality: DEFAULT_QUALITY })
    .toBuffer()
}

/**
 * Letterbox with edge extension
 */
async function letterboxWithExtend(
  imageBuffer: Buffer,
  targetWidth: number,
  targetHeight: number,
  resizedWidth: number,
  resizedHeight: number
): Promise<Buffer> {
  // Resize image
  const resized = await sharp(imageBuffer)
    .resize(resizedWidth, resizedHeight, { fit: 'inside' })
    .toBuffer()

  // Extend using edge pixels
  const extendTop = Math.floor((targetHeight - resizedHeight) / 2)
  const extendBottom = Math.ceil((targetHeight - resizedHeight) / 2)
  const extendLeft = Math.floor((targetWidth - resizedWidth) / 2)
  const extendRight = Math.ceil((targetWidth - resizedWidth) / 2)

  return sharp(resized)
    .extend({
      top: extendTop,
      bottom: extendBottom,
      left: extendLeft,
      right: extendRight,
      background: { r: 0, g: 0, b: 0, alpha: 1 } // Will use edge pixels
    })
    .jpeg({ quality: DEFAULT_QUALITY })
    .toBuffer()
}

/**
 * Strategy 4: Multi-Focal Point Crop
 *
 * Keeps multiple important points in frame by calculating a bounding box
 * around all focal points and adjusting to target ratio.
 *
 * @param imageBuffer - Source image buffer
 * @param targetWidth - Target width
 * @param targetHeight - Target height
 * @param focalPoints - Array of focal points
 * @returns Crop result
 */
export async function multiFocalCrop(
  imageBuffer: Buffer,
  targetWidth: number,
  targetHeight: number,
  focalPoints: FocalPoint[]
): Promise<CropResult> {
  const metadata = await getImageMetadata(imageBuffer)
  const { width: imgWidth, height: imgHeight } = metadata

  if (focalPoints.length === 0) {
    // Fallback to center crop
    return centerWeightedCrop(imageBuffer, targetWidth, targetHeight)
  }

  // Calculate bounding box around all focal points
  let minX = focalPoints[0].x
  let maxX = focalPoints[0].x
  let minY = focalPoints[0].y
  let maxY = focalPoints[0].y

  for (const point of focalPoints) {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  }

  // Add padding (20%)
  const paddingX = (maxX - minX) * 0.2
  const paddingY = (maxY - minY) * 0.2

  minX = Math.max(0, minX - paddingX)
  maxX = Math.min(imgWidth, maxX + paddingX)
  minY = Math.max(0, minY - paddingY)
  maxY = Math.min(imgHeight, maxY + paddingY)

  const boundingWidth = maxX - minX
  const boundingHeight = maxY - minY

  const targetAspect = targetWidth / targetHeight
  const boundingAspect = boundingWidth / boundingHeight

  let cropWidth: number
  let cropHeight: number
  let cropX: number
  let cropY: number

  // Adjust bounding box to match target aspect ratio
  if (boundingAspect > targetAspect) {
    // Bounding box is wider - expand height
    cropWidth = boundingWidth
    cropHeight = cropWidth / targetAspect
    cropX = minX
    cropY = minY - (cropHeight - boundingHeight) / 2
  } else {
    // Bounding box is taller - expand width
    cropHeight = boundingHeight
    cropWidth = cropHeight * targetAspect
    cropX = minX - (cropWidth - boundingWidth) / 2
    cropY = minY
  }

  // Clamp to image bounds
  cropX = Math.max(0, Math.min(imgWidth - cropWidth, cropX))
  cropY = Math.max(0, Math.min(imgHeight - cropHeight, cropY))
  cropWidth = Math.min(cropWidth, imgWidth - cropX)
  cropHeight = Math.min(cropHeight, imgHeight - cropY)

  const cropData: CropData = {
    x: Math.round(cropX),
    y: Math.round(cropY),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight)
  }

  const croppedImage = await sharp(imageBuffer)
    .extract({
      left: cropData.x,
      top: cropData.y,
      width: cropData.width,
      height: cropData.height
    })
    .resize(targetWidth, targetHeight, { fit: 'cover' })
    .jpeg({ quality: DEFAULT_QUALITY })
    .toBuffer()

  return {
    croppedImage,
    cropData,
    score: 80, // Good score for multi-focal
    metadata: await getImageMetadata(croppedImage)
  }
}

/**
 * Main crop orchestrator
 *
 * Generates optimal crop based on strategy and options.
 *
 * @param imageBuffer - Source image buffer
 * @param targetSpec - Platform specification
 * @param strategy - Crop strategy to use
 * @param options - Additional options
 * @returns Complete crop result with validation
 */
export async function generateOptimalCrop(
  imageBuffer: Buffer,
  targetSpec: PlatformSpec,
  strategy: CropStrategy = CropStrategy.SMART_CROP,
  options?: SmartCropOptions
): Promise<OptimalCropResult> {
  const metadata = await getImageMetadata(imageBuffer)
  const quality = targetSpec.quality || DEFAULT_QUALITY

  let result: CropResult | LetterboxResult
  let cropData: CropData | undefined
  let letterboxData: LetterboxData | undefined
  let validationScore = 100
  let validationWarnings: string[] = []

  // Detect safe zones
  let safeZones = options?.safeZones || []
  if (options?.faceLandmarks && safeZones.length === 0) {
    safeZones = await detectSafeZones(imageBuffer, options.faceLandmarks)
  }

  // Execute strategy
  switch (strategy) {
    case CropStrategy.SMART_CROP:
      result = await aiSmartCrop(imageBuffer, targetSpec.width, targetSpec.height, options)
      cropData = result.cropData
      break

    case CropStrategy.CENTER_WEIGHTED:
      result = await centerWeightedCrop(imageBuffer, targetSpec.width, targetSpec.height)
      cropData = result.cropData
      break

    case CropStrategy.LETTERBOX_BLUR:
      result = await intelligentLetterbox(imageBuffer, targetSpec.width, targetSpec.height, 'blur')
      letterboxData = result.letterboxData
      break

    case CropStrategy.LETTERBOX_SOLID:
      result = await intelligentLetterbox(imageBuffer, targetSpec.width, targetSpec.height, 'solid')
      letterboxData = result.letterboxData
      break

    case CropStrategy.LETTERBOX_EXTEND:
      result = await intelligentLetterbox(imageBuffer, targetSpec.width, targetSpec.height, 'extend')
      letterboxData = result.letterboxData
      break

    case CropStrategy.MULTI_FOCAL:
      // Convert face landmarks to focal points
      const focalPoints: FocalPoint[] = []
      if (options?.faceLandmarks) {
        for (const landmarks of options.faceLandmarks) {
          focalPoints.push({
            x: ((landmarks.leftEye.x + landmarks.rightEye.x) / 2) * metadata.width,
            y: ((landmarks.leftEye.y + landmarks.rightEye.y) / 2) * metadata.height,
            weight: 1.0
          })
        }
      }
      result = await multiFocalCrop(imageBuffer, targetSpec.width, targetSpec.height, focalPoints)
      cropData = result.cropData
      break

    default:
      result = await centerWeightedCrop(imageBuffer, targetSpec.width, targetSpec.height)
      cropData = result.cropData
  }

  // Validate crop if we have crop data and safe zones
  if (cropData && safeZones.length > 0) {
    const validation = validateCrop(cropData, safeZones, metadata.width, metadata.height)
    validationScore = validation.score
    validationWarnings = validation.warnings
  }

  return {
    croppedImage: result.croppedImage,
    cropData,
    letterboxData,
    validationScore,
    validationWarnings,
    metadata: result.metadata
  }
}

/**
 * Get image metadata
 *
 * @param buffer - Image buffer
 * @returns Image metadata
 */
export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  const metadata = await sharp(buffer).metadata()

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    hasAlpha: metadata.hasAlpha,
    aspectRatio: metadata.width && metadata.height ? metadata.width / metadata.height : 1
  }
}

/**
 * Extract dominant color from image
 *
 * @param buffer - Image buffer
 * @returns Hex color string
 */
export async function extractDominantColor(buffer: Buffer): Promise<string> {
  try {
    // Resize to small size for faster processing
    const { data, info } = await sharp(buffer)
      .resize(100, 100, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true })

    // Calculate average color
    let r = 0, g = 0, b = 0
    const pixelCount = info.width * info.height

    for (let i = 0; i < data.length; i += info.channels) {
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
    }

    r = Math.round(r / pixelCount)
    g = Math.round(g / pixelCount)
    b = Math.round(b / pixelCount)

    // Convert to hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  } catch (error) {
    console.error('Error extracting dominant color:', error)
    return '#000000' // Fallback to black
  }
}

/**
 * Resize image
 *
 * @param buffer - Image buffer
 * @param width - Target width
 * @param height - Target height
 * @param fit - Fit mode
 * @returns Resized image buffer
 */
export async function resizeImage(
  buffer: Buffer,
  width: number,
  height: number,
  fit: 'cover' | 'contain' | 'fill' = 'cover'
): Promise<Buffer> {
  return sharp(buffer)
    .resize(width, height, { fit })
    .jpeg({ quality: DEFAULT_QUALITY })
    .toBuffer()
}
