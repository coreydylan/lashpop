'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useFindYourLook } from '@/components/find-your-look'
import { GoogleLogoCompact, YelpLogoCompact, VagaroLogoCompact } from '@/components/icons/ReviewLogos'
import WeatherLocationBadge from './WeatherLocationBadge'
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

interface HeroSectionProps {
  reviewStats?: Array<{
    id: string
    source: string
    rating: string
    reviewCount: number
  }>
  heroConfig?: HeroSlideshowConfig
}

function CircleDecoration({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
    </svg>
  )
}

// Default fallback image when no config provided
const defaultFallbackImage = {
  url: '/lashpop-images/studio/studio-photos-by-salome.jpg',
  position: { x: 50, y: 50 },
  objectFit: 'cover' as const
}

export default function HeroSection({ reviewStats, heroConfig }: HeroSectionProps) {
  // Determine what to render: slideshow preset or single image
  const hasSlideshow = heroConfig?.preset && heroConfig.preset.images.length > 0
  const archImage = heroConfig?.fallbackImage || defaultFallbackImage
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // Mobile - no longer need internal scroll state
  const heroContentRef = useRef<HTMLDivElement>(null)

  const { openQuiz } = useFindYourLook()
  const [isMobile, setIsMobile] = useState(false)

  // Calculate total reviews
  const totalReviews = reviewStats?.reduce((sum, stat) => sum + stat.reviewCount, 0) || 0

  // Handle Book Now click - scroll to services section
  const scrollToServices = useCallback(() => {
    const servicesSection = document.getElementById('services')
    if (servicesSection) {
      const headerHeight = 80
      const elementTop = servicesSection.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({ top: elementTop - headerHeight, behavior: 'smooth' })
    }
  }, [])

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ============================================
  // MOBILE LAYOUT - Content only (background handled by MobileHeroBackground)
  // ============================================
  if (isMobile) {
    return (
      <section ref={containerRef} className="relative min-h-[100dvh]" style={{ background: 'transparent' }}>
        {/* Background shows through from MobileHeroBackground */}
        <div className="relative">
          {/* ABOVE THE FOLD - exactly 100dvh, gradient fades to ivory at bottom */}
          <div
            className="relative flex flex-col justify-end px-6 pb-4"
            style={{
              height: '100dvh',
              background: 'linear-gradient(to top, #faf6f2 0%, #faf6f2 12%, rgba(250,246,242,0.8) 18%, transparent 28%)',
            }}
          >
            {/* Hero text content - at bottom of viewport */}
            <div className="text-center">
              <h1
                className="font-serif"
                style={{ fontSize: '2rem', fontWeight: 400, letterSpacing: '0.05em', color: '#cc947f' }}
              >
                lashes + beauty
              </h1>
              <div className="mt-1">
                <span
                  className="font-serif font-medium inline-block px-4 py-1 rounded-full"
                  style={{
                    fontSize: '0.9rem',
                    letterSpacing: '0.03em',
                    fontFamily: 'var(--font-zilla-slab), "Zilla Slab", serif',
                    color: '#cc947f',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'rgba(204, 148, 127, 0.8)',
                  }}
                >
                  for the modern woman
                </span>
              </div>

              {/* Oceanside California with live weather - ANCHORED at bottom of 100dvh */}
              <div className="flex items-center justify-center pt-3">
                <WeatherLocationBadge size="sm" />
              </div>
            </div>
          </div>

          {/* BELOW THE FOLD - gradient from cream to pink to match next section */}
          {/* Snap marker: when snapped here, title is near top, buttons centered */}
          <div
            className="mobile-section"
            data-section-id="hero-buttons"
            aria-hidden="true"
            style={{ position: 'absolute', top: '85dvh', height: '1px', width: '1px', pointerEvents: 'none' }}
          />
          <div
            ref={heroContentRef}
            className="relative px-6 py-6"
            style={{
              background: '#faf6f2',
            }}
          >
            {/* Buttons and chips - immediately below the fold */}
            <div className="mx-auto flex w-full max-w-[300px] flex-col gap-3">
              {/* Book Now - Terracotta frosted glass button */}
              <button
                onClick={scrollToServices}
                className="relative group w-full"
              >
                <div className="absolute inset-0 rounded-full blur-md opacity-50" style={{ backgroundColor: 'rgba(204, 148, 127, 0.3)' }} />
                <div className="relative py-3.5 px-6 rounded-full backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_1px_3px_rgba(0,0,0,0.1)] active:scale-[0.98]" style={{ backgroundColor: 'rgba(204, 148, 127, 0.9)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(204, 148, 127, 0.6)' }}>
                  <span className="font-sans font-medium text-base text-white">Book Now</span>
                </div>
              </button>

              {/* Find Your Look - Frosted glass secondary button */}
              <button
                onClick={openQuiz}
                className="relative group w-full"
              >
                <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-50" />
                <div className="relative py-3.5 px-6 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_3px_rgba(0,0,0,0.1)] active:scale-[0.98]">
                  <span className="font-sans font-medium text-base text-dune">Find Your Look</span>
                </div>
              </button>

              {/* Work With Us - Frosted glass secondary button */}
              <a
                href="#"
                className="relative group w-full block"
              >
                <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-50" />
                <div className="relative py-3.5 px-6 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_3px_rgba(0,0,0,0.1)] active:scale-[0.98] text-center">
                  <span className="font-sans font-medium text-base text-dune">Work With Us</span>
                </div>
              </a>

              {/* Reviews chip - Frosted glass style matching other chips */}
              {totalReviews > 0 && (
                <button
                  onClick={() => {
                    const reviewsSection = document.getElementById('reviews');
                    if (reviewsSection) {
                      reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="relative group w-full"
                >
                  <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-50" />
                  <div className="relative py-3 px-5 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_3px_rgba(0,0,0,0.1)] active:scale-[0.98]">
                    <div className="flex items-center justify-center gap-2.5">
                      <div className="flex items-center gap-1.5 pr-2.5 border-r border-dune/10" style={{ color: '#cc947f' }}>
                        <GoogleLogoCompact monochrome />
                        <YelpLogoCompact monochrome />
                        <VagaroLogoCompact monochrome />
                      </div>
                      <span className="font-sans font-semibold text-sm text-dune">{totalReviews.toLocaleString()}</span>
                      <div className="flex items-center -space-x-0.5">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-3.5 h-3.5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs font-sans font-medium" style={{ color: '#cc947f' }}>Reviews</span>
                    </div>
                  </div>
                </button>
              )}

            </div>
          </div>
        </div>
      </section>
    )
  }

  // ============================================
  // DESKTOP LAYOUT - Full viewport photo with overlaid content
  // ============================================
  return (
    <section ref={containerRef} className="relative h-screen w-screen overflow-hidden">
      {/* Full viewport background image */}
      <div
        ref={imageContainerRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      >
        {hasSlideshow && heroConfig?.preset ? (
          /* Slideshow Mode */
          <HeroArchSlideshow preset={heroConfig.preset} className="w-full h-full" />
        ) : (
          /* Single Image Mode - full bleed */
          <div className="absolute inset-0 overflow-hidden">
            <Image
              ref={imageRef}
              src={archImage.url}
              alt="LashPop Studio Interior"
              fill
              className="object-cover"
              priority
              quality={90}
              sizes="100vw"
              style={{
                objectPosition: `${archImage.position.x}% ${archImage.position.y}%`
              }}
            />
          </div>
        )}

      </div>

      {/* Overlaid Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container-wide">
          {/* Left Content - overlaid on the photo */}
          <div className="flex flex-col max-w-xl">
            {/* Location accent with live weather */}
            <div>
              <WeatherLocationBadge size="lg" />
            </div>

            {/* Reviews Chip - 8px gap from weather */}
            {totalReviews > 0 && (
              <div className="inline-block mt-2">
                <button
                  onClick={() => {
                    const reviewsSection = document.getElementById('reviews');
                    if (reviewsSection) {
                      const elementRect = reviewsSection.getBoundingClientRect();
                      const absoluteElementTop = elementRect.top + window.pageYOffset;
                      const elementHeight = elementRect.height;
                      const viewportHeight = window.innerHeight;
                      const headerHeight = 80;
                      const centerOffset = Math.max(headerHeight, (viewportHeight - elementHeight) / 2);
                      const targetPosition = absoluteElementTop - centerOffset;
                      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                    }
                  }}
                  className="relative group cursor-pointer text-left"
                >
                  <div className="absolute inset-0 rounded-full bg-cream/30 blur-lg opacity-30" />
                  <div className="relative px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-white/80 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 pr-2 border-r" style={{ borderColor: 'rgba(204, 148, 127, 0.3)', color: '#cc947f' }}>
                        <GoogleLogoCompact monochrome />
                        <YelpLogoCompact monochrome />
                        <VagaroLogoCompact monochrome />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-sans text-sm font-semibold text-dune">
                          {totalReviews.toLocaleString()}
                        </span>
                        <div className="flex items-center -space-x-0.5">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-3.5 h-3.5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="font-sans text-xs font-medium ml-0.5" style={{ color: '#cc947f' }}>Reviews</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Main heading - 16px gap from reviews/weather */}
            <div className="relative mt-4">
              <h1
                className="font-serif relative z-10"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 400, letterSpacing: '0.05em', color: '#cc947f' }}
              >
                lashes + beauty
              </h1>
              <div className="mt-2">
                <span
                  className="font-serif font-medium inline-block px-5 py-1.5 rounded-full"
                  style={{
                    fontSize: 'clamp(1rem, 2vw, 1.5rem)',
                    letterSpacing: '0.03em',
                    fontFamily: 'var(--font-zilla-slab), "Zilla Slab", serif',
                    color: '#cc947f',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: 'rgba(204, 148, 127, 0.8)',
                  }}
                >
                  for the modern woman
                </span>
              </div>
            </div>

            {/* CTA Buttons - 48px gap from heading */}
            <div className="flex flex-row gap-4 mt-12">
              <button
                onClick={scrollToServices}
                className="relative group"
              >
                <div className="absolute inset-0 rounded-full blur-md opacity-50" style={{ backgroundColor: 'rgba(204, 148, 127, 0.3)' }} />
                <div className="relative px-8 py-3.5 rounded-full backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_1px_3px_rgba(0,0,0,0.1)] transition-all" style={{ backgroundColor: '#cc947f', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(204, 148, 127, 0.6)' }}>
                  <span className="font-sans font-medium text-white">Book Now</span>
                </div>
              </button>
              <button
                onClick={openQuiz}
                className="relative group"
              >
                <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-50" />
                <div className="relative px-8 py-3.5 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_3px_rgba(0,0,0,0.1)] hover:bg-white/60 transition-all">
                  <span className="font-sans font-medium text-dune">Find Your Look</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}
