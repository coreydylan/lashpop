'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type {
  SlideshowPreset,
  SlideshowImage,
  TimingConfig,
  NavigationConfig
} from '@/types/hero-slideshow'

interface UseSlideshowControllerProps {
  preset: SlideshowPreset
  onSlideChange?: (index: number) => void
}

interface SlideshowState {
  currentIndex: number
  previousIndex: number
  isTransitioning: boolean
  isPaused: boolean
  direction: 'next' | 'prev'
}

export function useSlideshowController({ preset, onSlideChange }: UseSlideshowControllerProps) {
  const { images, timing, navigation } = preset
  const imageCount = images.length

  const [state, setState] = useState<SlideshowState>({
    currentIndex: 0,
    previousIndex: -1,
    isTransitioning: false,
    isPaused: false,
    direction: 'next'
  })

  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHoveringRef = useRef(false)
  const hasInteractedRef = useRef(false)

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current)
      autoAdvanceTimerRef.current = null
    }
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = null
    }
  }, [])

  // Go to a specific slide
  const goToSlide = useCallback((index: number, direction: 'next' | 'prev' = 'next') => {
    if (state.isTransitioning || imageCount <= 1) return

    let targetIndex = index
    if (navigation.looping) {
      targetIndex = ((index % imageCount) + imageCount) % imageCount
    } else {
      targetIndex = Math.max(0, Math.min(imageCount - 1, index))
    }

    if (targetIndex === state.currentIndex) return

    setState(prev => ({
      ...prev,
      previousIndex: prev.currentIndex,
      currentIndex: targetIndex,
      isTransitioning: true,
      direction
    }))

    onSlideChange?.(targetIndex)
  }, [state.currentIndex, state.isTransitioning, imageCount, navigation.looping, onSlideChange])

  // Go to next slide
  const goToNext = useCallback(() => {
    goToSlide(state.currentIndex + 1, 'next')
  }, [state.currentIndex, goToSlide])

  // Go to previous slide
  const goToPrevious = useCallback(() => {
    goToSlide(state.currentIndex - 1, 'prev')
  }, [state.currentIndex, goToSlide])

  // Mark transition as complete
  const completeTransition = useCallback(() => {
    setState(prev => ({
      ...prev,
      isTransitioning: false
    }))
  }, [])

  // Pause the slideshow
  const pause = useCallback(() => {
    clearTimers()
    setState(prev => ({ ...prev, isPaused: true }))
  }, [clearTimers])

  // Resume the slideshow
  const resume = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: false }))
  }, [])

  // Handle user interaction (scroll/swipe)
  const handleInteraction = useCallback(() => {
    if (!timing.pauseOnInteraction) return

    hasInteractedRef.current = true
    clearTimers()

    // Schedule resume after delay
    resumeTimerRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        hasInteractedRef.current = false
      }
    }, timing.resumeDelay)
  }, [timing.pauseOnInteraction, timing.resumeDelay, clearTimers])

  // Handle mouse enter
  const handleMouseEnter = useCallback(() => {
    isHoveringRef.current = true
    if (timing.pauseOnHover) {
      clearTimers()
    }
  }, [timing.pauseOnHover, clearTimers])

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    isHoveringRef.current = false
    // Don't immediately resume if there was a recent interaction
    if (!hasInteractedRef.current) {
      // Auto-advance will restart via effect
    }
  }, [])

  // Auto-advance effect
  useEffect(() => {
    if (
      !timing.autoAdvance ||
      state.isPaused ||
      state.isTransitioning ||
      isHoveringRef.current ||
      hasInteractedRef.current ||
      imageCount <= 1
    ) {
      return
    }

    // Initial delay on first mount
    const delay = state.previousIndex === -1 ? timing.startDelay : 0

    autoAdvanceTimerRef.current = setTimeout(() => {
      autoAdvanceTimerRef.current = setTimeout(() => {
        goToNext()
      }, timing.interval)
    }, delay)

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current)
      }
    }
  }, [
    timing.autoAdvance,
    timing.interval,
    timing.startDelay,
    state.isPaused,
    state.isTransitioning,
    state.currentIndex,
    state.previousIndex,
    imageCount,
    goToNext
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  // Get current and previous images
  const currentImage = images[state.currentIndex]
  const previousImage = state.previousIndex >= 0 ? images[state.previousIndex] : null

  return {
    // State
    currentIndex: state.currentIndex,
    previousIndex: state.previousIndex,
    isTransitioning: state.isTransitioning,
    isPaused: state.isPaused,
    direction: state.direction,
    imageCount,

    // Current images
    currentImage,
    previousImage,

    // Actions
    goToSlide,
    goToNext,
    goToPrevious,
    completeTransition,
    pause,
    resume,
    handleInteraction,
    handleMouseEnter,
    handleMouseLeave
  }
}
