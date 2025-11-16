/**
 * Real-world usage examples for Smart Cropping Engine
 *
 * These examples demonstrate common use cases and best practices
 * for integrating the smart crop engine into your application.
 */

import {
  generateOptimalCrop,
  aiSmartCrop,
  centerWeightedCrop,
  intelligentLetterbox,
  multiFocalCrop,
  detectSafeZones,
  validateCrop,
  extractDominantColor,
  CropStrategy,
  PlatformSpec,
  SafeZone,
  SafeZoneImportance,
  FocalPoint
} from './index'
import type { FaceLandmarks } from '../mediapipe-face'

// =============================================================================
// Example 1: Basic Instagram Square Crop
// =============================================================================

export async function basicInstagramCrop(imageBuffer: Buffer) {
  const instagramSquare: PlatformSpec = {
    name: 'Instagram Square',
    width: 1080,
    height: 1080,
    quality: 85
  }

  const result = await generateOptimalCrop(
    imageBuffer,
    instagramSquare,
    CropStrategy.SMART_CROP
  )

  return {
    image: result.croppedImage,
    score: result.validationScore,
    warnings: result.validationWarnings
  }
}

// =============================================================================
// Example 2: Face-Aware Portrait Crop
// =============================================================================

export async function faceAwarePortraitCrop(
  imageBuffer: Buffer,
  faceLandmarks: FaceLandmarks[]
) {
  const instagramPortrait: PlatformSpec = {
    name: 'Instagram Portrait',
    width: 1080,
    height: 1350,
    quality: 85
  }

  // Detect safe zones from faces
  const safeZones = await detectSafeZones(imageBuffer, faceLandmarks)

  // Generate AI smart crop
  const result = await generateOptimalCrop(
    imageBuffer,
    instagramPortrait,
    CropStrategy.SMART_CROP,
    { faceLandmarks, safeZones }
  )

  // Check if crop is acceptable
  if (result.validationScore < 80) {
    console.warn('Crop quality is low, using letterbox instead')

    // Fallback to letterbox to preserve entire image
    return generateOptimalCrop(
      imageBuffer,
      instagramPortrait,
      CropStrategy.LETTERBOX_BLUR
    )
  }

  return result
}

// =============================================================================
// Example 3: Multi-Platform Batch Processing
// =============================================================================

