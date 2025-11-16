/**
 * Safe Zone Detection System
 *
 * Detects important regions in images that should be preserved during cropping,
 * including faces and high-contrast text areas.
 */

import sharp from 'sharp'
import type { FaceLandmarks } from '../mediapipe-face'
import { SafeZone, SafeZoneImportance, ImageMetadata, CropData, CropValidation } from './types'

/**
 * Detect safe zones from face landmarks and image content
 *
 * @param imageBuffer - Image buffer to analyze
 * @param faceLandmarks - Optional array of face landmarks from MediaPipe
 * @returns Array of detected safe zones
 */
export async function detectSafeZones(
  imageBuffer: Buffer,
  faceLandmarks?: FaceLandmarks[]
): Promise<SafeZone[]> {
  const safeZones: SafeZone[] = []

  // Get image dimensions
  const metadata = await sharp(imageBuffer).metadata()
  const width = metadata.width || 0
  const height = metadata.height || 0

  if (width === 0 || height === 0) {
    return safeZones
  }

  // Create face safe zones from landmarks
  if (faceLandmarks && faceLandmarks.length > 0) {
    for (let i = 0; i < faceLandmarks.length; i++) {
      const landmarks = faceLandmarks[i]
      const faceZone = createFaceSafeZone(landmarks, width, height, i)
      if (faceZone) {
        safeZones.push(faceZone)
      }
    }
  }

  // Detect text regions (high-contrast areas)
  const textZones = await detectTextRegions(imageBuffer, width, height)
  safeZones.push(...textZones)

  return safeZones
}

/**
 * Create a safe zone from face landmarks
 *
 * @param landmarks - Face landmarks from MediaPipe
 * @param imageWidth - Image width in pixels
 * @param imageHeight - Image height in pixels
 * @param index - Face index
 * @returns Safe zone for the face
 */
function createFaceSafeZone(
  landmarks: FaceLandmarks,
  imageWidth: number,
  imageHeight: number,
  index: number
): SafeZone | null {
  // Convert normalized coordinates (0-1) to pixel coordinates
  const leftEyeX = landmarks.leftEye.x * imageWidth
  const leftEyeY = landmarks.leftEye.y * imageHeight
  const rightEyeX = landmarks.rightEye.x * imageWidth
  const rightEyeY = landmarks.rightEye.y * imageHeight
  const noseX = landmarks.nose.x * imageWidth
  const noseY = landmarks.nose.y * imageHeight
  const mouthX = landmarks.mouth.x * imageWidth
  const mouthY = landmarks.mouth.y * imageHeight

  // Calculate bounding box around face landmarks
  const minX = Math.min(leftEyeX, rightEyeX, noseX, mouthX)
  const maxX = Math.max(leftEyeX, rightEyeX, noseX, mouthX)
  const minY = Math.min(leftEyeY, rightEyeY, noseY, mouthY)
  const maxY = Math.max(leftEyeY, rightEyeY, noseY, mouthY)

  // Add padding around face (30% on each side)
  const eyeDistance = Math.abs(rightEyeX - leftEyeX)
  const padding = eyeDistance * 0.3

  const x = Math.max(0, minX - padding)
  const y = Math.max(0, minY - padding * 1.5) // More padding on top
  const width = Math.min(imageWidth - x, maxX - minX + padding * 2)
  const height = Math.min(imageHeight - y, maxY - minY + padding * 2.5)

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
    importance: SafeZoneImportance.CRITICAL,
    type: 'face',
    label: `Face ${index + 1}`
  }
}

/**
 * Detect high-contrast text regions using edge detection
 *
 * @param imageBuffer - Image buffer to analyze
 * @param width - Image width
 * @param height - Image height
 * @returns Array of detected text safe zones
 */
async function detectTextRegions(
  imageBuffer: Buffer,
  width: number,
  height: number
): Promise<SafeZone[]> {
  try {
    // Convert to grayscale and apply edge detection
    const edgeImage = await sharp(imageBuffer)
      .grayscale()
      .normalise()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1] // Laplacian edge detection
      })
      .raw()
      .toBuffer({ resolveWithObject: true })

    const { data, info } = edgeImage

    // Divide image into grid and analyze each cell
    const gridSize = 8 // 8x8 grid
    const cellWidth = Math.floor(info.width / gridSize)
    const cellHeight = Math.floor(info.height / gridSize)

    const textZones: SafeZone[] = []

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cellX = col * cellWidth
        const cellY = row * cellHeight

        // Calculate edge density in this cell
        let edgePixels = 0
        let totalPixels = 0

        for (let y = cellY; y < cellY + cellHeight && y < info.height; y++) {
          for (let x = cellX; x < cellX + cellWidth && x < info.width; x++) {
            const idx = y * info.width + x
            const value = data[idx]

            totalPixels++
            if (value > 128) { // High edge response
              edgePixels++
            }
          }
        }

        const edgeDensity = edgePixels / totalPixels

        // If edge density is high, mark as potential text region
        if (edgeDensity > 0.15) {
          textZones.push({
            x: Math.round(cellX),
            y: Math.round(cellY),
            width: Math.round(cellWidth),
            height: Math.round(cellHeight),
            importance: SafeZoneImportance.IMPORTANT,
            type: 'text',
            label: `Text region (${row},${col})`
          })
        }
      }
    }

    // Merge adjacent text zones
    return mergeAdjacentZones(textZones)

  } catch (error) {
    console.error('Error detecting text regions:', error)
    return []
  }
}

