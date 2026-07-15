'use client'

import { useRef, useEffect, useState } from 'react'
import { HeroArchSlideshow } from './slideshow'
import { GracefulHeroImage } from './GracefulHeroImage'
import type { SlideshowPreset } from '@/types/hero-slideshow'

// New config format from slideshow system
interface HeroSlideshowConfig {
  preset: SlideshowPreset | null
  fallbackImage: {
    url: string
    position: { x: number; y: number }
    objectFit: 'cover' | 'contain'
  } | null
}

interface MobileHeroBackgroundProps {
  heroConfig?: HeroSlideshowConfig
}

// Default fallback image when no config provided
const defaultFallbackImage = {
  url: '/lashpop-images/studio/studio-photos-by-salome.jpg',
  position: { x: 50, y: 50 },
  objectFit: 'cover' as const
}

/**
 * MobileHeroBackground
 *
 * This component renders the fixed background layer for the mobile hero section.
 * It MUST be rendered as a SIBLING to (not inside of) the scroll container.
 *
 * Architecture:
 * - Position: fixed, inset-0, z-0 (lowest layer)
 * - Contains: gradient background, arch image, decorative circles
 * - Hides after scrolling past 1.5 viewports (into welcome section)
 *
 * The scroll container and all page content should be z-10+ to render above this.
 */

export function MobileHeroBackground({ heroConfig }: MobileHeroBackgroundProps) {
  // Determine what to render: slideshow preset or single image
  const hasSlideshow = heroConfig?.preset && heroConfig.preset.images.length > 0
  const archImage = heroConfig?.fallbackImage || defaultFallbackImage

  const archRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(true)

  // Handle scroll effects: arch zoom and visibility toggle
  useEffect(() => {
    let scrollContainer: HTMLElement | null = null
    let rafId: number
    let lastScrollTop = 0
    let lastVisible = true
    let cancelled = false

    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId)

      rafId = requestAnimationFrame(() => {
        if (!scrollContainer) return
        const scrollTop = scrollContainer.scrollTop
        if (Math.abs(scrollTop - lastScrollTop) < 0.5) return
        lastScrollTop = scrollTop

        const viewportHeight = window.innerHeight

        // Hide the fixed background after scrolling past 1.5 viewports.
        // Gate the setState on the actual boolean transition so we don't
        // pump React's reconciler every scroll frame.
        const shouldBeVisible = scrollTop < viewportHeight * 1.5
        if (shouldBeVisible !== lastVisible) {
          lastVisible = shouldBeVisible
          setIsVisible(shouldBeVisible)
        }

        // Skip the arch transform write once the bg is hidden — it's
        // pointless work that still walks through the compositor.
        if (!shouldBeVisible) return

        // Zoom through arch over first 60% of viewport scroll. Cap the
        // transform write so we stop touching the element once the
        // animation is at its final scale (1.5) — no need to keep writing
        // the same value every scroll frame.
        const zoomProgress = Math.min(scrollTop / (viewportHeight * 0.6), 1)
        if (zoomProgress >= 1 && lastScrollTop > viewportHeight * 0.6) return
        const scale = 1 + (zoomProgress * 0.5)

        if (archRef.current) {
          archRef.current.style.transform = `scale3d(${scale}, ${scale}, 1)`
        }
      })
    }

    // The scroll container class is added by the parent only after its
    // isMobile state flips to true (post-mount). Child useEffects run before
    // parent useEffects, so on first mount the element may not exist yet —
    // retry on animation frames until it does.
    const tryAttach = () => {
      if (cancelled) return
      scrollContainer = document.querySelector('.mobile-scroll-container') as HTMLElement | null
      if (!scrollContainer) {
        requestAnimationFrame(tryAttach)
        return
      }
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
      handleScroll()
    }

    tryAttach()

    return () => {
      cancelled = true
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll)
      }
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  // Mid-scroll DOM mutations on this fixed subtree caused iOS Safari to
  // pause momentum scrolling at the 1.5-viewport boundary — that's the
  // "stuck on the welcome letter" complaint. Previous attempt used
  // display:none but the property switch still nudged the compositor.
  // Animate opacity instead: no display change, no visibility flip, just a
  // composited fade that iOS can keep paint pipelines warm through.
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none md:hidden transition-opacity duration-200"
      style={{
        background: 'transparent',
        opacity: isVisible ? 1 : 0,
      }}
    >
      {/* Background - solid ivory */}
      <div className="absolute inset-0 bg-ivory z-0" />

      {/* Arch Image/Slideshow - full height container, arch is 85dvh tall aligned to bottom */}
      <div
        className="absolute inset-0 flex justify-center items-end overflow-hidden"
        style={{ zIndex: 10 }}
      >
        <div
          ref={archRef}
          className="relative w-[80vw] max-w-[380px] overflow-hidden will-change-transform"
          style={{
            borderRadius: 'clamp(120px, 40vw, 190px) clamp(120px, 40vw, 190px) 0 0',
            height: '85dvh',
            transform: 'scale3d(1, 1, 1)',
            transformOrigin: 'center bottom',
            backfaceVisibility: 'hidden',
          }}
        >
          {hasSlideshow && heroConfig?.preset ? (
            /* Slideshow Mode - render the carousel */
            <HeroArchSlideshow preset={heroConfig.preset} className="w-full h-full" />
          ) : (
            <>
              <GracefulHeroImage
                src={archImage.url}
                alt="LashPop Studio Interior"
                objectFit={archImage.objectFit}
                objectPosition={`${archImage.position.x}% ${archImage.position.y}%`}
                priority
                fetchPriority="high"
                sizes="100vw"
              />
            </>
          )}
        </div>
      </div>

      {/* Bottom ivory strip - covers any gap between content and screen edge on iOS Safari */}
      {/* Using 15% of viewport to ensure full coverage regardless of address bar state */}
      <div
        className="absolute left-0 right-0 bottom-0 bg-ivory"
        style={{
          height: '15dvh',
          zIndex: 20,
        }}
      />
    </div>
  )
}
