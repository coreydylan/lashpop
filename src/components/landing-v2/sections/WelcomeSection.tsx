'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'

export function WelcomeSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-20%" })

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden">
      {/* Background Image - No overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/desk.jpg"
          alt="LashPop Studio Desk"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Content Container with Safe Zone */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Text Area - Takes up top portion, leaving bottom 35% as safe zone */}
        <div className="flex-1 flex items-center justify-center px-6 pb-[35vh]">
          <motion.div
            className="container max-w-5xl text-center"
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <motion.h2
              className="text-5xl md:text-6xl lg:text-7xl font-serif font-light mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{ color: '#8B5A6B' }} // Dark dusty rose
            >
              Welcome to LashPop
            </motion.h2>

            <motion.p
              className="text-xl md:text-2xl font-light mb-6 leading-relaxed max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              style={{ color: '#8B5A6B' }} // Dark dusty rose
            >
              Where artistry meets precision in every lash application.
              Our studio is more than a beauty destination—it&apos;s a sanctuary
              where confidence blooms and natural beauty is enhanced with
              meticulous care and expertise.
            </motion.p>

            <motion.p
              className="text-lg md:text-xl font-light mb-8 leading-relaxed max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              style={{ color: '#8B5A6B', opacity: 0.9 }} // Slightly lighter
            >
              Each service is tailored to your unique features, ensuring
              results that feel authentically you. From classic elegance to
              bold volume, we craft looks that elevate your natural radiance.
            </motion.p>

            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <p className="text-sm md:text-base uppercase tracking-widest flex items-center justify-center gap-3"
                style={{ color: '#8B5A6B' }}>
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