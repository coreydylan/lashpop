'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { NavigationConfig } from '@/types/hero-slideshow'

interface UseSlideshowNavigationProps {
  containerRef: React.RefObject<HTMLElement>
  navigation: NavigationConfig
  onNext: () => void
  onPrevious: () => void
  onInteraction: () => void
  isTransitioning: boolean
}

/**
 * Hook that enables scroll wheel and swipe navigation for the slideshow.
 * Similar to the Instagram carousel wheel scroll hook but adapted for discrete slides.
 */
export function useSlideshowNavigation({
  containerRef,
  navigation,
  onNext,
  onPrevious,
  onInteraction,
  isTransitioning
}: UseSlideshowNavigationProps) {
  const lastScrollTimeRef = useRef(0)
  const accumulatedDeltaRef = useRef(0)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const isHoveringRef = useRef(false)

  // Scroll wheel handler
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!navigation.scrollEnabled || !isHoveringRef.current || isTransitioning) return

    // Debounce rapid scroll events
    const now = Date.now()
    if (now - lastScrollTimeRef.current < 100) {
      accumulatedDeltaRef.current += e.deltaY
      return
    }

    // Calculate total delta including accumulated
    const totalDelta = e.deltaY + accumulatedDeltaRef.current
    accumulatedDeltaRef.current = 0

    // Check if scroll is significant enough
    const threshold = 50 / navigation.scrollSensitivity
    if (Math.abs(totalDelta) < threshold) return

    // Prevent page scroll
    e.preventDefault()
    e.stopPropagation()

    lastScrollTimeRef.current = now
    onInteraction()

    if (totalDelta > 0) {
      onNext()
    } else {
      onPrevious()
    }
  }, [navigation.scrollEnabled, navigation.scrollSensitivity, isTransitioning, onNext, onPrevious, onInteraction])

  // Touch start handler
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!navigation.swipeEnabled) return

    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
  }, [navigation.swipeEnabled])

  // Touch end handler
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!navigation.swipeEnabled || !touchStartRef.current || isTransitioning) return

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    }

    const deltaX = touchEnd.x - touchStartRef.current.x
    const deltaY = touchEnd.y - touchStartRef.current.y

    // Only handle horizontal swipes (prevent conflicts with vertical scroll)
    if (Math.abs(deltaX) < Math.abs(deltaY)) {
      touchStartRef.current = null
      return
    }

    // Minimum swipe distance
    const minSwipeDistance = 50 / navigation.scrollSensitivity
    if (Math.abs(deltaX) < minSwipeDistance) {
      touchStartRef.current = null
      return
    }

    touchStartRef.current = null
    onInteraction()

    if (deltaX < 0) {
      // Swipe left = next
      onNext()
    } else {
      // Swipe right = previous
      onPrevious()
    }
  }, [navigation.swipeEnabled, navigation.scrollSensitivity, isTransitioning, onNext, onPrevious, onInteraction])

  // Mouse drag handler (for desktop swipe-like behavior)
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!navigation.dragEnabled) return

    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY
    }
  }, [navigation.dragEnabled])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!navigation.dragEnabled || !touchStartRef.current || isTransitioning) return

    const deltaX = e.clientX - touchStartRef.current.x
    const minDragDistance = 100 / navigation.scrollSensitivity

    touchStartRef.current = null

    if (Math.abs(deltaX) < minDragDistance) return

    onInteraction()

    if (deltaX < 0) {
      onNext()
    } else {
      onPrevious()
    }
  }, [navigation.dragEnabled, navigation.scrollSensitivity, isTransitioning, onNext, onPrevious, onInteraction])

  // Hover tracking
  const handleMouseEnter = useCallback(() => {
    isHoveringRef.current = true
  }, [])

  const handleMouseLeave = useCallback(() => {
    isHoveringRef.current = false
    accumulatedDeltaRef.current = 0
  }, [])

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Wheel events (passive: false to allow preventDefault)
    container.addEventListener('wheel', handleWheel, { passive: false })

    // Touch events
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    // Mouse events
    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mouseup', handleMouseUp)

    // Hover tracking
    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('mousedown', handleMouseDown)
      container.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [
    containerRef,
    handleWheel,
    handleTouchStart,
    handleTouchEnd,
    handleMouseDown,
    handleMouseUp,
    handleMouseEnter,
    handleMouseLeave
  ])

  return {
    isHovering: isHoveringRef.current
  }
}
