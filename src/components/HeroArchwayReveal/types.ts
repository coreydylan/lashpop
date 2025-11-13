/**
 * Types for the Hero Archway Reveal component
 */

export interface GridImage {
  id: string
  url: string
  aspectRatio: number
  isKeyImage: boolean
  alt: string
  width: number
  height: number
}

export interface ScrollPhase {
  name: string
  start: number // 0-1
  end: number // 0-1
}

export const SCROLL_PHASES: Record<string, ScrollPhase> = {
  HERO_VISIBLE: {
    name: 'hero-visible',
    start: 0,
    end: 0.2,
  },
  ARCHWAY_EXPAND: {
    name: 'archway-expand',
    start: 0.2,
    end: 0.4,
  },
  GRID_REVEALED: {
    name: 'grid-revealed',
    start: 0.4,
    end: 0.4,
  },
  GRID_SCROLL: {
    name: 'grid-scroll',
    start: 0.4,
    end: 0.7,
  },
  TRANSITION_OUT: {
    name: 'transition-out',
    start: 0.7,
    end: 1.0,
  },
}

export interface MosaicLayoutConfig {
  columns: {
    mobile: number
    tablet: number
    desktop: number
    ultrawide: number
  }
  gap: number
  scrollHeight: string
}

export const DEFAULT_LAYOUT_CONFIG: MosaicLayoutConfig = {
  columns: {
    mobile: 2,
    tablet: 3,
    desktop: 5,
    ultrawide: 7,
  },
  gap: 0, // Edge-to-edge
  scrollHeight: '100vh',
}

export interface AnimationConfig {
  easing: number[] // Bezier curve
  duration: number // seconds
}

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  easing: [0.43, 0.13, 0.23, 0.96], // Custom soft easing
  duration: 1.2,
}
