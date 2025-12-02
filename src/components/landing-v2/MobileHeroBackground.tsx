'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { HeroArchSlideshow } from './slideshow'
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
 * - Contains: gradient background, arch image, LASHPOP logo, decorative circles
 * - The arch zooms and logo fades as user scrolls
 * - Hides after scrolling past 1.5 viewports (into welcome section)
 *
 * The scroll container and all page content should be z-10+ to render above this.
 */

function CircleDecoration({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
    </svg>
  )
}

export function MobileHeroBackground({ heroConfig }: MobileHeroBackgroundProps) {
  // Determine what to render: slideshow preset or single image
  const hasSlideshow = heroConfig?.preset && heroConfig.preset.images.length > 0
  const archImage = heroConfig?.fallbackImage || defaultFallbackImage

  const archRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(true)

  // Handle scroll effects: arch zoom, logo fade, visibility toggle
  useEffect(() => {
    const scrollContainer = document.querySelector('.mobile-scroll-container') as HTMLElement
    if (!scrollContainer) return

    let rafId: number
    let lastScrollTop = 0

    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId)

      rafId = requestAnimationFrame(() => {
        const scrollTop = scrollContainer.scrollTop
        if (Math.abs(scrollTop - lastScrollTop) < 0.5) return
        lastScrollTop = scrollTop

        const viewportHeight = window.innerHeight

        // Hide the fixed background after scrolling past 1.5 viewports
        setIsVisible(scrollTop < viewportHeight * 1.5)

        // Zoom through arch over first 60% of viewport scroll
        const zoomProgress = Math.min(scrollTop / (viewportHeight * 0.6), 1)
        const scale = 1 + (zoomProgress * 0.5)

        // Fade out logo over first 30% of viewport scroll
        const fadeProgress = Math.min(scrollTop / (viewportHeight * 0.3), 1)
        const logoOpacity = 1 - fadeProgress

        // Direct DOM manipulation for GPU-accelerated animation
        if (archRef.current) {
          archRef.current.style.transform = `scale3d(${scale}, ${scale}, 1)`
        }
        if (logoRef.current) {
          logoRef.current.style.opacity = String(logoOpacity)
        }
      })
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-0 pointer-events-none md:hidden" style={{ background: 'transparent' }}>
      {/* Background gradient - full viewport - z-0 to stay behind arch */}
      <div className="absolute inset-0 bg-gradient-to-b from-cream via-[rgb(235,224,203)] to-[rgb(226,182,166)] z-0" />

      {/* Floating decorative circles */}
      <div className="absolute top-20 right-4 w-20 h-20">
        <CircleDecoration className="text-dusty-rose" />
      </div>
      <div className="absolute bottom-48 left-4 w-16 h-16">
        <CircleDecoration className="text-sage" />
      </div>

      {/* Arch Image/Slideshow - full height container, arch is 85dvh tall aligned to bottom */}
      <div className="absolute inset-0 flex justify-center items-end overflow-hidden" style={{ zIndex: 10 }}>
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
            /* Single Image Mode - original behavior */
            <Image
              src={archImage.url}
              alt="LashPop Studio Interior"
              fill
              className={archImage.objectFit === 'contain' ? 'object-contain' : 'object-cover'}
              style={{ objectPosition: `${archImage.position.x}% ${archImage.position.y}%` }}
              priority
              quality={85}
            />
          )}
        </div>
      </div>

      {/* LASHPOP Logo - Fixed at top, above arch, fades out on scroll */}
      <div
        ref={logoRef}
        className="absolute left-0 right-0 flex justify-center will-change-opacity"
        style={{ top: '5vh', opacity: 1, zIndex: 20 }}
      >
        <Image
          src="/lashpop-images/branding/logo.png"
          alt="LashPop Studios"
          width={120}
          height={40}
          className="h-8 w-auto"
          style={{
            filter: 'brightness(0) saturate(100%) invert(73%) sepia(10%) saturate(633%) hue-rotate(313deg) brightness(94%) contrast(88%)'
          }}
          priority
        />
      </div>
    </div>
  )
}
