/**
 * Animation configurations for the Hero Archway Reveal
 */

import { DEFAULT_ANIMATION_CONFIG } from '../types'

export const ARCHWAY_ANIMATION = {
  easing: DEFAULT_ANIMATION_CONFIG.easing,
  duration: DEFAULT_ANIMATION_CONFIG.duration,

  // Border radius animation: archway shape -> rectangle
  borderRadius: {
    from: '200px 200px 0 0',
    to: '0px 0px 0 0',
  },

  // Scale animation for expansion
  scale: {
    from: 0.85,
    to: 1.0,
  },
}

export const HERO_ANIMATION = {
  easing: DEFAULT_ANIMATION_CONFIG.easing,

  // Hero scroll away
  translateY: {
    from: 0,
    to: -100, // Move up by 100vh
  },

  // Fade out
  opacity: {
    from: 1,
    to: 0,
  },
}

export const GRID_ANIMATION = {
  easing: DEFAULT_ANIMATION_CONFIG.easing,

  // Grid reveal (stays fixed, hero moves over it)
  // No animation needed for reveal, just positioning

  // Grid scroll through
  scrollHeight: '100vh',

  // Grid transition out
  fadeOut: {
    from: 1,
    to: 0,
  },

  // Optional parallax for individual images
  parallaxStrength: 0.05, // Subtle parallax
}

export const TRANSITION_ANIMATION = {
  easing: DEFAULT_ANIMATION_CONFIG.easing,

  // Next section slide in
  slideIn: {
    from: 100,
    to: 0,
  },
}
