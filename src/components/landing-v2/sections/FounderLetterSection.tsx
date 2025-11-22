'use client'

import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useRef } from 'react'

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
    <section className="relative">
      {/* Desktop/Tablet Layout - Unchanged */}
      <div ref={ref} className="hidden md:block relative min-h-screen overflow-hidden">
        {/* Background Image with Ken Burns Effect */}
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1.15 }}
          animate={isInView ? { scale: 1 } : { scale: 1.15 }}
          transition={{ duration: 20, ease: "linear" }}
        >
          <img
            src="/lashpop-images/founderbg-desktop.jpg"
            alt="Founder Background"
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
        </motion.div>

        {/* Letter Content - Left Side, Vertically Centered */}
        <div className="relative z-10 container h-screen flex items-center">
          <motion.div
            className="max-w-2xl mt-32"
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* SVG Letter Graphic */}
            <img
              src="/founder-letter.svg"
              alt="Founder's Letter"
              className="w-full h-auto"
              aria-describedby="founder-letter-text"
            />

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
        </div>
      </div>

      {/* Mobile Layout - Horizontal Scroll Effect */}
      {/* Container that creates the scroll distance */}
      <div
        ref={mobileContainerRef}
        className="md:hidden relative h-[500vh]"
      >
        {/* Sticky wrapper that stays in viewport */}
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* Inner container for the image */}
          <div className="relative h-full w-full bg-white">
            {/* Motion container for horizontal translation */}
            <motion.div
              className="h-full"
              style={{
                x,
                width: 'fit-content',
                position: 'relative'
              }}
            >
              <img
                src="/founder%20letter%20mobile%20copy.jpg"
                alt="A Letter from Our Founder"
                className="h-full w-auto block object-cover"
                style={{
                  maxWidth: 'none',
                  minHeight: '100%'
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}