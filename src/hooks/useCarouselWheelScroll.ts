'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { EmblaCarouselType } from 'embla-carousel'

/**
 * Hook that enables smooth horizontal carousel scrolling via horizontal scroll gestures ONLY.
 *
 * Uses synthetic mouse events to leverage Embla's native drag physics for smooth
 * momentum-based scrolling when user performs horizontal scroll (trackpad left/right).
 *
 * Behavior:
 * - Horizontal scroll (trackpad left/right) → scrolls carousel
 * - Vertical scroll (scroll wheel up/down) → passes through for normal page scroll
 * - Only activates when hovering over the container
 */
export function useCarouselWheelScroll(emblaApi: EmblaCarouselType | undefined) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Set up wheel gestures when hovering
  useEffect(() => {
    if (!emblaApi || !containerRef.current || !isHovering) {
      // Cleanup if not hovering
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      return
    }

    const container = containerRef.current

    let isGestureActive = false
    let startX = 0
    let startY = 0
    let accumulatedX = 0

    const handleWheel = (e: WheelEvent) => {
      // Only handle horizontal scroll intent (left/right trackpad gestures)
      const isHorizontalScroll = Math.abs(e.deltaX) > Math.abs(e.deltaY)
      if (!isHorizontalScroll) return  // Let vertical scroll pass through

      // Prevent horizontal page scroll (we'll handle it in carousel)
      e.preventDefault()

      if (!isGestureActive) {
        isGestureActive = true
        startX = e.clientX
        startY = e.clientY
        accumulatedX = 0

        // Dispatch mousedown to start Embla drag
        const mousedown = new MouseEvent('mousedown', {
          clientX: startX,
          clientY: startY,
          button: 0,
          bubbles: true,
          cancelable: true,
        })
        emblaApi.containerNode().dispatchEvent(mousedown)
      }

      // Accumulate horizontal movement from horizontal scroll input
      // Negative because deltaX positive = scroll right = content moves left
      accumulatedX -= e.deltaX * 0.5

      // Dispatch mousemove
      const mousemove = new MouseEvent('mousemove', {
        clientX: startX + accumulatedX,
        clientY: startY,
        button: 0,
        bubbles: true,
        cancelable: true,
      })
      emblaApi.containerNode().dispatchEvent(mousemove)
    }

    // End gesture after inactivity
    let endTimeout: ReturnType<typeof setTimeout> | null = null

    const scheduleEnd = () => {
      if (endTimeout) clearTimeout(endTimeout)
      endTimeout = setTimeout(() => {
        if (isGestureActive) {
          isGestureActive = false
          const mouseup = new MouseEvent('mouseup', {
            clientX: startX + accumulatedX,
            clientY: startY,
            button: 0,
            bubbles: true,
            cancelable: true,
          })
          emblaApi.containerNode().dispatchEvent(mouseup)
        }
      }, 100)
    }

    const wrappedWheelHandler = (e: WheelEvent) => {
      handleWheel(e)
      scheduleEnd()
    }

    container.addEventListener('wheel', wrappedWheelHandler, { passive: false })

    cleanupRef.current = () => {
      container.removeEventListener('wheel', wrappedWheelHandler)
      if (endTimeout) clearTimeout(endTimeout)
      if (isGestureActive) {
        const mouseup = new MouseEvent('mouseup', {
          clientX: startX + accumulatedX,
          clientY: startY,
          button: 0,
          bubbles: true,
          cancelable: true,
        })
        emblaApi.containerNode().dispatchEvent(mouseup)
      }
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [emblaApi, isHovering])

  // Mouse enter/leave handlers
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
  }, [])

  // Set up hover event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [handleMouseEnter, handleMouseLeave])

  return {
    /** Attach this ref to the carousel container element */
    wheelContainerRef: containerRef,
    /** Current hover state */
    isHovering,
  }
}
