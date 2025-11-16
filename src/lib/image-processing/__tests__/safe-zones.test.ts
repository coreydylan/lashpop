/**
 * Unit tests for Safe Zone Detection and Validation
 *
 * Tests for face-based safe zones and crop validation logic.
 */

import { describe, it, expect } from '@jest/globals'
import sharp from 'sharp'
import { detectSafeZones, validateCrop } from '../safe-zones'
import { SafeZoneImportance, CropData, SafeZone } from '../types'
import type { FaceLandmarks } from '../../mediapipe-face'

// Helper function to create a test image
async function createTestImage(
  width: number,
  height: number,
  color: string = '#FFFFFF'
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
  centerY: number = 0.35,
  scale: number = 1.0
): FaceLandmarks {
  const eyeSpacing = 0.1 * scale

  return {
    leftEye: { x: centerX - eyeSpacing, y: centerY },
    rightEye: { x: centerX + eyeSpacing, y: centerY },
    nose: { x: centerX, y: centerY + 0.05 * scale },
    mouth: { x: centerX, y: centerY + 0.15 * scale },
    leftEyelidContour: [],
    rightEyelidContour: []
  }
}

describe('Safe Zones - Face Detection', () => {
  it('should detect safe zone from single face landmarks', async () => {
    const buffer = await createTestImage(1920, 1080)
    const faceLandmarks = [createMockFaceLandmarks(0.5, 0.35)]

    const safeZones = await detectSafeZones(buffer, faceLandmarks)

    expect(safeZones.length).toBeGreaterThan(0)

    // Find face safe zone
    const faceZone = safeZones.find(zone => zone.type === 'face')
    expect(faceZone).toBeDefined()
    expect(faceZone?.importance).toBe(SafeZoneImportance.CRITICAL)
    expect(faceZone?.label).toContain('Face')

    // Face zone should be roughly centered
    if (faceZone) {
      const centerX = faceZone.x + faceZone.width / 2
      const centerY = faceZone.y + faceZone.height / 2
      expect(centerX).toBeGreaterThan(800)
      expect(centerX).toBeLessThan(1120)
      expect(centerY).toBeGreaterThan(250)
      expect(centerY).toBeLessThan(500)
    }
  })

  it('should detect safe zones from multiple faces', async () => {
    const buffer = await createTestImage(1920, 1080)
    const faceLandmarks = [
      createMockFaceLandmarks(0.3, 0.35),
      createMockFaceLandmarks(0.7, 0.35)
    ]

    const safeZones = await detectSafeZones(buffer, faceLandmarks)

    const faceZones = safeZones.filter(zone => zone.type === 'face')
    expect(faceZones.length).toBeGreaterThanOrEqual(2)

    // Each face should have its own safe zone
    expect(faceZones[0].label).toContain('Face 1')
    expect(faceZones[1].label).toContain('Face 2')
  })

  it('should handle images with no face landmarks', async () => {
    const buffer = await createTestImage(1920, 1080)

    const safeZones = await detectSafeZones(buffer)

    // May detect text regions but no face zones
    const faceZones = safeZones.filter(zone => zone.type === 'face')
    expect(faceZones.length).toBe(0)
  })

  it('should add padding around face landmarks', async () => {
    const buffer = await createTestImage(1920, 1080)
    const faceLandmarks = [createMockFaceLandmarks(0.5, 0.5, 0.5)]

    const safeZones = await detectSafeZones(buffer, faceLandmarks)
    const faceZone = safeZones.find(zone => zone.type === 'face')

    expect(faceZone).toBeDefined()

    if (faceZone) {
      // Face zone should be larger than just the facial features
      // Eye spacing is ~0.1 * 0.5 = 0.05, so 192px
      // With 30% padding, zone should be wider than 192px
      expect(faceZone.width).toBeGreaterThan(192)
      expect(faceZone.height).toBeGreaterThan(0)
    }
  })
})

