/**
 * Hero Arch Slideshow Type Definitions
 *
 * Defines the configuration schema for the hero arch slideshow system
 * which supports multiple transition effects, auto-advance, and scroll/swipe navigation.
 */

// ============================================
// Image Configuration
// ============================================

export interface SlideshowImage {
  id: string
  assetId: string
  url: string
  fileName: string
  position: { x: number; y: number }  // Object position (0-100%)
  objectFit: 'cover' | 'contain'
  // Optional per-image Ken Burns settings (overrides global)
  kenBurns?: KenBurnsConfig
}

export interface KenBurnsConfig {
  enabled: boolean
  startScale: number           // e.g., 1.0
  endScale: number             // e.g., 1.15
  startPosition: { x: number; y: number }  // 0-100%
  endPosition: { x: number; y: number }    // 0-100%
}

// ============================================
// Transition Configuration
// ============================================

export type TransitionType =
  | 'fade'           // Simple crossfade
  | 'slide'          // Horizontal slide
  | 'slideUp'        // Vertical slide up
  | 'slideDown'      // Vertical slide down
  | 'kenBurns'       // Zoom/pan with fade
  | 'zoom'           // Zoom in/out
  | 'blur'           // Blur transition
  | 'wipeLeft'       // Wipe from right to left
  | 'wipeRight'      // Wipe from left to right
  | 'wipeUp'         // Wipe from bottom to top
  | 'wipeDown'       // Wipe from top to bottom
  | 'circleReveal'   // Circular reveal from center
  | 'pixelate'       // Pixelate dissolve
  | 'ripple'         // Ripple/wave effect (WebGL)
  | 'morph'          // Image morph (WebGL)
  | 'crosswarp'      // Crosswarp distortion (WebGL)
  | 'directionalWarp'// Directional warp (WebGL)
  | 'glitch'         // Glitch effect (WebGL)
  | 'cube'           // 3D cube rotation (WebGL)

// Transitions that require WebGL
export const WEBGL_TRANSITIONS: TransitionType[] = [
  'ripple',
  'morph',
  'crosswarp',
  'directionalWarp',
  'glitch',
  'cube'
]

// CSS/GSAP based transitions (don't require WebGL)
export const CSS_TRANSITIONS: TransitionType[] = [
  'fade',
  'slide',
  'slideUp',
  'slideDown',
  'kenBurns',
  'zoom',
  'blur',
  'wipeLeft',
  'wipeRight',
  'wipeUp',
  'wipeDown',
  'circleReveal',
  'pixelate'
]

export type EasingType =
  | 'linear'
  | 'ease'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeInExpo'
  | 'easeOutExpo'
  | 'easeInOutExpo'

export interface TransitionConfig {
  type: TransitionType
  duration: number              // ms (300-5000 typical)
  easing: EasingType
  // WebGL-specific parameters
  webglParams?: {
    intensity?: number         // 0-1, effect intensity
    direction?: number         // 0-360, direction angle
    columns?: number           // For pixelate effect
    amplitude?: number         // For ripple/wave
    frequency?: number         // For ripple/wave
  }
}

// ============================================
// Timing Configuration
// ============================================

export interface TimingConfig {
  autoAdvance: boolean
  interval: number              // ms between slides (2000-15000 typical)
  pauseOnHover: boolean
  pauseOnInteraction: boolean   // Pause when user scrolls/swipes
  resumeDelay: number           // ms before resuming after interaction (500-3000)
  startDelay: number            // ms delay before first auto-advance (0-5000)
}

// ============================================
// Navigation Configuration
// ============================================

export interface NavigationConfig {
  scrollEnabled: boolean        // Respond to scroll wheel
  swipeEnabled: boolean         // Respond to touch swipe
  dragEnabled: boolean          // Respond to mouse drag
  scrollSensitivity: number     // 0.5-2.0, affects scroll speed
  snapBehavior: 'immediate' | 'momentum'  // Snap immediately or with momentum
  looping: boolean              // Loop back to start
  // Visual indicators
  showIndicators: boolean       // Dot indicators
  indicatorPosition: 'bottom' | 'bottomLeft' | 'bottomRight' | 'side' | 'hidden'
  indicatorStyle: 'dots' | 'lines' | 'numbers'
}

// ============================================
// Complete Preset Configuration
// ============================================

export interface SlideshowPreset {
  id: string                    // UUID
  name: string                  // User-friendly name
  description?: string          // Optional description
  images: SlideshowImage[]
  transition: TransitionConfig
  timing: TimingConfig
  navigation: NavigationConfig
  // Global Ken Burns (applies to all images unless overridden)
  globalKenBurns?: KenBurnsConfig
  createdAt: string
  updatedAt: string
}

