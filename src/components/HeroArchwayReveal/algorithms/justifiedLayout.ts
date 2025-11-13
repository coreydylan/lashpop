/**
 * Justified Gallery Layout Algorithm
 *
 * Creates a perfect-fit mosaic where images of different sizes
 * fill the container with zero gaps. Similar to Google Photos or Flickr.
 *
 * Algorithm:
 * 1. Group images into rows
 * 2. Calculate scale factor to make each row exactly container width
 * 3. Apply scale to image heights
 * 4. Adjust last row to fill remaining space to exactly 1vh
 */

import type { GridImage } from '../types'

export interface LayoutImage {
  image: GridImage
  width: number
  height: number
  x: number
  y: number
  scale: number
}

export interface JustifiedLayoutResult {
  images: LayoutImage[]
  totalHeight: number
  rows: number
}

interface LayoutRow {
  images: GridImage[]
  aspectRatios: number[]
  startIndex: number
}

/**
 * Calculate justified layout for images with creative variation
 * @param images - Array of images with aspect ratios
 * @param containerWidth - Width of the container
 * @param targetHeight - Target height for 1vh (e.g., window.innerHeight)
 * @param rowHeight - Ideal row height (default: 300px)
 * @param maxRowHeight - Maximum row height (default: 400px)
 * @param minRowHeight - Minimum row height (default: 200px)
 */
export function calculateJustifiedLayout(
  images: GridImage[],
  containerWidth: number,
  targetHeight: number,
  rowHeight: number = 300,
  maxRowHeight: number = 400,
  minRowHeight: number = 200
): JustifiedLayoutResult {
  if (images.length === 0) {
    return { images: [], totalHeight: 0, rows: 0 }
  }

  // Shuffle images slightly for variety (but keep key image first)
  const shuffledImages = shuffleWithKeyFirst(images)

  const rows: LayoutRow[] = []
  let currentRow: GridImage[] = []
  let currentRowAspectRatios: number[] = []
  let startIndex = 0

  // Step 1: Group images into rows with variation
  for (let i = 0; i < shuffledImages.length; i++) {
    const image = shuffledImages[i]
    currentRow.push(image)
    currentRowAspectRatios.push(image.aspectRatio)

    // Calculate what the row height would be if we closed it now
    const totalAspectRatio = currentRowAspectRatios.reduce((sum, ar) => sum + ar, 0)
    const calculatedHeight = containerWidth / totalAspectRatio

    // Add some randomness to row closing decision
    const randomThreshold = rowHeight + (Math.random() - 0.5) * 100
    const isLastImage = i === shuffledImages.length - 1

    // Close row if height is good, or randomly sometimes, or last image
    const shouldCloseRow =
      calculatedHeight <= randomThreshold ||
      (currentRow.length >= 4 && Math.random() > 0.6) || // Sometimes close early
      isLastImage

    if (shouldCloseRow) {
      rows.push({
        images: [...currentRow],
        aspectRatios: [...currentRowAspectRatios],
        startIndex,
      })
      currentRow = []
      currentRowAspectRatios = []
      startIndex = i + 1
    }
  }

  // Step 2: Calculate layout for each row with varied heights
  const layoutImages: LayoutImage[] = []
  let currentY = 0
  let rowIndex = 0

  for (const row of rows) {
    const totalAspectRatio = row.aspectRatios.reduce((sum, ar) => sum + ar, 0)
    let rowHeightCalculated = containerWidth / totalAspectRatio

    // Add height variation (±15%) for visual interest
    const heightVariation = 1 + (Math.random() - 0.5) * 0.3
    rowHeightCalculated *= heightVariation

    // Clamp row height with some randomness
    const minH = minRowHeight + (Math.random() - 0.5) * 50
    const maxH = maxRowHeight + (Math.random() - 0.5) * 50
    rowHeightCalculated = Math.max(minH, Math.min(maxH, rowHeightCalculated))

    // For the last row, adjust height to reach exactly targetHeight
    const isLastRow = rowIndex === rows.length - 1
    if (isLastRow && rows.length > 1) {
      const remainingHeight = targetHeight - currentY
      if (remainingHeight > minRowHeight) {
        rowHeightCalculated = remainingHeight
      }
    }

    // Layout images in this row
    let currentX = 0
    for (let i = 0; i < row.images.length; i++) {
      const image = row.images[i]
      const imageWidth = rowHeightCalculated * image.aspectRatio
      const scale = rowHeightCalculated / image.height

      layoutImages.push({
        image,
        width: imageWidth,
        height: rowHeightCalculated,
        x: currentX,
        y: currentY,
        scale,
      })

      currentX += imageWidth
    }

    // If row doesn't perfectly fill width, scale images to fit
    const rowWidth = currentX
    if (rowWidth !== containerWidth) {
      const scaleFactor = containerWidth / rowWidth
      const adjustedHeight = rowHeightCalculated * scaleFactor

      // Update all images in this row
      let adjustedX = 0
      for (let i = 0; i < row.images.length; i++) {
        const image = row.images[i]
        const adjustedWidth = adjustedHeight * image.aspectRatio
        const layoutImageIndex = layoutImages.findIndex(
          (li) => li.image.id === image.id && li.y === currentY
        )

        if (layoutImageIndex !== -1) {
          layoutImages[layoutImageIndex].width = adjustedWidth
          layoutImages[layoutImageIndex].height = adjustedHeight
          layoutImages[layoutImageIndex].x = adjustedX
          layoutImages[layoutImageIndex].scale = adjustedHeight / image.height
        }

        adjustedX += adjustedWidth
      }

      rowHeightCalculated = adjustedHeight
    }

    currentY += rowHeightCalculated
    rowIndex++
  }

  return {
    images: layoutImages,
    totalHeight: currentY,
    rows: rows.length,
  }
}

