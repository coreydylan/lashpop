'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { MobileSwipeableWelcomeCards } from '../MobileSwipeableWelcomeCards'
import { usePanelStack } from '@/contexts/PanelStackContext'
import { ScrollServicesTrigger } from '../ScrollServicesTrigger'

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


interface WelcomeSectionProps {
  isMobile?: boolean;
}

export function WelcomeSection({ isMobile: propIsMobile }: WelcomeSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-20%" })
  const [stateIsMobile, setIsMobile] = useState(false)
  const { actions: panelActions, state: panelState } = usePanelStack()
  const hasTriggeredChipBar = useRef(false)

  // Use prop if available, otherwise fall back to internal state
  const isMobile = propIsMobile ?? stateIsMobile;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle card change - trigger chip bar when card 4 (index 3) becomes visible
  const handleCardChange = useCallback((index: number) => {
    // Card 4 mentions the "service bar above" - trigger chip bar here
    if (index === 3 && !hasTriggeredChipBar.current) {
      hasTriggeredChipBar.current = true
      // Check if category-picker panel already exists
      const hasCategoryPicker = panelState.panels.some(p => p.type === 'category-picker')
      if (hasCategoryPicker) {
        // Already visible - trigger attention bounce
        panelActions.triggerAttentionBounce()
      } else {
        // Open in collapsed state (chip bar) with a bounce
        panelActions.openPanel('category-picker', { entryPoint: 'welcome-card' }, { autoExpand: false })
        // Trigger bounce after the chip bar appears
        setTimeout(() => {
          panelActions.triggerAttentionBounce()
        }, 400)
      }
    }
  }, [panelActions, panelState.panels])

  // Mobile-specific render with swipeable cards over desk image background
  if (isMobile) {
    return (
      <section
        ref={ref}
        // Ghost spacer height defines how long the Welcome section stays "pinned"
        // 200dvh gives us: 100dvh for entry + 100dvh for "dwell time"
        // We use inline style for minHeight to ensure it overrides the global .mobile-section CSS
        className="relative w-full flex flex-col"
        style={{ minHeight: '200dvh' }}
        data-section-id="welcome"
      >
        {/* Sticky Content Container 
            - sticky top-0: Sticks to viewport top
            - h-[100dvh]: Occupies full viewport
            - flex/flex-col: Layout matching original
        */}
        <div 
          className="sticky top-0 left-0 h-[100dvh] w-full flex flex-col z-10 overflow-hidden"
        >
          {/* Background Image - Restored for seamless scroll from Hero */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/lashpop-images/frontdeskeditwgradientedit2.webp"
              alt="LashPop Studio Desk"
              quality={100}
              fill
              sizes="100vw"
              className="object-cover object-[45%_center]"
              priority
            />
          </div>
          
          {/* Content Container with Safe Zone */}
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pb-[45dvh] pt-16 px-6">
            {/* LP Logo - bigger size */}
            <div
              className="h-20 w-48 mb-5 flex-shrink-0"
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

            {/* Swipeable Welcome Cards */}
            <MobileSwipeableWelcomeCards onCardChange={handleCardChange} />
          </div>
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

            <motion.div
              className="font-sans mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              <p className="text-lg md:text-xl font-light leading-relaxed mb-4" style={{ color: '#8a5e55' }}>
                We&apos;re a collective of women-owned beauty businesses who believe looking amazing shouldn&apos;t require a 30-minute morning routine.
              </p>
              <p className="text-xl md:text-2xl font-medium tracking-wide" style={{ color: '#6d4a43' }}>
                Beauty should feel easy, natural, and kind of life-changing.
              </p>
            </motion.div>

            <motion.div
              className="font-sans mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <p className="text-sm tracking-[0.2em] uppercase font-light mb-4" style={{ color: '#8a5e55' }}>
                No pressure · No judgment · Just great work
              </p>
              <p className="text-base md:text-lg font-light leading-relaxed" style={{ color: '#8a5e55' }}>
                When you walk into our studio, you&apos;re stepping into a space designed to help you breathe a little deeper and walk out feeling like the most refreshed version of yourself.
              </p>
            </motion.div>

            <motion.div
              className="font-sans mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              <p className="text-sm tracking-[0.15em] uppercase font-light mb-4 opacity-80" style={{ color: '#8a5e55' }}>
                Lashes · Brows · Permanent Makeup · Facials · Waxing · Injectables · Permanent Jewelry
              </p>
              <p className="text-base md:text-lg font-light leading-relaxed" style={{ color: '#8a5e55' }}>
                Each service is done with precision and intention—making your mornings smoother and your confidence louder.
              </p>
            </motion.div>

            {/* Closing statement */}
            <motion.div
              className="font-sans mt-6 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              <p className="text-xs tracking-[0.3em] uppercase font-light opacity-60 mb-2" style={{ color: '#8a5e55' }}>
                Welcome to
              </p>
              <p className="text-2xl md:text-3xl font-medium tracking-wide" style={{ color: '#6d4a43' }}>
                Your new favorite part of the week.
              </p>
            </motion.div>

            {/* Desktop only - services hint with scroll trigger for auto-loading services bar */}
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.7, ease: [0.23, 1, 0.32, 1] }}
            >
              <p className="text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 opacity-70"
                style={{ color: '#8a5e55' }}>
                <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Explore services above
              </p>
              {/* Invisible trigger that auto-opens the services bar when scrolled into view */}
              <ScrollServicesTrigger />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}