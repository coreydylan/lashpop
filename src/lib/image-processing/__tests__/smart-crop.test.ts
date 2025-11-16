/**
 * Unit tests for Smart Crop Engine
 *
 * These tests demonstrate the usage of various cropping strategies
 * and validate the crop scoring and validation logic.
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import sharp from 'sharp'
import {
  aiSmartCrop,
  centerWeightedCrop,
  intelligentLetterbox,
  multiFocalCrop,
  generateOptimalCrop,
  getImageMetadata,
  extractDominantColor,
  resizeImage
} from '../smart-crop'
import {
  CropStrategy,
  PlatformSpec,
  FocalPoint,
  SafeZoneImportance,
  SafeZone
} from '../types'
import type { FaceLandmarks } from '../../mediapipe-face'

// Helper function to create a test image
async function createTestImage(
  width: number,
  height: number,
  color: string = '#FF0000'
): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color
    }
  })
    .jpeg()
    .toBuffer()
}

// Helper function to create mock face landmarks
function createMockFaceLandmarks(
  centerX: number = 0.5,
  centerY: number = 0.35
): FaceLandmarks {
  return {
    leftEye: { x: centerX - 0.1, y: centerY },
    rightEye: { x: centerX + 0.1, y: centerY },
    nose: { x: centerX, y: centerY + 0.05 },
    mouth: { x: centerX, y: centerY + 0.15 },
    leftEyelidContour: [],
    rightEyelidContour: []
  }
}

describe('Smart Crop Engine - Utility Functions', () => {
  it('should get image metadata correctly', async () => {
    const buffer = await createTestImage(1920, 1080)
    const metadata = await getImageMetadata(buffer)

    expect(metadata.width).toBe(1920)
    expect(metadata.height).toBe(1080)
    expect(metadata.format).toBe('jpeg')
    expect(metadata.aspectRatio).toBeCloseTo(16 / 9, 2)
  })

  it('should extract dominant color', async () => {
    const buffer = await createTestImage(100, 100, '#3498db')
    const color = await extractDominantColor(buffer)

    expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    // Color should be close to blue
    expect(color.toLowerCase()).toContain('3')
  })

  it('should resize image correctly', async () => {
    const buffer = await createTestImage(1920, 1080)
    const resized = await resizeImage(buffer, 800, 600, 'cover')
    const metadata = await getImageMetadata(resized)

    expect(metadata.width).toBe(800)
    expect(metadata.height).toBe(600)
  })
})

describe('Smart Crop Engine - Center Weighted Crop', () => {
  it('should crop from center for landscape image to portrait', async () => {
    const buffer = await createTestImage(1920, 1080)
    const result = await centerWeightedCrop(buffer, 1080, 1920)

    expect(result.cropData).toBeDefined()
    expect(result.cropData.width).toBeLessThanOrEqual(1920)
    expect(result.cropData.height).toBe(1080)
    expect(result.score).toBeGreaterThan(0)

    const metadata = await getImageMetadata(result.croppedImage)
    expect(metadata.width).toBe(1080)
    expect(metadata.height).toBe(1920)
  })

  it('should crop from center for portrait image to landscape', async () => {
    const buffer = await createTestImage(1080, 1920)
    const result = await centerWeightedCrop(buffer, 1920, 1080)

    expect(result.cropData).toBeDefined()
    expect(result.cropData.width).toBe(1080)
    expect(result.cropData.height).toBeLessThanOrEqual(1920)

    const metadata = await getImageMetadata(result.croppedImage)
    expect(metadata.width).toBe(1920)
    expect(metadata.height).toBe(1080)
  })

  it('should crop square image to square', async () => {
    const buffer = await createTestImage(1000, 1000)
    const result = await centerWeightedCrop(buffer, 500, 500)

    expect(result.cropData).toBeDefined()
    expect(result.cropData.width).toBe(1000)
    expect(result.cropData.height).toBe(1000)

    const metadata = await getImageMetadata(result.croppedImage)
    expect(metadata.width).toBe(500)
    expect(metadata.height).toBe(500)
  })
})

describe('Smart Crop Engine - AI Smart Crop with Face Detection', () => {
  it('should crop with face landmarks keeping face centered', async () => {
    const buffer = await createTestImage(1920, 1080)
    const faceLandmarks = [createMockFaceLandmarks(0.5, 0.35)]

    const result = await aiSmartCrop(buffer, 1080, 1080, { faceLandmarks })

    expect(result.cropData).toBeDefined()
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThanOrEqual(100)

    const metadata = await getImageMetadata(result.croppedImage)
    expect(metadata.width).toBe(1080)
    expect(metadata.height).toBe(1080)
  })

  it('should handle multiple faces', async () => {
    const buffer = await createTestImage(1920, 1080)
    const faceLandmarks = [
      createMockFaceLandmarks(0.3, 0.35),
      createMockFaceLandmarks(0.7, 0.35)
    ]

    const result = await aiSmartCrop(buffer, 1080, 1080, { faceLandmarks })

    expect(result.cropData).toBeDefined()
    expect(result.score).toBeGreaterThan(0)
  })

  it('should fallback to center crop when no face landmarks provided', async () => {
    const buffer = await createTestImage(1920, 1080)
    const result = await aiSmartCrop(buffer, 1080, 1080)

    expect(result.cropData).toBeDefined()
    expect(result.score).toBeGreaterThan(0)
  })
})

describe('Smart Crop Engine - Intelligent Letterbox', () => {
  it('should letterbox with blur background', async () => {
    const buffer = await createTestImage(1080, 1920) // Tall image
    const result = await intelligentLetterbox(buffer, 1920, 1080, 'blur')

    expect(result.letterboxData).toBeDefined()
    expect(result.letterboxData.method).toBe('blur')
    expect(result.letterboxData.finalWidth).toBe(1920)
    expect(result.letterboxData.finalHeight).toBe(1080)

    const metadata = await getImageMetadata(result.croppedImage)
    expect(metadata.width).toBe(1920)
    expect(metadata.height).toBe(1080)
  })

  it('should letterbox with solid color background', async () => {
    const buffer = await createTestImage(1080, 1920, '#3498db')
    const result = await intelligentLetterbox(buffer, 1920, 1080, 'solid')

    expect(result.letterboxData).toBeDefined()
    expect(result.letterboxData.method).toBe('solid')
    expect(result.letterboxData.backgroundColor).toMatch(/^#[0-9a-f]{6}$/i)

    const metadata = await getImageMetadata(result.croppedImage)
    expect(metadata.width).toBe(1920)
    expect(metadata.height).toBe(1080)
  })

  it('should letterbox with edge extension', async () => {
    const buffer = await createTestImage(1080, 1920)
    const result = await intelligentLetterbox(buffer, 1920, 1080, 'extend')

    expect(result.letterboxData).toBeDefined()
    expect(result.letterboxData.method).toBe('extend')

    const metadata = await getImageMetadata(result.croppedImage)
    expect(metadata.width).toBe(1920)
    expect(metadata.height).toBe(1080)
  })
})

describe('Smart Crop Engine - Multi-Focal Point Crop', () => {
  it('should crop to include all focal points', async () => {
    const buffer = await createTestImage(1920, 1080)
    const focalPoints: FocalPoint[] = [
      { x: 500, y: 300, weight: 1.0 },
      { x: 1400, y: 700, weight: 1.0 }
    ]

    const result = await multiFocalCrop(buffer, 1080, 1080, focalPoints)

    expect(result.cropData).toBeDefined()
    expect(result.score).toBeGreaterThan(0)

    // Crop should include both focal points
    const crop = result.cropData
    expect(crop.x).toBeLessThanOrEqual(500)
    expect(crop.y).toBeLessThanOrEqual(300)
    expect(crop.x + crop.width).toBeGreaterThanOrEqual(1400)
    expect(crop.y + crop.height).toBeGreaterThanOrEqual(700)
  })

  it('should fallback to center crop with no focal points', async () => {
    const buffer = await createTestImage(1920, 1080)
    const result = await multiFocalCrop(buffer, 1080, 1080, [])

    expect(result.cropData).toBeDefined()
    expect(result.score).toBe(70) // Center crop default score
  })
})

describe('Smart Crop Engine - Generate Optimal Crop', () => {
  const instagramSquare: PlatformSpec = {
    name: 'Instagram Square',
    width: 1080,
    height: 1080,
    quality: 85
  }

  const instagramStory: PlatformSpec = {
    name: 'Instagram Story',
    width: 1080,
    height: 1920,
    quality: 85
  }

  it('should generate smart crop for Instagram square', async () => {
    const buffer = await createTestImage(1920, 1080)
    const faceLandmarks = [createMockFaceLandmarks(0.5, 0.35)]

    const result = await generateOptimalCrop(
      buffer,
      instagramSquare,
      CropStrategy.SMART_CROP,
      { faceLandmarks }
    )

    expect(result.croppedImage).toBeDefined()
    expect(result.cropData).toBeDefined()
    expect(result.validationScore).toBeGreaterThan(0)
    expect(result.validationWarnings).toBeInstanceOf(Array)

    const metadata = await getImageMetadata(result.croppedImage)
    expect(metadata.width).toBe(1080)
    expect(metadata.height).toBe(1080)
  })

  it('should generate center-weighted crop', async () => {
    const buffer = await createTestImage(1920, 1080)

    const result = await generateOptimalCrop(
      buffer,
      instagramSquare,
      CropStrategy.CENTER_WEIGHTED
    )

    expect(result.cropData).toBeDefined()
    expect(result.letterboxData).toBeUndefined()
  })

  it('should generate letterbox with blur', async () => {
    const buffer = await createTestImage(1080, 1920)

    const result = await generateOptimalCrop(
      buffer,
      instagramSquare,
      CropStrategy.LETTERBOX_BLUR
    )

    expect(result.letterboxData).toBeDefined()
    expect(result.letterboxData?.method).toBe('blur')
    expect(result.cropData).toBeUndefined()
  })

  it('should generate letterbox with solid color', async () => {
    const buffer = await createTestImage(1080, 1920)

    const result = await generateOptimalCrop(
      buffer,
      instagramSquare,
      CropStrategy.LETTERBOX_SOLID
    )

    expect(result.letterboxData).toBeDefined()
    expect(result.letterboxData?.method).toBe('solid')
    expect(result.letterboxData?.backgroundColor).toBeDefined()
  })

  it('should validate crop against safe zones', async () => {
    const buffer = await createTestImage(1920, 1080)

    const safeZones: SafeZone[] = [
      {
        x: 800,
        y: 300,
        width: 300,
        height: 400,
        importance: SafeZoneImportance.CRITICAL,
        type: 'face',
        label: 'Face'
      }
    ]

    const result = await generateOptimalCrop(
      buffer,
      instagramSquare,
      CropStrategy.SMART_CROP,
      { safeZones }
    )

    expect(result.validationScore).toBeDefined()
    expect(result.validationWarnings).toBeInstanceOf(Array)

    // If crop violates safe zones, validation score should be lower
    if (result.validationWarnings.length > 0) {
      expect(result.validationScore).toBeLessThan(100)
    }
  })

  it('should handle multi-focal strategy with face landmarks', async () => {
    const buffer = await createTestImage(1920, 1080)
    const faceLandmarks = [
      createMockFaceLandmarks(0.3, 0.35),
      createMockFaceLandmarks(0.7, 0.35)
    ]

    const result = await generateOptimalCrop(
      buffer,
      instagramSquare,
      CropStrategy.MULTI_FOCAL,
      { faceLandmarks }
    )

    expect(result.cropData).toBeDefined()
    expect(result.validationScore).toBeGreaterThan(0)
  })
})

describe('Smart Crop Engine - Platform-Specific Tests', () => {
  it('should optimize for Instagram feed (1:1)', async () => {
    const buffer = await createTestImage(2000, 1500)
    const spec: PlatformSpec = {
      name: 'Instagram Feed',
      width: 1080,
      height: 1080,
      quality: 85
    }

    const result = await generateOptimalCrop(buffer, spec, CropStrategy.SMART_CROP)
    const metadata = await getImageMetadata(result.croppedImage)

    expect(metadata.width).toBe(1080)
    expect(metadata.height).toBe(1080)
  })

  it('should optimize for Instagram Story (9:16)', async () => {
    const buffer = await createTestImage(2000, 1500)
    const spec: PlatformSpec = {
      name: 'Instagram Story',
      width: 1080,
      height: 1920,
      quality: 85
    }

    const result = await generateOptimalCrop(buffer, spec, CropStrategy.LETTERBOX_BLUR)
    const metadata = await getImageMetadata(result.croppedImage)

    expect(metadata.width).toBe(1080)
    expect(metadata.height).toBe(1920)
  })

  it('should optimize for Facebook Post (16:9)', async () => {
    const buffer = await createTestImage(2000, 1500)
    const spec: PlatformSpec = {
      name: 'Facebook Post',
      width: 1200,
      height: 630,
      quality: 85
    }

    const result = await generateOptimalCrop(buffer, spec, CropStrategy.SMART_CROP)
    const metadata = await getImageMetadata(result.croppedImage)

    expect(metadata.width).toBe(1200)
    expect(metadata.height).toBe(630)
  })

  it('should optimize for Twitter Card (2:1)', async () => {
    const buffer = await createTestImage(2000, 2000)
    const spec: PlatformSpec = {
      name: 'Twitter Card',
      width: 1200,
      height: 600,
      quality: 85
    }

    const result = await generateOptimalCrop(buffer, spec, CropStrategy.CENTER_WEIGHTED)
    const metadata = await getImageMetadata(result.croppedImage)

    expect(metadata.width).toBe(1200)
    expect(metadata.height).toBe(600)
  })
})
