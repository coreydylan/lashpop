"use client"

import { useMemo } from "react"

interface AssetGridSkeletonProps {
  gridViewMode: "square" | "aspect" | "masonry"
  count?: number
}

export function AssetGridSkeleton({ gridViewMode, count = 25 }: AssetGridSkeletonProps) {
  // Generate random aspect ratios for masonry view to simulate real content
  const skeletonItems = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      // Random height between 200px and 400px for masonry/aspect
      height: Math.floor(Math.random() * (400 - 200 + 1) + 200),
    }))
  }, [count])

  if (gridViewMode === "square") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {skeletonItems.map((item) => (
          <div
            key={item.id}
            className="aspect-square bg-warm-sand/20 rounded-sm animate-pulse relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>
        ))}
      </div>
    )
  }

  // Masonry / Aspect view
  return (
    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
      {skeletonItems.map((item) => (
        <div
          key={item.id}
          className="w-full bg-warm-sand/20 rounded-sm animate-pulse relative overflow-hidden break-inside-avoid mb-3 sm:mb-4"
          style={{ height: `${item.height}px` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
      ))}
    </div>
  )
}

