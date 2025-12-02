'use client'

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { usePanelStack } from '@/contexts/PanelStackContext'
import { GoogleLogoCompact, YelpLogoCompact, VagaroLogoCompact } from '@/components/icons/ReviewLogos'
import { gsap, ScrollTrigger, initGSAP } from '@/lib/gsap'
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

  const { scrollY } = useScroll({ layoutEffect: false } as any)

  // ALL useTransform hooks must be called unconditionally at top level
  const y = useTransform(scrollY, [0, 500], [0, 150])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  const yCircle2 = useTransform(scrollY, [0, 500], [0, -100])
  const yCircle3 = useTransform(scrollY, [0, 500], [0, -60])
  const archFadeOpacity = useTransform(scrollY, [100, 600], [0, 1])

  // Mobile - no longer need internal scroll state
  const heroContentRef = useRef<HTMLDivElement>(null)

  const { actions: panelActions } = usePanelStack()
  const [isMobile, setIsMobile] = useState(false)
  const [awardExpanded, setAwardExpanded] = useState(false)
  const awardBadgeRef = useRef<HTMLDivElement>(null)

  // Calculate total reviews
  const totalReviews = reviewStats?.reduce((sum, stat) => sum + stat.reviewCount, 0) || 0

  // GSAP Animation for Background Pan (Desktop only)
  useEffect(() => {
    if (!imageRef.current || !imageContainerRef.current) return

    let mm: gsap.MatchMedia | null = null

    // Initialize GSAP deferred, then set up animations
    initGSAP().then(() => {
      mm = gsap.matchMedia()

      mm.add("(min-width: 768px)", () => {
        const image = imageRef.current
        const container = imageContainerRef.current

        if (!image || !container) return

        // Initial pan animation on load
        gsap.fromTo(image,
          {
            scale: 1.4,
            xPercent: 0,
          },
          {
            scale: 1.2,
            xPercent: 20,
            duration: 4,
            ease: "power2.out"
          }
        )

        // Pin the arch container so it stays at the bottom of the viewport while fading out
        ScrollTrigger.create({
          trigger: container,
          start: "bottom bottom",
          end: "+=500",
          pin: true,
          pinSpacing: false,
          anticipatePin: 1,
        })

        // Scroll-triggered pan animation (parallax)
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: container,
            start: "top center",
            end: "bottom top",
            scrub: 1,
          }
        })

        tl.to(image, {
          xPercent: 25,
          ease: "none"
        }, 0)
      })
    })

    return () => {
      if (mm) mm.revert()
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

  // Handle award badge expansion - dispatch event and scroll to show full badge
  useEffect(() => {
    if (!isMobile) return

    // Dispatch event so scroll system knows about the state change
    window.dispatchEvent(new CustomEvent('hero-award-toggle', {
      detail: { expanded: awardExpanded }
    }))

    // If expanded and we have a ref, scroll to ensure badge is visible
    if (awardExpanded && awardBadgeRef.current) {
      // Small delay to let the animation start
      setTimeout(() => {
        const container = document.querySelector('.mobile-scroll-container')
        if (!container || !awardBadgeRef.current) return

        const badgeRect = awardBadgeRef.current.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        const viewportHeight = window.innerHeight

        // Check if badge bottom is below viewport (with some padding)
        const padding = 40
        if (badgeRect.bottom > viewportHeight - padding) {
          // Calculate how much to scroll to show the full badge
          const scrollAmount = badgeRect.bottom - viewportHeight + padding + 60 // extra for expanded content
          const currentScroll = container.scrollTop

          // Smooth scroll to show the badge
          container.scrollTo({
            top: currentScroll + scrollAmount,
            behavior: 'smooth'
          })
        }
      }, 50)
    }
  }, [awardExpanded, isMobile])

  // No more custom scroll handling needed - page scrolls naturally
  // Mobile background (arch, gradient, logo) is now handled by MobileHeroBackground component

  // ============================================
  // MOBILE LAYOUT - Content only (background handled by MobileHeroBackground)
  // ============================================
  if (isMobile) {
    return (
      <section ref={containerRef} className="relative min-h-[100dvh]" style={{ background: 'transparent' }}>
        {/*
          NOTE: The fixed background layer (arch, gradient, logo, circles) is now
          rendered by MobileHeroBackground in LandingPageV2Client.tsx.
          This section ONLY contains the scrollable content.
          The transparent background allows MobileHeroBackground to show through.
        */}

        {/* ===== PAGE FLOW CONTENT - scrolls with page over the arch ===== */}
        <div className="relative">
          {/* ABOVE THE FOLD - exactly 100dvh, gradient covers bottom ~35% with readable text area */}
          {/* Uses flex to push content to bottom, Oceanside anchored at very bottom */}
          <div
            className="relative flex flex-col justify-end px-6"
            style={{
              height: '100dvh',
              background: 'linear-gradient(to top, rgb(235, 224, 203) 0%, rgba(235, 224, 203, 0.98) 8%, rgba(235, 224, 203, 0.92) 15%, rgba(235, 224, 203, 0.75) 25%, rgba(235, 224, 203, 0.4) 32%, transparent 40%)',
            }}
          >
            {/* Hero text content - near bottom of viewport with breathing room */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-center pb-8"
            >
              <h1
                className="font-licorice text-dune leading-none"
                style={{ fontSize: '2.5rem' }}
              >
                naturally effortless
              </h1>
              <div
                className="font-serif text-dune -mt-1"
                style={{ fontSize: '2rem', fontWeight: 400, letterSpacing: '0.05em' }}
              >
                lashes + beauty
              </div>
              <div className="-mt-0.5">
                <span
                  className="font-serif text-dusty-rose"
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 500,
                    letterSpacing: '0.03em',
                    backgroundColor: 'rgba(255, 255, 255, 0.35)',
                    padding: '0.1em 0.4em',
                    boxDecorationBreak: 'clone',
                  }}
                >
                  for the modern woman
                </span>
              </div>

              {/* Oceanside California with live weather - ANCHORED at bottom of 100dvh */}
              <div className="flex items-center justify-center pt-3">
                <WeatherLocationBadge size="sm" />
              </div>
            </motion.div>
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
              background: 'linear-gradient(to bottom, rgb(235, 224, 203) 0%, rgb(235, 224, 203) 60%, rgb(226, 182, 166) 100%)',
            }}
          >
            {/* Buttons and chips - immediately below the fold */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="mx-auto flex w-full max-w-[300px] flex-col gap-3"
            >
              {/* Book Now - Primary frosted glass button with dusty rose fill */}
              <button
                onClick={() => panelActions.openPanel('category-picker', { entryPoint: 'hero-mobile' })}
                className="relative group w-full"
              >
                <div className="absolute inset-0 rounded-full bg-dusty-rose/20 blur-md opacity-50 group-hover:opacity-70 transition-opacity" />
                <div className="relative py-3.5 px-6 rounded-full bg-dusty-rose/90 backdrop-blur-md border border-dusty-rose/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_1px_3px_rgba(0,0,0,0.1)] active:scale-[0.98] transition-all">
                  <span className="font-medium text-base text-white">Book Now</span>
                </div>
              </button>

              {/* Discover Your Look - Frosted glass secondary button */}
              <button
                onClick={() => panelActions.openPanel('discovery', {})}
                className="relative group w-full"
              >
                <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-50 group-hover:opacity-70 transition-opacity" />
                <div className="relative py-3.5 px-6 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_3px_rgba(0,0,0,0.1)] active:scale-[0.98] transition-all group-hover:bg-white/60">
                  <span className="font-medium text-base text-dune">Discover Your Look</span>
                </div>
              </button>

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
                  <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-50 group-hover:opacity-70 transition-opacity" />
                  <div className="relative py-3 px-5 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_3px_rgba(0,0,0,0.1)] active:scale-[0.98] transition-all group-hover:bg-white/60">
                    <div className="flex items-center justify-center gap-2.5">
                      <div className="flex items-center gap-1.5 pr-2.5 border-r border-dune/10 text-dusty-rose">
                        <GoogleLogoCompact monochrome />
                        <YelpLogoCompact monochrome />
                        <VagaroLogoCompact monochrome />
                      </div>
                      <span className="font-semibold text-sm text-dune">{totalReviews.toLocaleString()}</span>
                      <div className="flex items-center -space-x-0.5">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-3.5 h-3.5 text-golden" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-dune/60 font-medium">Reviews</span>
                    </div>
                  </div>
                </button>
              )}

              {/* Award badge - Frosted glass chip with expandable Reader logo */}
              <div ref={awardBadgeRef} className="relative w-full flex flex-col items-center">
                <button
                  onClick={() => setAwardExpanded(!awardExpanded)}
                  className="relative group w-full"
                >
                  <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-50 group-hover:opacity-70 transition-opacity" />
                  <div className="relative py-2.5 px-5 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_3px_rgba(0,0,0,0.1)] active:scale-[0.98] transition-all group-hover:bg-white/60">
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span className="text-sm font-medium text-dusty-rose">Voted Best Lash Studio</span>
                      <span className="text-xs font-medium text-dune/70">San Diego Reader</span>
                    </div>
                  </div>
                </button>

                {/* Expandable Reader logo */}
                <AnimatePresence>
                  {awardExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <motion.a
                        href="https://2024.northcountybestof.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.8 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="block w-[60%] mx-auto"
                        style={{ maxWidth: '180px' }}
                      >
                        <Image
                          src="/lashpop-images/reader-best-of-2024.webp"
                          alt="North County Reader Best of 2024"
                          width={183}
                          height={205}
                          className="w-full h-auto"
                        />
                      </motion.a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    )
  }

  // ============================================
  // DESKTOP LAYOUT - Original side-by-side
  // ============================================
  return (
    <section ref={containerRef} className="relative h-screen flex items-end">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cream via-[rgb(235,224,203)] to-[rgb(226,182,166)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-sage/5" />

        {/* Floating circles with parallax */}
        <motion.div
          style={{ y }}
          className="absolute top-10 right-10 w-48 h-48"
        >
          <CircleDecoration className="text-dusty-rose" />
        </motion.div>

        <motion.div
          style={{ y: yCircle2 }}
          className="absolute bottom-40 left-10 w-36 h-36"
        >
          <CircleDecoration className="text-sage" />
        </motion.div>

        <motion.div
          style={{ y: yCircle3 }}
          className="absolute bottom-32 right-20 w-24 h-24 opacity-50"
        >
          <CircleDecoration className="text-golden" />
        </motion.div>
      </div>

      {/* Main Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 container-wide"
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-end h-full pb-0">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 mb-[28vh]"
          >
            {/* Location accent with live weather on hover */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <WeatherLocationBadge size="md" />
            </motion.div>

            {/* Reviews Chip */}
            {totalReviews > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="inline-block"
              >
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
                  <div className="absolute inset-0 rounded-full bg-golden/10 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                  <div className="relative px-3 py-1.5 rounded-full bg-white/40 backdrop-blur-sm border border-white/50 shadow-sm transition-all duration-300 group-hover:bg-white/60 group-hover:scale-105">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 pr-2 border-r border-dusty-rose/30 text-dusty-rose">
                        <GoogleLogoCompact monochrome />
                        <YelpLogoCompact monochrome />
                        <VagaroLogoCompact monochrome />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-serif text-sm font-semibold text-dune">
                          {totalReviews.toLocaleString()}
                        </span>
                        <div className="flex items-center -space-x-0.5">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-3.5 h-3.5 text-golden" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="font-serif text-xs text-dune ml-0.5">Reviews</span>
                      </div>
                    </div>
                  </div>
                </button>
              </motion.div>
            )}

            {/* Main heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="relative -mt-2"
            >
              <h1
                className="font-licorice text-dune leading-none"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
              >
                naturally effortless
              </h1>
              <div
                className="font-serif text-dune -mt-2 relative z-10"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 400, letterSpacing: '0.05em' }}
              >
                lashes + beauty
              </div>
              <div className="-mt-1">
                <span
                  className="font-serif text-dusty-rose"
                  style={{
                    fontSize: 'clamp(1rem, 2.5vw, 1.75rem)',
                    fontWeight: 500,
                    letterSpacing: '0.03em',
                    backgroundColor: 'rgba(255, 255, 255, 0.35)',
                    padding: '0.1em 0.4em',
                    boxDecorationBreak: 'clone',
                  }}
                >
                  for the modern woman
                </span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-row gap-4 pt-4"
            >
              <button
                onClick={() => {
                  const offset = 64
                  window.scrollTo({ top: window.innerHeight - offset, behavior: 'smooth' })
                  panelActions.openPanel('category-picker', { entryPoint: 'hero' })
                }}
                className="btn btn-primary"
              >
                Book Now
              </button>
              <button
                onClick={() => panelActions.openPanel('discovery', {})}
                className="btn btn-secondary"
              >
                Discover Your Look
              </button>
            </motion.div>
          </motion.div>

          {/* Right Content - Arch Image or Slideshow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-full flex items-end pl-[65px]"
          >
            <div className="relative w-full h-full flex items-end">
              <div
                ref={imageContainerRef}
                className="relative w-full h-[85vh] rounded-[200px_200px_0_0] overflow-hidden"
                style={{ transformOrigin: 'bottom center', zIndex: 20 }}
              >
                {hasSlideshow && heroConfig?.preset ? (
                  /* Slideshow Mode - render the carousel */
                  <HeroArchSlideshow preset={heroConfig.preset} className="w-full h-full" />
                ) : (
                  /* Single Image Mode - original behavior */
                  /* Use absolute positioning with negative inset to ensure full coverage at all screen widths */
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      ref={imageRef}
                      src={archImage.url}
                      alt="LashPop Studio Interior"
                      fill
                      className="object-cover"
                      priority
                      quality={85}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      style={{
                        transform: "scale(1.4) translateX(0%)",
                        transformOrigin: "center center",
                        objectPosition: `${archImage.position.x}% ${archImage.position.y}%`
                      }}
                    />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-ocean-mist/20 to-transparent pointer-events-none" />

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="absolute bottom-8 left-8 right-8 z-30"
                >
                  <div
                    className="glass rounded-2xl p-6 cursor-pointer group transition-all duration-300 hover:bg-white/50"
                    onMouseEnter={() => setAwardExpanded(true)}
                    onMouseLeave={() => setAwardExpanded(false)}
                    onClick={() => setAwardExpanded(!awardExpanded)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-dusty-rose font-medium mb-1">Voted Best Lash Studio</p>
                        <p className="text-sm text-dune/70">San Diego Reader</p>
                      </div>
                      <AnimatePresence>
                        {awardExpanded && (
                          <motion.a
                            href="https://2024.northcountybestof.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, scale: 0.8, width: 0 }}
                            animate={{ opacity: 1, scale: 1, width: 80 }}
                            exit={{ opacity: 0, scale: 0.8, width: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="flex-shrink-0 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Image
                              src="/lashpop-images/reader-best-of-2024.webp"
                              alt="North County Reader Best of 2024"
                              width={80}
                              height={89}
                              className="w-full h-auto"
                            />
                          </motion.a>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute inset-0 bg-cream pointer-events-none z-40"
                  style={{ opacity: archFadeOpacity }}
                />
              </div>

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-warm-sand/50 blur-2xl z-10"
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}