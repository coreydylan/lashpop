'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
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


interface WelcomeSectionProps {
  isMobile?: boolean;
}

export function WelcomeSection({ isMobile: propIsMobile }: WelcomeSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-20%" })
  const [stateIsMobile, setIsMobile] = useState(false)

  // Use prop if available, otherwise fall back to internal state
  const isMobile = propIsMobile ?? stateIsMobile;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
            {/* Swipeable Welcome Cards with LP Logo - logo is now part of swipe area */}
            <MobileSwipeableWelcomeCards showLogo />
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
                  backgroundColor: '#ac4d3c'
                }}
              />
            </motion.div>

            <motion.div
              className="text-lg md:text-xl font-sans font-light mb-6 leading-relaxed max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              style={{ color: '#ac4d3c' }}
            >
              <span className="font-extralight opacity-80">At LashPop, we&apos;re a collective of</span>{' '}
              <span className="font-medium" style={{ color: '#ac4d3c' }}>women-owned beauty businesses</span>{' '}
              <span className="font-extralight opacity-80">who believe looking amazing shouldn&apos;t require a 30-minute morning routine</span>{' '}
              <span className="italic opacity-70">or a small emotional breakdown in front of the bathroom mirror.</span>
              <span className="block text-xl md:text-2xl font-display font-medium mt-4 tracking-wide" style={{ color: '#ac4d3c' }}>
                We&apos;re here to make beauty feel easy, natural, and—honestly—kind of life-changing.
              </span>
            </motion.div>

            <motion.div
              className="text-base md:text-lg font-sans font-light mb-6 leading-relaxed max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
              style={{ color: '#ac4d3c' }}
            >
              <span className="block text-xl md:text-2xl font-display font-medium mb-3" style={{ color: '#ac4d3c' }}>
                Everything we do is built on trust.
              </span>
              <span className="font-extralight opacity-80">When you walk into our studio, you&apos;re stepping into a space designed to help you breathe a little deeper and walk out feeling like</span>{' '}
              <span className="font-medium" style={{ color: '#ac4d3c' }}>the most refreshed, put-together version of yourself.</span>
              <span className="block mt-4 text-sm md:text-base tracking-[0.2em] uppercase font-light opacity-90">
                No pressure · No judgment · Just great work
              </span>
            </motion.div>

            <motion.div
              className="text-base md:text-lg font-sans font-light mb-8 leading-relaxed max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
              style={{ color: '#ac4d3c' }}
            >
              <span className="font-extralight opacity-80">Our artists are pros in all the good stuff:</span>
              <span className="block my-3 text-sm tracking-[0.15em] uppercase font-light opacity-75">
                lashes · brows · permanent makeup · facials · HydraFacials · waxing · injectables · permanent jewelry
              </span>
              <span>Each service is done with the kind of</span>{' '}
              <span className="font-medium" style={{ color: '#ac4d3c' }}>precision and intention</span>{' '}
              <span>that makes your</span>
              <span className="block text-lg md:text-xl font-display font-medium mt-3 tracking-wide" style={{ color: '#ac4d3c' }}>
                mornings smoother &amp; confidence louder.
              </span>
            </motion.div>

            {/* Desktop only - services hint with scroll trigger for auto-loading services bar */}
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              <p className="text-sm md:text-base uppercase tracking-widest flex items-center justify-center gap-3"
                style={{ color: '#ac4d3c' }}>
                <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Explore our services using the menu above
              </p>
            </motion.div>

            <motion.div
              className="text-center mt-10 leading-relaxed max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.7, ease: [0.23, 1, 0.32, 1] }}
              style={{ color: '#ac4d3c' }}
            >
              <span className="block text-sm uppercase tracking-[0.3em] font-light opacity-60 mb-2">Welcome to</span>
              <span className="block text-xl md:text-3xl font-display font-medium tracking-wide" style={{ color: '#ac4d3c' }}>
                your new favorite part of the week.
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}