"use client"

/**
 * Skeleton loader for images in the DAM grid
 * Provides visual feedback while images are loading
 */

interface ImageSkeletonProps {
  gridViewMode?: "square" | "aspect"
  aspectRatio?: number
}

export function ImageSkeleton({ gridViewMode = "square", aspectRatio = 1.5 }: ImageSkeletonProps) {
  return (
    <div
      className={`
        relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200
        ${gridViewMode === "square" ? "aspect-square" : ""}
      `}
      style={
        gridViewMode === "aspect"
          ? { paddingBottom: `${(1 / aspectRatio) * 100}%` }
          : undefined
      }
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  )
}

/**
 * Shimmer animation for skeleton
 * Add this to your global CSS or tailwind.config.js
 */
