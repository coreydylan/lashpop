/**
 * Image Processing Utilities for Social Variant Generation
 *
 * Uses Sharp for high-performance image manipulation
 */

import sharp from 'sharp'
import { CropData, CropStrategy, SocialVariantSpec, SafeZone } from '@/types/social-variants'

export interface ProcessedImage {
  buffer: Buffer
  width: number
  height: number
  format: string
  size: number
}

export interface CropResult {
  buffer: Buffer
  cropData: CropData
  width: number
  height: number
}

/**
 * Generate a cropped variant of an image
 */
export async function generateVariant(
  sourceBuffer: Buffer,
  spec: SocialVariantSpec,
  strategy: CropStrategy = CropStrategy.SMART_CROP,
  safeZones: SafeZone[] = []
): Promise<CropResult> {
  const image = sharp(sourceBuffer)
  const metadata = await image.metadata()

  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image dimensions')
  }

  const sourceWidth = metadata.width
  const sourceHeight = metadata.height

  // Calculate crop based on strategy
  const cropData = calculateCrop(
    sourceWidth,
    sourceHeight,
    spec.width,
    spec.height,
    strategy,
    safeZones
  )

  // Apply crop and resize
  const croppedImage = await image
    .extract({
      left: cropData.x,
      top: cropData.y,
      width: cropData.width,
      height: cropData.height
    })
    .resize(spec.width, spec.height, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality: 90, progressive: true })
    .toBuffer()

  return {
    buffer: croppedImage,
    cropData,
    width: spec.width,
    height: spec.height
  }
}

/**
 * Calculate optimal crop coordinates based on strategy
 */
export function calculateCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  strategy: CropStrategy,
  safeZones: SafeZone[] = []
): CropData {
  const targetRatio = targetWidth / targetHeight

  switch (strategy) {
    case CropStrategy.CENTER_CROP:
      return centerCrop(sourceWidth, sourceHeight, targetRatio, safeZones)

    case CropStrategy.LETTERBOX:
      return letterboxCrop(sourceWidth, sourceHeight, targetRatio, safeZones)

    case CropStrategy.EXTEND:
      return extendCrop(sourceWidth, sourceHeight, targetRatio, safeZones)

    case CropStrategy.SMART_CROP:
    default:
      // Smart crop with safe zone awareness
      return smartCrop(sourceWidth, sourceHeight, targetRatio, safeZones)
  }
}

/**
 * Calculate crop score based on safe zone preservation
 */
function calculateCropScore(
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number,
  safeZones: SafeZone[]
): number {
  if (safeZones.length === 0) {
    // Base score on crop coverage
    return 85
  }

  let totalScore = 0
  let totalWeight = 0

  for (const zone of safeZones) {
    const weight = zone.importance === 'critical' ? 3 : zone.importance === 'important' ? 2 : 1

    // Calculate overlap percentage
    const overlapX = Math.max(0, Math.min(cropX + cropWidth, zone.x + zone.width) - Math.max(cropX, zone.x))
    const overlapY = Math.max(0, Math.min(cropY + cropHeight, zone.y + zone.height) - Math.max(cropY, zone.y))
    const overlapArea = overlapX * overlapY
    const zoneArea = zone.width * zone.height
    const overlapPercent = zoneArea > 0 ? (overlapArea / zoneArea) * 100 : 0

    totalScore += overlapPercent * weight
    totalWeight += weight
  }

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 85
}

/**
 * Simple center crop
 */
function centerCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetRatio: number,
  safeZones: SafeZone[]
): CropData {
  const sourceRatio = sourceWidth / sourceHeight

  let x = 0
  let y = 0
  let width = sourceWidth
  let height = sourceHeight

  if (sourceRatio > targetRatio) {
    // Source is wider - crop width
    width = Math.round(sourceHeight * targetRatio)
    x = Math.round((sourceWidth - width) / 2)
  } else {
    // Source is taller - crop height
    height = Math.round(sourceWidth / targetRatio)
    y = Math.round((sourceHeight - height) / 2)
  }

  const score = calculateCropScore(x, y, width, height, safeZones)

  return {
    x,
    y,
    width,
    height,
    score,
    safeZones: filterSafeZonesInCrop(safeZones, x, y, width, height)
  }
}

/**
 * Letterbox crop - fits entire image with padding
 */
function letterboxCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetRatio: number,
  safeZones: SafeZone[]
): CropData {
  // Return full image - will be letterboxed during resize
  const score = calculateCropScore(0, 0, sourceWidth, sourceHeight, safeZones)

  return {
    x: 0,
    y: 0,
    width: sourceWidth,
    height: sourceHeight,
    score,
    safeZones: [...safeZones]
  }
}