/**
 * Simpler grid-based mosaic with variable sizes
 * Uses a smarter packing algorithm
 */
export function calculateVariableMosaic(
  images: GridImage[],
  containerWidth: number,
  targetHeight: number
): JustifiedLayoutResult {
  if (images.length === 0) {
    return { images: [], totalHeight: 0, rows: 0 }
  }

  // Determine grid columns based on container width
  const columns = containerWidth < 640 ? 2 : containerWidth < 1024 ? 3 : 5

  const layoutImages: LayoutImage[] = []
  const columnHeights = new Array(columns).fill(0)

  // Base unit size (column width)
  const baseWidth = containerWidth / columns

  for (const image of images) {
    // Find shortest column
    const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))

    // Determine image size (1x1, 2x1, 1x2, or 2x2 units)
    const size = determineImageSize(image, columns, shortestColumnIndex)

    const width = baseWidth * size.cols
    const height = width / image.aspectRatio
    const x = shortestColumnIndex * baseWidth
    const y = columnHeights[shortestColumnIndex]

    layoutImages.push({
      image,
      width,
      height,
      x,
      y,
      scale: width / image.width,
    })

    // Update column heights
    for (let i = 0; i < size.cols && shortestColumnIndex + i < columns; i++) {
      columnHeights[shortestColumnIndex + i] = y + height
    }
  }

  const totalHeight = Math.max(...columnHeights)

  return {
    images: layoutImages,
    totalHeight,
    rows: Math.ceil(images.length / columns),
  }
}

function determineImageSize(
  image: GridImage,
  totalColumns: number,
  currentColumn: number
): { cols: number; rows: number } {
  // Key image gets more space
  if (image.isKeyImage) {
    return { cols: Math.min(2, totalColumns - currentColumn), rows: 2 }
  }

  // Add randomness to size selection
  const random = Math.random()

  // Wide images (landscape) - sometimes make them bigger
  if (image.aspectRatio > 1.5) {
    return {
      cols: random > 0.7 ? Math.min(3, totalColumns - currentColumn) : Math.min(2, totalColumns - currentColumn),
      rows: 1
    }
  }

  // Tall images (portrait) - vary the height
  if (image.aspectRatio < 0.7) {
    return { cols: 1, rows: random > 0.5 ? 2 : 1 }
  }

  // Square-ish images - sometimes make them 2x2
  if (image.aspectRatio >= 0.9 && image.aspectRatio <= 1.1 && random > 0.7) {
    return { cols: Math.min(2, totalColumns - currentColumn), rows: 2 }
  }

  // Default: single square
  return { cols: 1, rows: 1 }
}

/**
 * Shuffle array but keep key image first
 */
function shuffleWithKeyFirst(images: GridImage[]): GridImage[] {
  const keyImage = images.find((img) => img.isKeyImage)
  const otherImages = images.filter((img) => !img.isKeyImage)

  // Shuffle other images
  for (let i = otherImages.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[otherImages[i], otherImages[j]] = [otherImages[j], otherImages[i]]
  }

  // Return with key image first (if exists)
  return keyImage ? [keyImage, ...otherImages] : otherImages
}
