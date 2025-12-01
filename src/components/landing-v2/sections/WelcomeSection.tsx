'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'

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

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <section ref={ref} className="relative min-h-[115vh] overflow-hidden">
      {/* Background Image - 3D Parallax on desktop */}
      <div className="absolute inset-0 z-0">
        {!isMobile ? (
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
        ) : (
          <Image
            src="/lashpop-images/frontdeskeditwgradientedit2.webp"
            alt="LashPop Studio Desk"
            quality={100}
            fill
            sizes="100vw"
            className="object-cover object-[35%_center] md:object-center"
            priority
          />
        )}
      </div>

      {/* Content Container with Safe Zone */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Text Area - Takes up top portion, leaving bottom 35% as safe zone */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-[50vh] md:pb-[45vh] pt-64">
          <motion.div
            className="container max-w-5xl text-center"
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          >
            <motion.div
              className="relative mx-auto mb-4 md:mb-8"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* LP Logo with color mask */}
              <div
                className="h-16 sm:h-20 md:h-32 w-full mx-auto"
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
              className="text-sm sm:text-lg md:text-xl font-sans font-light mb-4 md:mb-6 leading-relaxed max-w-xl md:max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              style={{ color: '#8a5e55' }} // Dark dusty rose
            >
              We are a collective of women-owned beauty businesses who believe in low-maintenance morning routines, and the magic of a premium beauty experience.<br /><br />At LashPop Studios, we are committed to unmatched customer service, professionalism, studio atmosphere, and building trusted client relationships.
            </motion.p>

            <motion.p
              className="text-xs sm:text-base md:text-lg font-sans font-light mb-6 md:mb-8 leading-relaxed max-w-xl md:max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
              style={{ color: '#8a5e55', opacity: 0.9 }} // Slightly lighter
            >
              Our team specializes in eyelash extensions, lash lifts and tints, microblading, permanent makeup, brow shaping and tinting, brow laminations, customized facials and HydraFacials, waxing, Botox, and permanent jewelry and more.
            </motion.p>

            {/* Hide on mobile - services panel is a bottom sheet, not a top menu */}
            <motion.div
              className="mt-8 hidden md:block"
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

        {/* Safe Zone - Bottom 35% of screen where no text appears */}
        {/* This area stays empty to preserve the visual elements in the desk image */}
      </div>
    </section>
  )
}