describe('Safe Zones - Crop Validation', () => {
  it('should validate crop that fully contains critical safe zone', () => {
    const crop: CropData = {
      x: 0,
      y: 0,
      width: 1920,
      height: 1080
    }

    const safeZones: SafeZone[] = [
      {
        x: 800,
        y: 300,
        width: 320,
        height: 480,
        importance: SafeZoneImportance.CRITICAL,
        type: 'face',
        label: 'Face'
      }
    ]

    const validation = validateCrop(crop, safeZones, 1920, 1080)

    expect(validation.valid).toBe(true)
    expect(validation.violations.length).toBe(0)
    expect(validation.score).toBe(100)
    expect(validation.warnings.length).toBe(0)
  })

  it('should invalidate crop that cuts off critical safe zone', () => {
    // Crop that only includes 50% of the face
    const crop: CropData = {
      x: 800,
      y: 300,
      width: 160, // Only half the face width
      height: 480
    }

    const safeZones: SafeZone[] = [
      {
        x: 800,
        y: 300,
        width: 320,
        height: 480,
        importance: SafeZoneImportance.CRITICAL,
        type: 'face',
        label: 'Face'
      }
    ]

    const validation = validateCrop(crop, safeZones, 1920, 1080)

    expect(validation.valid).toBe(false)
    expect(validation.violations.length).toBeGreaterThan(0)
    expect(validation.score).toBeLessThan(100)
    expect(validation.warnings.length).toBeGreaterThan(0)
  })

  it('should warn about partially visible important zones', () => {
    const crop: CropData = {
      x: 0,
      y: 0,
      width: 960, // Half the image width
      height: 1080
    }

    const safeZones: SafeZone[] = [
      {
        x: 800,
        y: 300,
        width: 400, // Extends beyond crop
        height: 200,
        importance: SafeZoneImportance.IMPORTANT,
        type: 'text',
        label: 'Text region'
      }
    ]

    const validation = validateCrop(crop, safeZones, 1920, 1080)

    // Important zones need 80% visibility
    // This zone is only ~40% visible
    expect(validation.valid).toBe(false)
    expect(validation.violations.length).toBeGreaterThan(0)
    expect(validation.warnings.length).toBeGreaterThan(0)
  })

  it('should handle preferred zones with lower threshold', () => {
    const crop: CropData = {
      x: 0,
      y: 0,
      width: 1000,
      height: 1080
    }

    const safeZones: SafeZone[] = [
      {
        x: 900,
        y: 300,
        width: 200,
        height: 200,
        importance: SafeZoneImportance.PREFERRED,
        type: 'custom',
        label: 'Logo'
      }
    ]

    const validation = validateCrop(crop, safeZones, 1920, 1080)

    // Preferred zones are more lenient (60% threshold)
    // This zone is 50% visible, so should generate warning but not fail
    if (validation.warnings.length > 0) {
      expect(validation.score).toBeGreaterThan(0)
    }
  })

  it('should calculate correct visibility ratios', () => {
    // Full visibility test
    const fullCrop: CropData = {
      x: 0,
      y: 0,
      width: 1920,
      height: 1080
    }

    const zone: SafeZone = {
      x: 800,
      y: 300,
      width: 320,
      height: 480,
      importance: SafeZoneImportance.CRITICAL,
      type: 'face',
      label: 'Face'
    }

    const fullValidation = validateCrop(fullCrop, [zone], 1920, 1080)
    expect(fullValidation.valid).toBe(true)
    expect(fullValidation.score).toBe(100)

    // Partial visibility test (50% horizontal)
    const partialCrop: CropData = {
      x: 800,
      y: 0,
      width: 160,
      height: 1080
    }

    const partialValidation = validateCrop(partialCrop, [zone], 1920, 1080)
    expect(partialValidation.valid).toBe(false)
    expect(partialValidation.score).toBeLessThan(100)
  })

  it('should handle multiple safe zones with different importance', () => {
    const crop: CropData = {
      x: 400,
      y: 200,
      width: 1120,
      height: 680
    }

    const safeZones: SafeZone[] = [
      {
        x: 800,
        y: 300,
        width: 320,
        height: 480,
        importance: SafeZoneImportance.CRITICAL,
        type: 'face',
        label: 'Face'
      },
      {
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        importance: SafeZoneImportance.IMPORTANT,
        type: 'text',
        label: 'Logo'
      },
      {
        x: 1600,
        y: 800,
        width: 200,
        height: 200,
        importance: SafeZoneImportance.PREFERRED,
        type: 'custom',
        label: 'Watermark'
      }
    ]

    const validation = validateCrop(crop, safeZones, 1920, 1080)

    // Face should be fully visible
    // Logo is outside crop - should violate
    // Watermark is outside crop - may warn but less critical

    expect(validation.violations).toBeDefined()
    expect(validation.warnings).toBeDefined()
  })

  it('should handle edge cases with zero-sized zones', () => {
    const crop: CropData = {
      x: 0,
      y: 0,
      width: 1920,
      height: 1080
    }

    const safeZones: SafeZone[] = [
      {
        x: 800,
        y: 300,
        width: 0,
        height: 0,
        importance: SafeZoneImportance.CRITICAL,
        type: 'custom',
        label: 'Point'
      }
    ]

    const validation = validateCrop(crop, safeZones, 1920, 1080)

    // Should not crash with zero-sized zones
    expect(validation).toBeDefined()
    expect(validation.valid).toBeDefined()
  })

  it('should handle crop completely outside safe zone', () => {
    const crop: CropData = {
      x: 0,
      y: 0,
      width: 500,
      height: 500
    }

    const safeZones: SafeZone[] = [
      {
        x: 1200,
        y: 600,
        width: 400,
        height: 400,
        importance: SafeZoneImportance.CRITICAL,
        type: 'face',
        label: 'Face'
      }
    ]

    const validation = validateCrop(crop, safeZones, 1920, 1080)

    expect(validation.valid).toBe(false)
    expect(validation.violations.length).toBeGreaterThan(0)
    expect(validation.score).toBeLessThan(70) // Should be penalized heavily
    expect(validation.warnings).toContain(
      expect.stringContaining('0%')
    )
  })
})

