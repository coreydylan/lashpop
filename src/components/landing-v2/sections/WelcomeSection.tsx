'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { MobileSwipeableWelcomeCards } from '../MobileSwipeableWelcomeCards'

// Dynamically import ParallaxImage to avoid SSR issues with Three.js
const ParallaxImage = dynamic(() => import('@/components/three/ParallaxImage'), {
  ssr: false,
  loading: () => (
    <Image
      src="/lashpop-images/frontdeskeditwgradientedit2.webp"
      alt="LashPop Studio Desk"
      quality={100}
      fill
      sizes="100vw"
      className="object-cover object-[35%_center] md:object-center"
      priority
    />
  ),
})

export function WelcomeSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-20%" })
  const [isMobile, setIsMobile] = useState(false)
  const [isScrollLocked, setIsScrollLocked] = useState(false)
  const [hasViewedAllCards, setHasViewedAllCards] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle scroll locking when cards section is in view
  useEffect(() => {
    if (!isMobile || hasViewedAllCards) return

    const scrollContainer = document.querySelector('.mobile-scroll-container') as HTMLElement
    const section = sectionRef.current
    if (!scrollContainer || !section) return

    let isLocked = false

    const handleScroll = () => {
      if (hasViewedAllCards) return

      const rect = section.getBoundingClientRect()
      const viewportHeight = window.innerHeight

      // Lock when section is centered in viewport (top portion visible)
      const shouldLock = rect.top <= viewportHeight * 0.3 && rect.top >= -100 && !hasViewedAllCards

      if (shouldLock && !isLocked) {
        isLocked = true
        setIsScrollLocked(true)
        // Dispatch event to notify scroll system
        window.dispatchEvent(new CustomEvent('welcome-cards-lock', { detail: { locked: true } }))
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [isMobile, hasViewedAllCards])

  // Handle touch/wheel blocking when locked
  useEffect(() => {
    if (!isMobile || !isScrollLocked) return

    const scrollContainer = document.querySelector('.mobile-scroll-container') as HTMLElement
    if (!scrollContainer) return

    const preventWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
      }
    }

    // Prevent scroll during card viewing
    scrollContainer.style.overflow = 'hidden'

    // Add wheel prevention
    scrollContainer.addEventListener('wheel', preventWheel, { passive: false })

    return () => {
      scrollContainer.style.overflow = ''
      scrollContainer.removeEventListener('wheel', preventWheel)
    }
  }, [isMobile, isScrollLocked])

  // Callback when all cards have been viewed
  const handleAllCardsViewed = useCallback(() => {
    setHasViewedAllCards(true)
    setIsScrollLocked(false)

    const scrollContainer = document.querySelector('.mobile-scroll-container') as HTMLElement
    if (scrollContainer) {
      scrollContainer.style.overflow = ''
    }

    // Dispatch event to notify scroll system
    window.dispatchEvent(new CustomEvent('welcome-cards-lock', { detail: { locked: false } }))
  }, [])

  // Mobile-specific render with swipeable cards
  if (isMobile) {
    return (
      <section
        ref={sectionRef}
        className="mobile-section relative"
        data-section-id="welcome"
        style={{
          minHeight: '100dvh',
          background: 'linear-gradient(to bottom, rgb(226, 182, 166) 0%, rgb(235, 224, 203) 30%, rgb(235, 224, 203) 100%)',
        }}
      >
        {/* Content container */}
        <div className="relative z-10 flex flex-col items-center justify-start pt-12 pb-24">
          {/* LP Logo */}
          <motion.div
            className="relative mx-auto mb-6"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <div
              className="h-14 w-32 mx-auto"
              style={{
                maskImage: 'url(/lashpop-images/lp-logo.png)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: 'url(/lashpop-images/lp-logo.png)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                backgroundColor: '#8a5e55'
              }}
            />
          </motion.div>

          {/* Swipeable Cards */}
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <MobileSwipeableWelcomeCards
              onAllCardsViewed={handleAllCardsViewed}
            />
          </motion.div>

          {/* Scroll indicator after cards are done */}
          {hasViewedAllCards && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex flex-col items-center gap-2"
            >
              <span className="text-xs text-dune/40">Continue scrolling</span>
              <motion.svg
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-5 h-5 text-dune/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </motion.svg>
            </motion.div>
          )}
        </div>
      </section>
    )
  }

  // Desktop render with parallax background
  return (
    <section ref={ref} className="relative min-h-[115vh] overflow-hidden">
      {/* Background Image - 3D Parallax on desktop */}
      <div className="absolute inset-0 z-0">
        <ParallaxImage
          src="/lashpop-images/frontdeskeditwgradientedit2.webp"
          depthSrc="/lashpop-images/frontdeskeditwgradientedit2_depthv4.png"
          alt="LashPop Studio Desk"
          className="absolute inset-0 w-full h-full"
          parallaxAmount={0.15}
          scrollIntensity={0.3}
          scrollTrigger={{
            start: "top bottom",
            end: "bottom top",
          }}
        />
      </div>

      {/* Content Container with Safe Zone */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Text Area - Takes up top portion, leaving bottom 35% as safe zone */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-[45vh] pt-64">
          <motion.div
            className="container max-w-5xl text-center"
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          >
            <motion.div
              className="relative mx-auto mb-8"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* LP Logo with color mask */}
              <div
                className="h-32 w-full mx-auto"
                style={{
                  maskImage: 'url(/lashpop-images/lp-logo.png)',
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskImage: 'url(/lashpop-images/lp-logo.png)',
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  backgroundColor: '#8a5e55'
                }}
              />
            </motion.div>

            <motion.p
              className="text-lg md:text-xl font-sans font-light mb-6 leading-relaxed max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              style={{ color: '#8a5e55' }}
            >
              We are a collective of women-owned beauty businesses who believe in low-maintenance morning routines, and the magic of a premium beauty experience.<br /><br />At LashPop Studios, we are committed to unmatched customer service, professionalism, studio atmosphere, and building trusted client relationships.
            </motion.p>

            <motion.p
              className="text-base md:text-lg font-sans font-light mb-8 leading-relaxed max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
              style={{ color: '#8a5e55', opacity: 0.9 }}
            >
              Our team specializes in eyelash extensions, lash lifts and tints, microblading, permanent makeup, brow shaping and tinting, brow laminations, customized facials and HydraFacials, waxing, Botox, and permanent jewelry and more.
            </motion.p>

            {/* Desktop only - services hint */}
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              <p className="text-sm md:text-base uppercase tracking-widest flex items-center justify-center gap-3"
                style={{ color: '#8a5e55' }}>
                <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Explore our services using the menu above
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}