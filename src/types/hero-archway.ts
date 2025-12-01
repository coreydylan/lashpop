/**
 * Hero Archway Configuration Types
 * Defines the structure for managing hero section archway images and animations
 */

// Animation easing presets
export type AnimationEasing =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'power1.out'
  | 'power2.out'
  | 'power3.out'
  | 'power4.out'
  | 'back.out'
  | 'elastic.out'

// Animation type options
export type AnimationType =
  | 'pan-zoom'      // Classic pan and zoom effect
  | 'zoom-only'     // Zoom in/out only
  | 'pan-only'      // Pan horizontally/vertically only
  | 'fade-in'       // Simple fade in
  | 'parallax'      // Scroll-based parallax
  | 'none'          // No animation

// Object fit options
export type ObjectFitType = 'cover' | 'contain' | 'fill'

// Individual image configuration
export interface HeroArchwayImage {
  id: string
  assetId: string
  url: string
  fileName: string
  alt?: string
  width?: number
  height?: number
  // Position settings
  position: {
    x: number  // 0-100 percentage
    y: number  // 0-100 percentage
  }
  objectFit: ObjectFitType
  // Weight for random selection (higher = more likely)
  weight: number
  // Whether this image is active
  enabled: boolean
}

// Initial load animation settings
export interface InitialAnimation {
  type: AnimationType
  duration: number  // in seconds
  easing: AnimationEasing
  // Scale settings
  startScale: number
  endScale: number
  // Pan settings (percentage of image)
  startX: number
  endX: number
  startY: number
  endY: number
}

// Scroll-triggered animation settings
export interface ScrollAnimation {
  enabled: boolean
  // Scroll trigger anchors
  triggerStart: string  // e.g., "top center", "bottom bottom"
  triggerEnd: string    // e.g., "bottom top", "+=500"
  // Scrub intensity (0-5, where 1 = smooth)
  scrubIntensity: number
  // Pin the container during scroll
  pin: boolean
  pinSpacing: boolean
  // Animation values
  endX: number  // xPercent at end of scroll
  endScale: number
  // Fade out overlay
  fadeOverlay: boolean
  fadeStart: number  // scroll position to start fade
  fadeEnd: number    // scroll position to end fade
}

// Device-specific variant settings
export interface DeviceVariant {
  images: HeroArchwayImage[]
  initialAnimation: InitialAnimation
  scrollAnimation: ScrollAnimation
  // Arch styling
  archBorderRadius: string  // e.g., "200px 200px 0 0" or "clamp(120px, 40vw, 190px)"
  archHeight: string        // e.g., "85vh", "100dvh"
  // Overlay gradient
  overlayGradient?: string
}

// Complete hero archway configuration
export interface HeroArchwayConfig {
  // Whether the section is enabled
  enabled: boolean

  // Desktop configuration
  desktop: DeviceVariant

  // Mobile configuration
  mobile: DeviceVariant

  // Random image selection mode
  randomMode: 'per-page-load' | 'per-session' | 'time-based' | 'disabled'

  // Time-based rotation interval (in minutes, if mode is 'time-based')
  rotationInterval?: number

  // Last updated timestamp
  updatedAt?: string
}

// Default configuration values
export const defaultInitialAnimation: InitialAnimation = {
  type: 'pan-zoom',
  duration: 4,
  easing: 'power2.out',
  startScale: 1.4,
  endScale: 1.2,
  startX: 0,
  endX: 20,
  startY: 0,
  endY: 0
}

export const defaultScrollAnimation: ScrollAnimation = {
  enabled: true,
  triggerStart: 'top center',
  triggerEnd: 'bottom top',
  scrubIntensity: 1,
  pin: true,
  pinSpacing: false,
  endX: 25,
  endScale: 1.2,
  fadeOverlay: true,
  fadeStart: 100,
  fadeEnd: 600
}

export const defaultDesktopVariant: DeviceVariant = {
  images: [],
  initialAnimation: defaultInitialAnimation,
  scrollAnimation: defaultScrollAnimation,
  archBorderRadius: '200px 200px 0 0',
  archHeight: '85vh',
  overlayGradient: 'linear-gradient(to top, rgba(184, 200, 190, 0.2) 0%, transparent 100%)'
}

export const defaultMobileVariant: DeviceVariant = {
  images: [],
  initialAnimation: {
    ...defaultInitialAnimation,
    type: 'zoom-only',
    duration: 0,
    startScale: 1,
    endScale: 1
  },
  scrollAnimation: {
    ...defaultScrollAnimation,
    enabled: false,
    pin: false
  },
  archBorderRadius: 'clamp(120px, 40vw, 190px) clamp(120px, 40vw, 190px) 0 0',
  archHeight: '100dvh',
  overlayGradient: undefined
}

export const defaultHeroArchwayConfig: HeroArchwayConfig = {
  enabled: true,
  desktop: defaultDesktopVariant,
  mobile: defaultMobileVariant,
  randomMode: 'per-page-load',
  rotationInterval: 60
}

// Helper function to get a random image from the bank based on weights
export function getRandomImage(images: HeroArchwayImage[]): HeroArchwayImage | null {
  const enabledImages = images.filter(img => img.enabled)
  if (enabledImages.length === 0) return null
  if (enabledImages.length === 1) return enabledImages[0]

  // Calculate total weight
  const totalWeight = enabledImages.reduce((sum, img) => sum + img.weight, 0)

  // Get random value
  let random = Math.random() * totalWeight

  // Find the image based on weighted probability
  for (const image of enabledImages) {
    random -= image.weight
    if (random <= 0) return image
  }

  // Fallback to first image
  return enabledImages[0]
}

// Helper to create a new image entry
export function createNewHeroImage(assetId: string, url: string, fileName: string): HeroArchwayImage {
  return {
    id: crypto.randomUUID(),
    assetId,
    url,
    fileName,
    position: { x: 50, y: 50 },
    objectFit: 'cover',
    weight: 1,
    enabled: true
  }
}
