'use client'

import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'

export function FounderLetterSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-20%" })

  // Mobile scroll logic - using container ref properly
  const mobileContainerRef = useRef<HTMLDivElement>(null)

  // Track scroll progress of the container
  const { scrollYProgress } = useScroll({
    target: mobileContainerRef,
    offset: ["start start", "end end"]
  })

  // Transform vertical scroll to horizontal movement
  // Start at left edge, anchor at 25%, pan to right edge
  const x = useTransform(
    scrollYProgress,
    [0, 0.1, 0.2, 0.8, 0.9, 1],
    ["0%", "0%", "-25%", "-75%", "-75%", "-75%"]
  )

  return (
    <section className="relative bg-[#FFE8E0]">
      {/* Desktop/Tablet Layout - New Design */}
      <div ref={ref} className="hidden md:block relative overflow-hidden" style={{ height: '80vh' }}>
        {/* Content Container */}
        <div className="relative container h-full flex items-center justify-between">
          {/* Letter Content - Left Side */}
          <motion.div
            className="max-w-2xl z-10"
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* SVG Letter Graphic */}
            <div className="relative w-full h-auto">
              <Image
                src="/founder-letter.svg"
                alt="Founder's Letter"
                width={0}
                height={0}
                style={{
                  width: '100%',
                  height: 'auto',
                  filter: 'brightness(0) saturate(100%) invert(50%) sepia(15%) saturate(800%) hue-rotate(320deg) brightness(95%) contrast(85%)'
                }}
                aria-describedby="founder-letter-text"
              />
            </div>

            {/* Hidden accessible text for screen readers and SEO */}
            <div id="founder-letter-text" className="sr-only">
              <h2>A Letter from Our Founder</h2>
              <p>Dear Beautiful Soul,</p>
              <p>When I founded LashPop, I envisioned more than just a lash studio. I dreamed of creating a space where every person who walks through our doors feels seen, celebrated, and transformed.</p>
              <p>Our journey began with a simple belief: that beauty services should be an experience of self-care and empowerment. Every lash we apply, every brow we shape, is done with intention and care, because we understand the confidence that comes from feeling your best.</p>
              <p>Our team of artists doesn&apos;t just provide services—they craft experiences. Each member brings their unique talents and passion, creating a symphony of expertise that makes LashPop truly special.</p>
              <p>Thank you for trusting us with your beauty journey. We can&apos;t wait to welcome you to our studio and show you what makes LashPop different.</p>
              <p>With love and lashes, The LashPop Family</p>
            </div>
          </motion.div>

          {/* Arch Image - Right Side */}
          <motion.div
            className="absolute bottom-0 right-0 w-1/2 max-w-sm"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{
              duration: 1,
              delay: 0.4,
              ease: [0.23, 1, 0.32, 1]
            }}
          >
            {/* Arch container */}
            <div className="relative w-full h-auto max-h-[60vh]">
              <Image
                src="/lashpop-images/emily-arch.png"
                alt="Emily in decorative arch"
                width={500}
                height={600}
                style={{ width: '100%', height: 'auto', maxHeight: '60vh', objectFit: 'contain' }}
                className="relative z-10"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile Layout - New Design */}
      <div className="md:hidden relative flex flex-col justify-center py-12 px-6 overflow-hidden" style={{ height: '80vh' }}>
        {/* Letter Content - Centered */}
        <motion.div
          className="z-10 mb-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          <Image
            src="/founder-letter.svg"
            alt="Founder's Letter"
            width={0}
            height={0}
            style={{
              width: '100%',
              height: 'auto',
              filter: 'brightness(0) saturate(100%) invert(50%) sepia(15%) saturate(800%) hue-rotate(320deg) brightness(95%) contrast(85%)'
            }}
            aria-describedby="founder-letter-text-mobile"
          />
        </motion.div>

        {/* Arch Image - Bottom */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xs"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.8,
            delay: 0.2,
            ease: [0.23, 1, 0.32, 1]
          }}
        >
          {/* Arch image */}
          <div className="relative max-h-[55vh]">
            <Image
              src="/lashpop-images/emily-arch.png"
              alt="Emily in decorative arch"
              width={400}
              height={500}
              style={{ width: '100%', height: 'auto', maxHeight: '55vh', objectFit: 'contain' }}
              className="relative z-10"
            />
          </div>
        </motion.div>

        {/* Hidden accessible text for screen readers */}
        <div id="founder-letter-text-mobile" className="sr-only">
          <h2>A Letter from Our Founder</h2>
          <p>Dear Beautiful Soul,</p>
          <p>When I founded LashPop, I envisioned more than just a lash studio. I dreamed of creating a space where every person who walks through our doors feels seen, celebrated, and transformed.</p>
          <p>Our journey began with a simple belief: that beauty services should be an experience of self-care and empowerment. Every lash we apply, every brow we shape, is done with intention and care, because we understand the confidence that comes from feeling your best.</p>
          <p>Our team of artists doesn&apos;t just provide services—they craft experiences. Each member brings their unique talents and passion, creating a symphony of expertise that makes LashPop truly special.</p>
          <p>Thank you for trusting us with your beauty journey. We can&apos;t wait to welcome you to our studio and show you what makes LashPop different.</p>
          <p>With love and lashes, The LashPop Family</p>
        </div>
      </div>
    </section>
  )
}