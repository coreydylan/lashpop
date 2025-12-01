'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { usePanelStack } from '@/contexts/PanelStackContext'
import { GoogleLogoCompact, YelpLogoCompact, VagaroLogoCompact } from '@/components/icons/ReviewLogos'
import { gsap, ScrollTrigger, initGSAP } from '@/lib/gsap'

interface HeroSectionProps {
  reviewStats?: Array<{
    id: string
    source: string
    rating: string
    reviewCount: number
  }>
}

// Import the exact same icons from v1
function SunIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"
        strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" />
    </svg>
  )
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

export default function HeroSection({ reviewStats }: HeroSectionProps) {
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
                className="font-league-script text-dune leading-none mb-[-0.25rem]"
                style={{ fontSize: '2.5rem' }}
              >
                welcome to
              </h1>
              <div
                className="font-serif text-dune"
                style={{ fontSize: '1.875rem', fontWeight: 400 }}
              >
                LashPop Studios
              </div>
              <div
                className="font-serif text-dusty-rose italic mt-2"
                style={{ fontSize: '1rem' }}
              >
                Effortless Beauty for the Modern Woman
              </div>

              {/* Oceanside California - ANCHORED at bottom of 100dvh */}
              <div className="flex items-center justify-center gap-2 text-golden pt-3">
                <SunIcon className="w-4 h-4" />
                <span className="text-xs tracking-wide uppercase">Oceanside, California</span>
              </div>
            </motion.div>
          </div>

          {/* BELOW THE FOLD - gradient from cream to pink to match next section */}
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
                      <div className="flex items-center gap-1.5 pr-2.5 border-r border-dune/10">
                        <GoogleLogoCompact />
                        <YelpLogoCompact />
                        <VagaroLogoCompact />
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

              {/* Award badge - Frosted glass chip */}
              <div className="relative group w-full">
                <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-50" />
                <div className="relative py-2.5 px-5 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_3px_rgba(0,0,0,0.1)]">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-medium text-terracotta">Award Winning</span>
                    <div className="h-3.5 w-px bg-gradient-to-b from-transparent via-dune/20 to-transparent" />
                    <span className="text-sm font-medium text-dune/80">Best Lash Studio</span>
                  </div>
                </div>
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
            {/* Location accent */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex items-center gap-2 text-golden"
            >
              <SunIcon className="w-5 h-5" />
              <span className="caption">Oceanside, California</span>
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
                className="font-league-script text-dune leading-none pl-2"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
              >
                welcome to
              </h1>
              <div
                className="font-serif text-dune -mt-6 relative z-10"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 400 }}
              >
                LashPop Studios
              </div>
              <div
                className="font-serif text-dusty-rose italic mt-2"
                style={{ fontSize: 'clamp(1rem, 2.5vw, 1.75rem)' }}
              >
                Effortless Beauty for the Modern Woman
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

          {/* Right Content - Arch Image */}
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
                <div className="relative w-full h-full overflow-hidden">
                  <Image
                    ref={imageRef}
                    src="/lashpop-images/studio/studio-photos-by-salome.jpg"
                    alt="LashPop Studio Interior"
                    fill
                    className="object-cover object-right"
                    priority
                    quality={85}
                    style={{ transform: "scale(1.4) translateX(0%)", transformOrigin: "center center" }}
                  />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-ocean-mist/20 to-transparent pointer-events-none" />

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="absolute bottom-8 left-8 right-8 glass rounded-2xl p-6 z-30"
                >
                  <p className="caption text-terracotta mb-2">Award Winning</p>
                  <p className="text-lg font-light text-dune">Best Lash Studio • North County SD</p>
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