'use client'

import { useCallback, useEffect, useState } from 'react'
import type { EmblaCarouselType } from 'embla-carousel'

/**
 * Desktop-only edge-hover auto-scroll for Embla carousels.
 *
 * While the pointer rests inside the left/right edge zone of the carousel,
 * the strip crawls continuously in that direction (like hovering the edge of
 * a map). Moving back to the middle stops it. Touch devices are untouched —
 * they already swipe.
 *
 * Implementation drives Embla's internal engine directly (the documented
 * "marquee" recipe: move location + target together, run the loopers, write
 * the translate). If the internal API ever changes shape, it falls back to
 * discrete scrollPrev/scrollNext stepping so the feature degrades gracefully
 * instead of breaking.
 */
export function useEdgeHoverScroll(
  emblaApi: EmblaCarouselType | undefined,
  { edgeWidth = 130, speed = 2.2 }: { edgeWidth?: number; speed?: number } = {}
) {
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const edgeScrollRef = useCallback((node: HTMLElement | null) => setContainer(node), [])

  useEffect(() => {
    if (!emblaApi || !container) return
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let dir = 0 // -1 = backward (left edge), 1 = forward (right edge)
    let raf = 0
    let lastStep = 0

    const crawl = (now: number) => {
      if (!dir) return
      // Don't fight an active user drag.
      try {
        if (emblaApi.internalEngine().dragHandler.pointerDown()) {
          raf = requestAnimationFrame(crawl)
          return
        }
      } catch {
        /* fall through */
      }
      try {
        const engine = emblaApi.internalEngine()
        // Forward motion = negative location delta (Embla translates left).
        const delta = -dir * speed
        engine.location.add(delta)
        engine.target.set(engine.location.get())
        engine.scrollLooper.loop(Math.sign(delta) as -1 | 1)
        engine.slideLooper.loop()
        engine.translate.to(engine.location)
      } catch {
        // Fallback: discrete stepping if internals changed shape.
        if (now - lastStep > 700) {
          lastStep = now
          if (dir > 0) emblaApi.scrollNext()
          else emblaApi.scrollPrev()
        }
      }
      raf = requestAnimationFrame(crawl)
    }

    const setDir = (next: number) => {
      if (next === dir) return
      dir = next
      container.style.cursor = dir ? 'ew-resize' : ''
      cancelAnimationFrame(raf)
      if (dir) raf = requestAnimationFrame(crawl)
    }

    const onMove = (e: MouseEvent) => {
      const r = container.getBoundingClientRect()
      const zone = Math.min(edgeWidth, r.width * 0.2)
      if (e.clientX < r.left + zone) setDir(-1)
      else if (e.clientX > r.right - zone) setDir(1)
      else setDir(0)
    }
    const onLeave = () => setDir(0)

    container.addEventListener('mousemove', onMove)
    container.addEventListener('mouseleave', onLeave)
    return () => {
      container.removeEventListener('mousemove', onMove)
      container.removeEventListener('mouseleave', onLeave)
      container.style.cursor = ''
      cancelAnimationFrame(raf)
    }
  }, [emblaApi, container, edgeWidth, speed])

  return { edgeScrollRef }
}
