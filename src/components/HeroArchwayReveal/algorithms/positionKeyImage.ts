/**
 * Calculate position for key image to align with hero archway
 */

import type { GridImage } from '../types'
import type { LayoutImage } from './justifiedLayout'

/**
 * Get the archway center position from the hero section
 *
 * The archway is typically on the right side of the hero in a 2-column layout.
 * It's an arch-shaped image with aspect ratio 4:5 and rounded top.
 */
export function getArchwayCenterPosition(containerWidth: number, containerHeight: number) {
  // Hero is a 2-column grid (lg:grid-cols-2)
  // Archway is on the right column

  // On desktop, archway starts at ~50% width (right column)
  // On mobile, it's full width

  const isMobile = containerWidth < 1024

  if (isMobile) {
    // Mobile: archway is centered, lower on screen
    return {
      x: containerWidth / 2,
      y: containerHeight * 0.65, // Lower on mobile due to content above
    }
  }

  // Desktop: archway is in right column
  const rightColumnStart = containerWidth * 0.5
  const rightColumnWidth = containerWidth * 0.5

  // Center of the right column
  const archwayX = rightColumnStart + rightColumnWidth / 2

  // Archway is vertically centered in viewport
  const archwayY = containerHeight * 0.5

  return {
    x: archwayX,
    y: archwayY,
  }
}

/**
 * Position the key image in the grid to align with the archway
 */
export function positionKeyImageAtArchway(
  images: GridImage[],
  archwayCenterX: number,
  archwayCenterY: number,
  containerWidth: number
): GridImage[] {
  const keyImage = images.find((img) => img.isKeyImage)

  if (!keyImage) {
    return images
  }

  // Calculate what size the key image should be to fit nicely in the archway
  // Archway aspect ratio is 4:5 (portrait)
  const archwayWidth = containerWidth < 1024 ? containerWidth * 0.8 : containerWidth * 0.35
  const archwayHeight = archwayWidth * 1.25 // 4:5 ratio = 1.25

  // Key image should fill the archway
  const keyImageWidth = archwayWidth
  const keyImageHeight = keyImageWidth / keyImage.aspectRatio

  // If key image is taller than archway, crop it
  const finalHeight = Math.min(keyImageHeight, archwayHeight)
  const finalWidth = finalHeight * keyImage.aspectRatio

  // Store the archway position as metadata on the key image
  return images.map((img) => {
    if (img.isKeyImage) {
      return {
        ...img,
        // Store archway position for layout algorithm
        archwayPosition: {
          centerX: archwayCenterX,
          centerY: archwayCenterY,
          width: finalWidth,
          height: finalHeight,
        },
      }
    }
    return img
  })
}

/**
 * Adjust layout to position key image at archway location
 */
export function adjustLayoutForArchway(
  layout: LayoutImage[],
  archwayCenterX: number,
  archwayCenterY: number
): LayoutImage[] {
  const keyImageLayout = layout.find((l) => l.image.isKeyImage)

  if (!keyImageLayout) {
    return layout
  }

  // Calculate where key image should be positioned
  const keyImageX = archwayCenterX - keyImageLayout.width / 2
  const keyImageY = archwayCenterY - keyImageLayout.height / 2

  // Update key image position
  const updatedLayout = layout.map((layoutImage) => {
    if (layoutImage.image.isKeyImage) {
      return {
        ...layoutImage,
        x: keyImageX,
        y: keyImageY,
      }
    }
    return layoutImage
  })

  return updatedLayout
}
