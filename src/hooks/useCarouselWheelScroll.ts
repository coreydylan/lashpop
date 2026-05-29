'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { EmblaCarouselType } from 'embla-carousel'

/**
 * Hook that enables smooth horizontal carousel scrolling via horizontal scroll gestures ONLY.
 *
 * Earlier versions dispatched synthetic mouse events (mousedown/move/up) to
 * piggy-back on Embla's drag physics. That bubbled clicks to child anchor
 * chips (Google / Yelp / Vagaro source links on review cards), so a small
 * trackpad horizontal scroll would silently open a new tab. We now drive the
 * carousel via Embla's public scrollNext/scrollPrev so no synthetic events
 * fire at all.
 *
 * Behavior:
 * - Horizontal scroll (trackpad left/right) → advances/rewinds carousel
 * - Vertical scroll (wheel up/down) → passes through for normal page scroll
 * - Only activates when hovering over the container
 */
export function useCarouselWheelScroll(emblaApi: EmblaCarouselType | undefined) {
  // Use a state-backed callback ref so effects re-run when the DOM node attaches.
  // A plain useRef wouldn't trigger re-renders, so if the consumer mounts the
  // ref'd element later (e.g. after an async fetch returns null on first render),
  // the listeners would never get wired up.
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const wheelContainerRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node)
  }, [])

  const [isHovering, setIsHovering] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Set up wheel gestures when hovering
  useEffect(() => {
    if (!emblaApi || !container || !isHovering) {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      return
    }

    // Threshold of accumulated horizontal delta before we advance one slide.
    // Trackpads emit small frequent deltas (~5-20 px each); 80 keeps it from
    // firing on a casual two-finger drift while still feeling responsive.
    const ADVANCE_THRESHOLD = 80
    // Lock between scrollNext calls so a flurry of wheel events doesn't try
    // to advance several slides faster than Embla's animation can settle.
    const LOCK_MS = 180

    let accumulatedX = 0
    let lockedUntil = 0

    const handleWheel = (e: WheelEvent) => {
      const isHorizontalScroll = Math.abs(e.deltaX) > Math.abs(e.deltaY)
      if (!isHorizontalScroll) return // let vertical wheel pass through to the page

      // Prevent native horizontal page scroll on mac trackpads.
      e.preventDefault()

      accumulatedX += e.deltaX
      if (Math.abs(accumulatedX) < ADVANCE_THRESHOLD) return

      const now = performance.now()
      if (now < lockedUntil) {
        // Drain accumulated delta so a paused-then-resumed gesture doesn't
        // pop several slides at once when the lock releases.
        accumulatedX = 0
        return
      }

      if (accumulatedX > 0 && emblaApi.canScrollNext()) {
        emblaApi.scrollNext()
      } else if (accumulatedX < 0 && emblaApi.canScrollPrev()) {
        emblaApi.scrollPrev()
      }
      accumulatedX = 0
      lockedUntil = now + LOCK_MS
    }

    container.addEventListener('wheel', handleWheel, { passive: false })

    cleanupRef.current = () => {
      container.removeEventListener('wheel', handleWheel)
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [emblaApi, container, isHovering])

  // Mouse enter/leave handlers
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
  }, [])

  // Set up hover event listeners — re-runs when container element changes,
  // so the listeners attach as soon as the ref'd node mounts.
  useEffect(() => {
    if (!container) return

    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [container, handleMouseEnter, handleMouseLeave])

  return {
    /** Attach this callback ref to the carousel container element */
    wheelContainerRef,
    /** Current hover state */
    isHovering,
  }
}