/**
 * Extend crop - similar to letterbox
 */
function extendCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetRatio: number,
  safeZones: SafeZone[]
): CropData {
  // Same as letterbox for now
  return letterboxCrop(sourceWidth, sourceHeight, targetRatio, safeZones)
}

/**
 * Smart crop with bias toward upper portion and safe zone awareness
 */
function smartCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetRatio: number,
  safeZones: SafeZone[]
): CropData {
  const sourceRatio = sourceWidth / sourceHeight

  let x = 0
  let y = 0
  let width = sourceWidth
  let height = sourceHeight

  if (sourceRatio > targetRatio) {
    // Source is wider - crop width
    width = Math.round(sourceHeight * targetRatio)

    // If we have safe zones, try to center on them
    if (safeZones.length > 0) {
      const criticalZones = safeZones.filter(z => z.importance === 'critical')
      const zonesToConsider = criticalZones.length > 0 ? criticalZones : safeZones

      // Calculate center of mass of safe zones
      const centerX = zonesToConsider.reduce((sum, z) => sum + (z.x + z.width / 2), 0) / zonesToConsider.length
      x = Math.round(Math.max(0, Math.min(centerX - width / 2, sourceWidth - width)))
    } else {
      x = Math.round((sourceWidth - width) / 2)
    }
  } else {
    // Source is taller - crop height
    height = Math.round(sourceWidth / targetRatio)

    // If we have safe zones, try to center on them
    if (safeZones.length > 0) {
      const criticalZones = safeZones.filter(z => z.importance === 'critical')
      const zonesToConsider = criticalZones.length > 0 ? criticalZones : safeZones

      // Calculate center of mass of safe zones
      const centerY = zonesToConsider.reduce((sum, z) => sum + (z.y + z.height / 2), 0) / zonesToConsider.length
      y = Math.round(Math.max(0, Math.min(centerY - height / 2, sourceHeight - height)))
    } else {
      // Position at 30% from top instead of center (better for portraits)
      y = Math.round(Math.min(
        (sourceHeight - height) * 0.3,
        sourceHeight - height
      ))
    }
  }

  const score = calculateCropScore(x, y, width, height, safeZones)

  return {
    x,
    y,
    width,
    height,
    score,
    safeZones: filterSafeZonesInCrop(safeZones, x, y, width, height)
  }
}

/**
 * Filter safe zones to only those within or overlapping the crop
 */
function filterSafeZonesInCrop(
  safeZones: SafeZone[],
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number
): SafeZone[] {
  return safeZones.filter(zone => {
    // Check if zone overlaps with crop
    const overlapsX = zone.x < cropX + cropWidth && zone.x + zone.width > cropX
    const overlapsY = zone.y < cropY + cropHeight && zone.y + zone.height > cropY
    return overlapsX && overlapsY
  }).map(zone => {
    // Adjust zone coordinates relative to crop
    return {
      ...zone,
      x: Math.max(0, zone.x - cropX),
      y: Math.max(0, zone.y - cropY),
      width: Math.min(zone.width, cropX + cropWidth - zone.x),
      height: Math.min(zone.height, cropY + cropHeight - zone.y)
    }
  })
}

/**
 * Get image metadata without loading full buffer
 */
export async function getImageMetadata(buffer: Buffer): Promise<{
  width: number
  height: number
  format: string
  size: number
}> {
  const metadata = await sharp(buffer).metadata()

  if (!metadata.width || !metadata.height || !metadata.format) {
    throw new Error('Unable to read image metadata')
  }

  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: metadata.size || 0
  }
}

/**
 * Regenerate image with new crop data
 */
export async function regenerateWithCrop(
  sourceBuffer: Buffer,
  targetWidth: number,
  targetHeight: number,
  cropData: CropData
): Promise<Buffer> {
  const image = sharp(sourceBuffer)
  const metadata = await image.metadata()

  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image dimensions')
  }

  // Apply crop and resize
  return await image
    .extract({
      left: cropData.x,
      top: cropData.y,
      width: cropData.width,
      height: cropData.height
    })
    .resize(targetWidth, targetHeight, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality: 90, progressive: true })
    .toBuffer()
}

/**
 * Convert image to different format
 */
export async function convertImageFormat(
  buffer: Buffer,
  format: 'jpg' | 'png' | 'original',
  quality: number = 90
): Promise<Buffer> {
  const image = sharp(buffer)

  if (format === 'original') {
    return buffer
  }

  if (format === 'png') {
    return await image.png({ quality }).toBuffer()
  }

  // Default to JPEG
  return await image.jpeg({ quality, progressive: true }).toBuffer()
}