export async function generateAllSocialMediaCrops(
  imageBuffer: Buffer,
  faceLandmarks?: FaceLandmarks[]
) {
  const platforms: PlatformSpec[] = [
    // Instagram
    { name: 'Instagram Square', width: 1080, height: 1080, quality: 85 },
    { name: 'Instagram Portrait', width: 1080, height: 1350, quality: 85 },
    { name: 'Instagram Story', width: 1080, height: 1920, quality: 85 },

    // Facebook
    { name: 'Facebook Feed', width: 1200, height: 630, quality: 85 },
    { name: 'Facebook Story', width: 1080, height: 1920, quality: 85 },

    // Twitter
    { name: 'Twitter Card', width: 1200, height: 600, quality: 85 },

    // LinkedIn
    { name: 'LinkedIn Post', width: 1200, height: 627, quality: 85 }
  ]

  const options = faceLandmarks ? { faceLandmarks: [faceLandmarks] } : undefined

  // Process all platforms in parallel
  const results = await Promise.all(
    platforms.map(async (spec) => {
      try {
        const result = await generateOptimalCrop(
          imageBuffer,
          spec,
          CropStrategy.SMART_CROP,
          options
        )

        return {
          platform: spec.name,
          success: true,
          image: result.croppedImage,
          score: result.validationScore,
          warnings: result.validationWarnings
        }
      } catch (error) {
        return {
          platform: spec.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })
  )

  return results
}

// =============================================================================
// Example 4: Smart Story Crop with Letterbox Fallback
// =============================================================================

export async function smartStoryCrop(
  imageBuffer: Buffer,
  faceLandmarks?: FaceLandmarks[]
) {
  const storySpec: PlatformSpec = {
    name: 'Instagram Story',
    width: 1080,
    height: 1920,
    quality: 85
  }

  const options = faceLandmarks ? { faceLandmarks: [faceLandmarks] } : undefined

  // Try smart crop first
  const smartResult = await generateOptimalCrop(
    imageBuffer,
    storySpec,
    CropStrategy.SMART_CROP,
    options
  )

  // If crop cuts off important content, use letterbox
  if (smartResult.validationScore < 70 || smartResult.validationWarnings.length > 0) {
    console.log('Smart crop has issues, using letterbox with blur')

    return generateOptimalCrop(
      imageBuffer,
      storySpec,
      CropStrategy.LETTERBOX_BLUR
    )
  }

  return smartResult
}

// =============================================================================
// Example 5: Group Photo with Multiple Faces
// =============================================================================

export async function groupPhotoCrop(
  imageBuffer: Buffer,
  faceLandmarks: FaceLandmarks[]
) {
  // For group photos, use multi-focal strategy
  const facebookFeed: PlatformSpec = {
    name: 'Facebook Feed',
    width: 1200,
    height: 630,
    quality: 85
  }

  // Convert face landmarks to focal points
  const focalPoints: FocalPoint[] = faceLandmarks.map(landmarks => ({
    x: ((landmarks.leftEye.x + landmarks.rightEye.x) / 2) * 1920, // Assuming 1920px width
    y: ((landmarks.leftEye.y + landmarks.rightEye.y) / 2) * 1080, // Assuming 1080px height
    weight: 1.0
  }))

  const result = await generateOptimalCrop(
    imageBuffer,
    facebookFeed,
    CropStrategy.MULTI_FOCAL,
    { faceLandmarks }
  )

  return result
}

// =============================================================================
// Example 6: Custom Safe Zones (Logo Protection)
// =============================================================================

export async function cropWithLogoProtection(
  imageBuffer: Buffer,
  logoPosition: { x: number; y: number; width: number; height: number },
  faceLandmarks?: FaceLandmarks[]
) {
  const instagramSquare: PlatformSpec = {
    name: 'Instagram Square',
    width: 1080,
    height: 1080,
    quality: 85
  }

  // Create custom safe zone for logo
  const logoSafeZone: SafeZone = {
    x: logoPosition.x,
    y: logoPosition.y,
    width: logoPosition.width,
    height: logoPosition.height,
    importance: SafeZoneImportance.IMPORTANT,
    type: 'custom',
    label: 'Company Logo'
  }

  // Detect face safe zones
  let safeZones = [logoSafeZone]
  if (faceLandmarks) {
    const faceSafeZones = await detectSafeZones(imageBuffer, faceLandmarks)
    safeZones = [...safeZones, ...faceSafeZones]
  }

  const result = await generateOptimalCrop(
    imageBuffer,
    instagramSquare,
    CropStrategy.SMART_CROP,
    { faceLandmarks: faceLandmarks ? [faceLandmarks] : undefined, safeZones }
  )

  // Check if logo is preserved
  const logoViolation = result.validationWarnings.find(w =>
    w.includes('Company Logo')
  )

  if (logoViolation) {
    console.warn('Logo may be cut off:', logoViolation)
  }

  return result
}

// =============================================================================
// Example 7: Adaptive Crop Strategy Selection
// =============================================================================

export async function adaptiveCrop(
  imageBuffer: Buffer,
  targetSpec: PlatformSpec,
  faceLandmarks?: FaceLandmarks[]
) {
  const metadata = await import('./smart-crop').then(m =>
    m.getImageMetadata(imageBuffer)
  )

  const targetAspect = targetSpec.width / targetSpec.height
  const imageAspect = metadata.aspectRatio || 1

  // Choose strategy based on aspect ratio difference
  const aspectDiff = Math.abs(targetAspect - imageAspect) / targetAspect

  let strategy: CropStrategy

  if (aspectDiff < 0.15) {
    // Aspect ratios are similar - use smart crop
    strategy = CropStrategy.SMART_CROP
  } else if (aspectDiff > 0.5) {
    // Aspect ratios are very different - use letterbox
    strategy = CropStrategy.LETTERBOX_BLUR
  } else if (faceLandmarks && faceLandmarks.length > 1) {
    // Multiple faces - use multi-focal
    strategy = CropStrategy.MULTI_FOCAL
  } else {
    // Default to smart crop
    strategy = CropStrategy.SMART_CROP
  }

  console.log(`Selected strategy: ${strategy} (aspect diff: ${(aspectDiff * 100).toFixed(1)}%)`)

  return generateOptimalCrop(
    imageBuffer,
    targetSpec,
    strategy,
    faceLandmarks ? { faceLandmarks: [faceLandmarks] } : undefined
  )
}

// =============================================================================
// Example 8: Cinematic Letterbox for Stories
// =============================================================================

export async function cinematicStory(imageBuffer: Buffer) {
  const storySpec: PlatformSpec = {
    name: 'Instagram Story',
    width: 1080,
    height: 1920,
    quality: 90 // Higher quality for cinematic effect
  }

  // Extract dominant color for artistic letterbox
  const dominantColor = await extractDominantColor(imageBuffer)
  console.log(`Dominant color: ${dominantColor}`)

  // Use solid color letterbox
  const result = await generateOptimalCrop(
    imageBuffer,
    storySpec,
    CropStrategy.LETTERBOX_SOLID
  )

  return {
    image: result.croppedImage,
    backgroundColor: result.letterboxData?.backgroundColor,
    metadata: result.metadata
  }
}

// =============================================================================
// Example 9: Validation-First Approach
// =============================================================================

export async function validateBeforeCrop(
  imageBuffer: Buffer,
  targetSpec: PlatformSpec,
  faceLandmarks: FaceLandmarks[]
) {
  // First, detect all safe zones
  const safeZones = await detectSafeZones(imageBuffer, faceLandmarks)

  // Generate a few crop candidates
  const candidates = await Promise.all([
    aiSmartCrop(imageBuffer, targetSpec.width, targetSpec.height, {
      faceLandmarks,
      safeZones
    }),
    centerWeightedCrop(imageBuffer, targetSpec.width, targetSpec.height)
  ])

  // Choose the best candidate based on score
  candidates.sort((a, b) => b.score - a.score)
  const bestCrop = candidates[0]

  console.log(`Best crop score: ${bestCrop.score}`)

  return bestCrop
}

// =============================================================================
// Example 10: Progressive Enhancement Pattern
// =============================================================================

export async function progressiveEnhancement(
  imageBuffer: Buffer,
  targetSpec: PlatformSpec,
  faceLandmarks?: FaceLandmarks[]
) {
  try {
    // Level 1: Try AI smart crop with face detection
    if (faceLandmarks) {
      const result = await generateOptimalCrop(
        imageBuffer,
        targetSpec,
        CropStrategy.SMART_CROP,
        { faceLandmarks: [faceLandmarks] }
      )

      if (result.validationScore >= 80) {
        return { ...result, method: 'ai-smart-crop' }
      }
    }

    // Level 2: Try center-weighted crop
    const centerResult = await generateOptimalCrop(
      imageBuffer,
      targetSpec,
      CropStrategy.CENTER_WEIGHTED
    )

    if (centerResult.validationScore >= 70) {
      return { ...centerResult, method: 'center-weighted' }
    }

    // Level 3: Fallback to letterbox (always works)
    const letterboxResult = await generateOptimalCrop(
      imageBuffer,
      targetSpec,
      CropStrategy.LETTERBOX_BLUR
    )

    return { ...letterboxResult, method: 'letterbox' }

  } catch (error) {
    console.error('All crop strategies failed:', error)
    throw new Error('Unable to generate crop')
  }
}

// =============================================================================
// Example 11: Server-Side API Handler Pattern
// =============================================================================

export async function handleCropRequest(
  imageUrl: string,
  platformName: string,
  strategy?: string,
  faceLandmarks?: FaceLandmarks[]
) {
  // This would be used in a Next.js API route

  // 1. Fetch image
  const response = await fetch(imageUrl)
  const arrayBuffer = await response.arrayBuffer()
  const imageBuffer = Buffer.from(arrayBuffer)

  // 2. Define platform specs
  const platformSpecs: Record<string, PlatformSpec> = {
    'instagram-square': { name: 'Instagram Square', width: 1080, height: 1080, quality: 85 },
    'instagram-story': { name: 'Instagram Story', width: 1080, height: 1920, quality: 85 },
    'facebook-feed': { name: 'Facebook Feed', width: 1200, height: 630, quality: 85 }
  }

  const spec = platformSpecs[platformName]
  if (!spec) {
    throw new Error(`Unknown platform: ${platformName}`)
  }

  // 3. Choose strategy
  const cropStrategy = strategy as CropStrategy || CropStrategy.SMART_CROP

  // 4. Generate crop
  const result = await generateOptimalCrop(
    imageBuffer,
    spec,
    cropStrategy,
    faceLandmarks ? { faceLandmarks: [faceLandmarks] } : undefined
  )

  // 5. Return result
  return {
    success: true,
    image: result.croppedImage.toString('base64'),
    validationScore: result.validationScore,
    warnings: result.validationWarnings,
    cropData: result.cropData,
    letterboxData: result.letterboxData
  }
}