// ============================================
// Device Assignments
// ============================================

export interface SlideshowAssignments {
  desktop: string | null        // Preset ID or null (uses single image fallback)
  mobile: string | null         // Preset ID or null
  // If true, mobile uses same preset as desktop
  mobileSameAsDesktop: boolean
}

// ============================================
// API Response Types
// ============================================

export interface SlideshowPresetsResponse {
  presets: SlideshowPreset[]
}

export interface SlideshowAssignmentsResponse {
  assignments: SlideshowAssignments
}

// ============================================
// Default Values
// ============================================

export const DEFAULT_TRANSITION: TransitionConfig = {
  type: 'fade',
  duration: 1000,
  easing: 'easeInOut'
}

export const DEFAULT_TIMING: TimingConfig = {
  autoAdvance: true,
  interval: 5000,
  pauseOnHover: true,
  pauseOnInteraction: true,
  resumeDelay: 2000,
  startDelay: 1000
}

export const DEFAULT_NAVIGATION: NavigationConfig = {
  scrollEnabled: true,
  swipeEnabled: true,
  dragEnabled: false,
  scrollSensitivity: 1.0,
  snapBehavior: 'immediate',
  looping: true,
  showIndicators: false,
  indicatorPosition: 'hidden',
  indicatorStyle: 'dots'
}

export const DEFAULT_KEN_BURNS: KenBurnsConfig = {
  enabled: false,
  startScale: 1.0,
  endScale: 1.08,
  startPosition: { x: 50, y: 50 },
  endPosition: { x: 50, y: 50 }
}

export const DEFAULT_ASSIGNMENTS: SlideshowAssignments = {
  desktop: null,
  mobile: null,
  mobileSameAsDesktop: true
}

// ============================================
// Helper Functions
// ============================================

export function isWebGLTransition(type: TransitionType): boolean {
  return WEBGL_TRANSITIONS.includes(type)
}

export function createDefaultPreset(name: string): Omit<SlideshowPreset, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name,
    images: [],
    transition: { ...DEFAULT_TRANSITION },
    timing: { ...DEFAULT_TIMING },
    navigation: { ...DEFAULT_NAVIGATION }
  }
}

// Transition metadata for admin UI
export const TRANSITION_META: Record<TransitionType, {
  name: string
  description: string
  category: 'basic' | 'slide' | 'reveal' | 'webgl'
  requiresWebGL: boolean
}> = {
  fade: { name: 'Fade', description: 'Simple crossfade', category: 'basic', requiresWebGL: false },
  slide: { name: 'Slide', description: 'Horizontal slide', category: 'slide', requiresWebGL: false },
  slideUp: { name: 'Slide Up', description: 'Vertical slide up', category: 'slide', requiresWebGL: false },
  slideDown: { name: 'Slide Down', description: 'Vertical slide down', category: 'slide', requiresWebGL: false },
  kenBurns: { name: 'Ken Burns', description: 'Zoom & pan with fade', category: 'basic', requiresWebGL: false },
  zoom: { name: 'Zoom', description: 'Zoom in/out transition', category: 'basic', requiresWebGL: false },
  blur: { name: 'Blur', description: 'Blur transition', category: 'basic', requiresWebGL: false },
  wipeLeft: { name: 'Wipe Left', description: 'Wipe from right to left', category: 'reveal', requiresWebGL: false },
  wipeRight: { name: 'Wipe Right', description: 'Wipe from left to right', category: 'reveal', requiresWebGL: false },
  wipeUp: { name: 'Wipe Up', description: 'Wipe from bottom to top', category: 'reveal', requiresWebGL: false },
  wipeDown: { name: 'Wipe Down', description: 'Wipe from top to bottom', category: 'reveal', requiresWebGL: false },
  circleReveal: { name: 'Circle Reveal', description: 'Circular reveal from center', category: 'reveal', requiresWebGL: false },
  pixelate: { name: 'Pixelate', description: 'Pixelated dissolve', category: 'reveal', requiresWebGL: false },
  ripple: { name: 'Ripple', description: 'Ripple/wave effect', category: 'webgl', requiresWebGL: true },
  morph: { name: 'Morph', description: 'Image morphing', category: 'webgl', requiresWebGL: true },
  crosswarp: { name: 'Crosswarp', description: 'Crosswarp distortion', category: 'webgl', requiresWebGL: true },
  directionalWarp: { name: 'Directional Warp', description: 'Directional warp effect', category: 'webgl', requiresWebGL: true },
  glitch: { name: 'Glitch', description: 'Digital glitch effect', category: 'webgl', requiresWebGL: true },
  cube: { name: '3D Cube', description: '3D cube rotation', category: 'webgl', requiresWebGL: true },
}
