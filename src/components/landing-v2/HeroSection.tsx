'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { usePanelStack } from '@/contexts/PanelStackContext'
import { GoogleLogoCompact, YelpLogoCompact, VagaroLogoCompact } from '@/components/icons/ReviewLogos'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

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

  // Mobile scroll state - controlled by internal scroll, not page scroll
  const [heroScrollProgress, setHeroScrollProgress] = useState(0)
  const [heroScrollComplete, setHeroScrollComplete] = useState(false)
  const heroContentRef = useRef<HTMLDivElement>(null)

  const { actions: panelActions } = usePanelStack()
  const [isMobile, setIsMobile] = useState(false)

  // Calculate total reviews
  const totalReviews = reviewStats?.reduce((sum, stat) => sum + stat.reviewCount, 0) || 0

  // GSAP Animation for Background Pan (Desktop only)
  useEffect(() => {
    if (!imageRef.current || !imageContainerRef.current) return

    const mm = gsap.matchMedia()

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

    return () => mm.revert()
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

  // Mobile hero scroll handler - ALL scroll events route to hero content first
  useEffect(() => {
    if (!isMobile) return

    const heroContent = heroContentRef.current
    if (!heroContent) return

    let touchStartY = 0

    const getScrollState = () => {
      const { scrollTop, scrollHeight, clientHeight } = heroContent
      const maxScroll = Math.max(1, scrollHeight - clientHeight)
      const atBottom = scrollTop >= maxScroll - 2
      const atTop = scrollTop <= 2
      return { scrollTop, maxScroll, atBottom, atTop }
    }

    // Lock/unlock page scroll
    const setPageScrollLocked = (locked: boolean) => {
      if (locked) {
        document.documentElement.style.overflow = 'hidden'
        document.body.style.overflow = 'hidden'
      } else {
        document.documentElement.style.overflow = ''
        document.body.style.overflow = ''
      }
    }

    // Lock body scroll initially
    if (!heroScrollComplete) {
      setPageScrollLocked(true)
    }

    // Capture ALL wheel events at the window level
    const handleWheel = (e: WheelEvent) => {
      const { scrollTop, maxScroll, atBottom } = getScrollState()

      // Phase 1: Hero not complete - all scrolls control hero content
      if (!heroScrollComplete) {
        e.preventDefault()
        e.stopPropagation()

        // Scrolling down
        if (e.deltaY > 0) {
          if (!atBottom) {
            heroContent.scrollTop = Math.min(maxScroll, scrollTop + e.deltaY)
            setHeroScrollProgress(heroContent.scrollTop / maxScroll)
          } else {
            // Reached bottom - unlock page scroll
            setHeroScrollComplete(true)
            setHeroScrollProgress(1)
            setPageScrollLocked(false)
          }
        }
        // Scrolling up
        else if (e.deltaY < 0) {
          heroContent.scrollTop = Math.max(0, scrollTop + e.deltaY)
          setHeroScrollProgress(heroContent.scrollTop / maxScroll)
        }
      }
      // Phase 2: Hero complete, but user scrolling up at top of page - re-engage hero
      else if (e.deltaY < 0 && window.scrollY <= 5) {
        e.preventDefault()
        e.stopPropagation()
        setHeroScrollComplete(false)
        setPageScrollLocked(true)
        // Set hero content to bottom so we can scroll up from there
        heroContent.scrollTop = maxScroll
        setHeroScrollProgress(1)
      }
      // Otherwise let page scroll naturally
    }

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY
    }

    // Capture ALL touch events
    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY
      const deltaY = touchStartY - touchY // positive = scrolling down
      touchStartY = touchY

      const { scrollTop, maxScroll, atBottom } = getScrollState()

      // Phase 1: Hero not complete - all scrolls control hero content
      if (!heroScrollComplete) {
        e.preventDefault()

        // Scrolling down
        if (deltaY > 0) {
          if (!atBottom) {
            heroContent.scrollTop = Math.min(maxScroll, scrollTop + deltaY * 1.5)
            setHeroScrollProgress(heroContent.scrollTop / maxScroll)
          } else {
            // Reached bottom - unlock page scroll
            setHeroScrollComplete(true)
            setHeroScrollProgress(1)
            setPageScrollLocked(false)
          }
        }
        // Scrolling up
        else if (deltaY < 0) {
          heroContent.scrollTop = Math.max(0, scrollTop + deltaY * 1.5)
          setHeroScrollProgress(heroContent.scrollTop / maxScroll)
        }
      }
      // Phase 2: Hero complete, but user scrolling up at top of page - re-engage hero
      else if (deltaY < 0 && window.scrollY <= 5) {
        e.preventDefault()
        setHeroScrollComplete(false)
        setPageScrollLocked(true)
        heroContent.scrollTop = maxScroll
        setHeroScrollProgress(1)
      }
      // Otherwise let page scroll naturally
    }

    // Handle scrolling back up to re-engage hero
    const handlePageScroll = () => {
      if (heroScrollComplete && window.scrollY <= 0) {
        // User scrolled back to top - re-engage hero scroll
        setHeroScrollComplete(false)
        setPageScrollLocked(true)
        const { maxScroll } = getScrollState()
        heroContent.scrollTop = maxScroll
        setHeroScrollProgress(1)
      }
    }

    // Use capture phase to intercept ALL events before they reach any element
    window.addEventListener('wheel', handleWheel, { passive: false, capture: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true })
    window.addEventListener('scroll', handlePageScroll, { passive: true })

    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true })
      window.removeEventListener('touchstart', handleTouchStart, { capture: true })
      window.removeEventListener('touchmove', handleTouchMove, { capture: true })
      window.removeEventListener('scroll', handlePageScroll)
      // Ensure scroll is restored on cleanup
      setPageScrollLocked(false)
    }
  }, [isMobile, heroScrollComplete])

  // ============================================
  // MOBILE LAYOUT - Only arch is fixed, everything else is page flow
  // ============================================
  if (isMobile) {
    return (
      <section ref={containerRef} className="relative">
        {/* ===== FIXED LAYER: Arch background (z-0) - behind page ===== */}
        {/* Only fades AFTER internal scroll is complete */}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            opacity: heroScrollComplete ? 0 : 1,
            transition: 'opacity 0.3s ease-out',
          }}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-cream via-[rgb(235,224,203)] to-[rgb(226,182,166)]" />

          {/* Floating decorative circles */}
          <div className="absolute top-20 right-4 w-20 h-20">
            <CircleDecoration className="text-dusty-rose" />
          </div>
          <div className="absolute bottom-48 left-4 w-16 h-16">
            <CircleDecoration className="text-sage" />
          </div>

          {/* Arch Image - Bottom aligned, 85% viewport height */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center">
            <div
              className="relative w-[80vw] max-w-[380px] overflow-hidden"
              style={{
                borderRadius: 'clamp(120px, 40vw, 190px) clamp(120px, 40vw, 190px) 0 0',
                height: '85dvh',
              }}
            >
              <Image
                src="/lashpop-images/studio/studio-photos-by-salome.jpg"
                alt="LashPop Studio Interior"
                fill
                className="object-cover object-center"
                priority
                quality={85}
              />
            </div>
          </div>
        </div>

        {/* ===== PAGE FLOW: Spacer + Hero content area (z-10) ===== */}
        <div className="relative z-10 min-h-[100dvh] flex flex-col">
          {/* Spacer - pushes gradient+content to bottom */}
          <div className="flex-1" />

          {/* Combined gradient + content container - fixed 30dvh height */}
          {/* Only fades AFTER internal scroll is complete (heroScrollComplete) */}
          <div
            className="relative"
            style={{
              height: '30dvh',
              opacity: heroScrollComplete ? 0 : 1,
              transition: 'opacity 0.3s ease-out',
            }}
          >
            {/* Bottom gradient background - FIXED in place, doesn't scroll */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to top, rgb(247, 244, 240) 0%, rgb(247, 244, 240) 30%, rgba(247, 244, 240, 0.85) 60%, rgba(247, 244, 240, 0.5) 80%, rgba(247, 244, 240, 0) 100%)',
              }}
            />

            {/* Scrollable content area - with gradient mask at top for soft fade */}
            <div
              ref={heroContentRef}
              className="absolute inset-0 overflow-y-auto overscroll-contain px-6"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)',
              }}
            >
              {/* Hero text content - sized to fit exactly in container with Oceanside at bottom */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-center flex flex-col justify-end"
                style={{ minHeight: '30dvh', paddingBottom: '8px' }}
              >
                <div>
                  <h1
                    className="font-league-script text-dune leading-none"
                    style={{ fontSize: '2.5rem' }}
                  >
                    welcome to
                  </h1>
                  <div
                    className="font-serif text-dune mt-1"
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

                  {/* Oceanside California - THIS IS THE FOLD LINE */}
                  <div className="flex items-center justify-center gap-2 text-golden pt-3">
                    <SunIcon className="w-4 h-4" />
                    <span className="text-xs tracking-wide uppercase">Oceanside, California</span>
                  </div>
                </div>
              </motion.div>

              {/* Below-the-fold content - buttons and chips */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="mx-auto flex w-full max-w-[300px] flex-col gap-3 pt-4"
              >
                <button
                  onClick={() => panelActions.openPanel('category-picker', { entryPoint: 'hero-mobile' })}
                  className="w-full py-4 px-6 rounded-2xl bg-dusty-rose text-white font-medium text-base shadow-sm active:scale-[0.98] transition-transform"
                >
                  Book Now
                </button>

                <button
                  onClick={() => panelActions.openPanel('discovery', {})}
                  className="w-full py-4 px-6 rounded-2xl bg-white border border-dusty-rose/30 text-dune font-medium text-base shadow-sm active:scale-[0.98] transition-transform"
                >
                  Discover Your Look
                </button>

                {totalReviews > 0 && (
                  <button
                    onClick={() => {
                      setHeroScrollComplete(true)
                      document.documentElement.style.overflow = ''
                      document.body.style.overflow = ''
                      setTimeout(() => {
                        const reviewsSection = document.getElementById('reviews');
                        if (reviewsSection) {
                          reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 100)
                    }}
                    className="w-full py-4 px-6 rounded-2xl bg-white border border-dusty-rose/30 text-dune font-medium text-base shadow-sm active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex items-center gap-1">
                        <GoogleLogoCompact />
                        <YelpLogoCompact />
                        <VagaroLogoCompact />
                      </div>
                      <span className="font-semibold">{totalReviews.toLocaleString()}</span>
                      <div className="flex items-center -space-x-0.5">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-4 h-4 text-golden" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ))}
                      </div>
                      <span className="text-sm text-dune/70">Reviews</span>
                    </div>
                  </button>
                )}

                <div className="w-full py-4 px-6 rounded-2xl bg-white border border-dusty-rose/30 text-dune font-medium text-base shadow-sm">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-terracotta">Award Winning</span>
                    <span className="text-dune/70">•</span>
                    <span>Best Lash Studio</span>
                  </div>
                </div>

                {/* Extra space at bottom for scrolling */}
                <div className="h-16" />
              </motion.div>
            </div>
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