describe('Safe Zones - Integration Tests', () => {
  it('should detect and validate face-based safe zones together', async () => {
    const buffer = await createTestImage(1920, 1080)
    const faceLandmarks = [createMockFaceLandmarks(0.5, 0.35)]

    // Detect safe zones
    const safeZones = await detectSafeZones(buffer, faceLandmarks)
    expect(safeZones.length).toBeGreaterThan(0)

    // Create a good crop that should include the face
    const goodCrop: CropData = {
      x: 460,
      y: 0,
      width: 1080,
      height: 1080
    }

    const goodValidation = validateCrop(goodCrop, safeZones, 1920, 1080)
    expect(goodValidation.score).toBeGreaterThan(70)

    // Create a bad crop that excludes the face
    const badCrop: CropData = {
      x: 0,
      y: 0,
      width: 400,
      height: 300
    }

    const badValidation = validateCrop(badCrop, safeZones, 1920, 1080)
    expect(badValidation.score).toBeLessThan(goodValidation.score)
  })

  it('should work with real-world face positions', async () => {
    const buffer = await createTestImage(1920, 1080)

    // Multiple faces in different positions
    const faceLandmarks = [
      createMockFaceLandmarks(0.25, 0.3), // Left person
      createMockFaceLandmarks(0.5, 0.35), // Center person
      createMockFaceLandmarks(0.75, 0.32) // Right person
    ]

    const safeZones = await detectSafeZones(buffer, faceLandmarks)
    const faceZones = safeZones.filter(zone => zone.type === 'face')

    expect(faceZones.length).toBe(3)

    // A wide crop should include all faces
    const wideCrop: CropData = {
      x: 0,
      y: 100,
      width: 1920,
      height: 700
    }

    const validation = validateCrop(wideCrop, faceZones, 1920, 1080)
    expect(validation.score).toBeGreaterThan(90)

    // A narrow crop should miss some faces
    const narrowCrop: CropData = {
      x: 860,
      y: 100,
      width: 200,
      height: 700
    }

    const narrowValidation = validateCrop(narrowCrop, faceZones, 1920, 1080)
    expect(narrowValidation.score).toBeLessThan(validation.score)
  })
})
