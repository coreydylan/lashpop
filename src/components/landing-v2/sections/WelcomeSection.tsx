'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { MobileSwipeableWelcomeCards } from '../MobileSwipeableWelcomeCards'
import { DesktopWelcomeCards } from '../DesktopWelcomeCards'
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
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-[40vh] pt-48">
          <motion.div
            className="container max-w-5xl text-center"
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* LP Logo with color mask */}
            <motion.div
              className="relative mx-auto mb-10"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              <div
                className="h-28 w-full mx-auto"
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

            {/* Desktop Swipeable Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              <DesktopWelcomeCards onCardChange={handleCardChange} />
            </motion.div>

            {/* Invisible trigger that auto-opens the services bar when scrolled into view */}
            <ScrollServicesTrigger />
          </motion.div>
        </div>
      </div>
    </section>
  )
}