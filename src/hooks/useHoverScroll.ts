import { useRef, useEffect, useCallback } from 'react'

interface UseHoverScrollOptions {
  enabled?: boolean
  edgeThreshold?: number
  scrollSpeed?: number
}

export function useHoverScroll({
  enabled = true,
  edgeThreshold = 60,
  scrollSpeed = 3
}: UseHoverScrollOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled) return

    const container = containerRef.current
    if (!container) return

    // Check if container has overflow (scrollable content)
    const hasOverflow = container.scrollWidth > container.clientWidth
    if (!hasOverflow) {
      // Stop any existing scroll
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
        scrollIntervalRef.current = null
      }
      return
    }

    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left

    // Clear existing interval
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
      scrollIntervalRef.current = null
    }

    // Check if hovering near left edge
    if (x < edgeThreshold && container.scrollLeft > 0) {
      scrollIntervalRef.current = setInterval(() => {
        if (container.scrollLeft > 0) {
          container.scrollLeft -= scrollSpeed
        } else if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current)
          scrollIntervalRef.current = null
        }
      }, 16) // ~60fps
    }
    // Check if hovering near right edge
    else if (x > rect.width - edgeThreshold && container.scrollLeft < container.scrollWidth - container.clientWidth) {
      scrollIntervalRef.current = setInterval(() => {
        if (container.scrollLeft < container.scrollWidth - container.clientWidth) {
          container.scrollLeft += scrollSpeed
        } else if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current)
          scrollIntervalRef.current = null
        }
      }, 16) // ~60fps
    }
  }, [enabled, edgeThreshold, scrollSpeed])

  const handleMouseLeave = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
      scrollIntervalRef.current = null
    }
  }, [])

  // Cleanup scroll interval on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
      }
    }
  }, [])

  return {
    containerRef,
    handleMouseMove,
    handleMouseLeave
  }
}