/**
 * Merge adjacent safe zones to reduce fragmentation
 *
 * @param zones - Array of safe zones
 * @returns Merged safe zones
 */
function mergeAdjacentZones(zones: SafeZone[]): SafeZone[] {
  if (zones.length === 0) return zones

  const merged: SafeZone[] = []
  const used = new Set<number>()

  for (let i = 0; i < zones.length; i++) {
    if (used.has(i)) continue

    const zone = zones[i]
    let mergedZone = { ...zone }

    // Try to merge with other zones
    for (let j = i + 1; j < zones.length; j++) {
      if (used.has(j)) continue

      const other = zones[j]

      // Check if zones are adjacent or overlapping
      if (zonesAreAdjacent(mergedZone, other)) {
        mergedZone = mergeTwoZones(mergedZone, other)
        used.add(j)
      }
    }

    merged.push(mergedZone)
    used.add(i)
  }

  return merged
}

/**
 * Check if two zones are adjacent or overlapping
 */
function zonesAreAdjacent(zone1: SafeZone, zone2: SafeZone): boolean {
  const overlap = !(
    zone1.x + zone1.width < zone2.x ||
    zone2.x + zone2.width < zone1.x ||
    zone1.y + zone1.height < zone2.y ||
    zone2.y + zone2.height < zone1.y
  )

  return overlap
}

/**
 * Merge two zones into one
 */
function mergeTwoZones(zone1: SafeZone, zone2: SafeZone): SafeZone {
  const minX = Math.min(zone1.x, zone2.x)
  const minY = Math.min(zone1.y, zone2.y)
  const maxX = Math.max(zone1.x + zone1.width, zone2.x + zone2.width)
  const maxY = Math.max(zone1.y + zone1.height, zone2.y + zone2.height)

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    importance: zone1.importance, // Keep first zone's importance
    type: zone1.type,
    label: `${zone1.label} + ${zone2.label}`
  }
}

/**
 * Validate if a crop preserves safe zones adequately
 *
 * @param crop - Crop data to validate
 * @param safeZones - Array of safe zones
 * @param imageWidth - Original image width
 * @param imageHeight - Original image height
 * @returns Validation result
 */
export function validateCrop(
  crop: CropData,
  safeZones: SafeZone[],
  imageWidth?: number,
  imageHeight?: number
): CropValidation {
  const violations: SafeZone[] = []
  const warnings: string[] = []
  let totalScore = 100

  for (const zone of safeZones) {
    const visibility = calculateZoneVisibility(crop, zone)

    // Check critical zones (must be 95%+ visible)
    if (zone.importance === SafeZoneImportance.CRITICAL) {
      if (visibility < 0.95) {
        violations.push(zone)
        warnings.push(`${zone.label || 'Critical zone'} is only ${(visibility * 100).toFixed(0)}% visible (minimum 95%)`)
        totalScore -= 30
      }
    }

    // Check important zones (should be 80%+ visible)
    if (zone.importance === SafeZoneImportance.IMPORTANT) {
      if (visibility < 0.80) {
        violations.push(zone)
        warnings.push(`${zone.label || 'Important zone'} is only ${(visibility * 100).toFixed(0)}% visible (recommended 80%)`)
        totalScore -= 15
      }
    }

    // Check preferred zones
    if (zone.importance === SafeZoneImportance.PREFERRED) {
      if (visibility < 0.60) {
        warnings.push(`${zone.label || 'Preferred zone'} is only ${(visibility * 100).toFixed(0)}% visible`)
        totalScore -= 5
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    score: Math.max(0, totalScore),
    warnings
  }
}

/**
 * Calculate how much of a safe zone is visible in the crop
 *
 * @param crop - Crop data
 * @param zone - Safe zone
 * @returns Visibility ratio (0-1)
 */
function calculateZoneVisibility(crop: CropData, zone: SafeZone): number {
  // Calculate intersection
  const intersectX = Math.max(crop.x, zone.x)
  const intersectY = Math.max(crop.y, zone.y)
  const intersectRight = Math.min(crop.x + crop.width, zone.x + zone.width)
  const intersectBottom = Math.min(crop.y + crop.height, zone.y + zone.height)

  const intersectWidth = Math.max(0, intersectRight - intersectX)
  const intersectHeight = Math.max(0, intersectBottom - intersectY)
  const intersectArea = intersectWidth * intersectHeight

  const zoneArea = zone.width * zone.height

  if (zoneArea === 0) return 0

  return intersectArea / zoneArea
}
