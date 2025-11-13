/**
 * Utility functions for the Hero Archway Reveal component
 */

import type { GridImage, MosaicLayoutConfig } from './types'

/**
 * Calculate the optimal column count based on viewport width
 */
export function getColumnCount(width: number, config: MosaicLayoutConfig): number {
  if (width < 640) return config.columns.mobile
  if (width < 1024) return config.columns.tablet
  if (width < 1920) return config.columns.desktop
  return config.columns.ultrawide
}

/**
 * Calculate grid item positions to ensure key image is centered
 * This ensures the archway reveals the key image perfectly
 */
export function calculateGridLayout(
  images: GridImage[],
  columnCount: number,
  containerWidth: number
) {
  const keyImage = images.find((img) => img.isKeyImage)
  const otherImages = images.filter((img) => !img.isKeyImage)

  // Calculate column width
  const columnWidth = containerWidth / columnCount

  // Position key image in the center (or golden ratio position)
  const keyImageColumn = Math.floor(columnCount / 2)

  // Build layout array
  const layout: Array<{
    image: GridImage
    column: number
    row: number
    width: number
    height: number
  }> = []

  if (keyImage) {
    // Place key image first
    const height = columnWidth / keyImage.aspectRatio
    layout.push({
      image: keyImage,
      column: keyImageColumn,
      row: 0,
      width: columnWidth,
      height,
    })
  }

  // Place other images using a simple grid-auto-flow: dense algorithm
  const columnHeights = new Array(columnCount).fill(0)

  // Initialize key image column height
  if (keyImage) {
    columnHeights[keyImageColumn] = columnWidth / keyImage.aspectRatio
  }

  otherImages.forEach((image) => {
    // Find shortest column
    const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
    const row = Math.floor(columnHeights[shortestColumnIndex] / (containerWidth / columnCount))

    const height = columnWidth / image.aspectRatio
    layout.push({
      image,
      column: shortestColumnIndex,
      row,
      width: columnWidth,
      height,
    })

    // Update column height
    columnHeights[shortestColumnIndex] += height
  })

  return {
    layout,
    totalHeight: Math.max(...columnHeights),
  }
}

/**
 * Get the scroll phase based on progress (0-1)
 */
export function getCurrentPhase(progress: number): string {
  if (progress < 0.2) return 'hero-visible'
  if (progress < 0.4) return 'archway-expand'
  if (progress < 0.7) return 'grid-scroll'
  return 'transition-out'
}

/**
 * Map scroll progress to a specific range
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Get archway center coordinates
 * These should align with the HeroSection archway position
 */
export function getArchwayCenterCoordinates(containerWidth: number, containerHeight: number) {
  // Assuming the archway is centered horizontally and positioned at 50% vertically
  return {
    x: containerWidth / 2,
    y: containerHeight * 0.5, // Adjust based on actual hero layout
  }
}

/**
 * Calculate key image position to align with archway
 */
export function calculateKeyImagePosition(
  keyImage: GridImage,
  archwayCenter: { x: number; y: number },
  columnWidth: number
) {
  // Calculate how to position the key image so its center aligns with archway center
  const imageHeight = columnWidth / keyImage.aspectRatio

  return {
    x: archwayCenter.x - columnWidth / 2,
    y: archwayCenter.y - imageHeight / 2,
  }
}
