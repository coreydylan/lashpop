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
    <section className="relative bg-[#FFF8F3]">
      {/* Desktop/Tablet Layout - New Design */}
      <div ref={ref} className="hidden md:block relative min-h-screen overflow-hidden">
        {/* Content Container */}
        <div className="relative container h-screen flex items-center justify-between">
          {/* Letter Content - Left Side */}
          <motion.div
            className="max-w-2xl z-10"
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

          {/* Arch Image - Right Side */}
          <motion.div
            className="relative flex-1 max-w-lg ml-12"
            initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
            animate={isInView ? {
              opacity: 1,
              scale: 1,
              rotate: 0
            } : {
              opacity: 0,
              scale: 0.9,
              rotate: 5
            }}
            transition={{
              duration: 1,
              delay: 0.4,
              ease: [0.23, 1, 0.32, 1]
            }}
          >
            {/* Decorative circle background */}
            <motion.div
              className="absolute -inset-8 bg-gradient-to-br from-pink-100/30 to-orange-100/30 rounded-full blur-3xl"
              animate={isInView ? {
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360],
              } : {}}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            />

            {/* Arch container with creative styling */}
            <div className="relative">
              {/* Floating animation wrapper */}
              <motion.div
                animate={isInView ? {
                  y: [0, -10, 0],
                } : {}}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <img
                  src="/lashpop-images/emily-arch.png"
                  alt="Emily in decorative arch"
                  className="w-full h-auto relative z-10 drop-shadow-2xl"
                />
              </motion.div>

              {/* Decorative elements */}
              <motion.div
                className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-pink-200/40 to-purple-200/40 rounded-full blur-2xl"
                animate={isInView ? {
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                } : {}}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-tr from-orange-200/40 to-yellow-200/40 rounded-full blur-2xl"
                animate={isInView ? {
                  scale: [1.2, 1, 1.2],
                  opacity: [0.5, 0.8, 0.5],
                } : {}}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile Layout - New Design */}
      <div className="md:hidden relative min-h-screen py-16 px-6">
        {/* Letter Content - Top */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          <img
            src="/founder-letter.svg"
            alt="Founder's Letter"
            className="w-full h-auto"
            aria-describedby="founder-letter-text-mobile"
          />
        </motion.div>

        {/* Arch Image - Bottom */}
        <motion.div
          className="relative mx-auto max-w-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.8,
            delay: 0.2,
            ease: [0.23, 1, 0.32, 1]
          }}
        >
          {/* Decorative background blur */}
          <div className="absolute -inset-4 bg-gradient-to-br from-pink-100/40 to-orange-100/40 rounded-full blur-2xl" />

          {/* Arch image */}
          <div className="relative">
            <img
              src="/lashpop-images/emily-arch.png"
              alt="Emily in decorative arch"
              className="w-full h-auto relative z-10 drop-shadow-xl"
            />
          </div>

          {/* Small decorative elements */}
          <motion.div
            className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute -bottom-3 -left-3 w-20 h-20 bg-gradient-to-tr from-orange-200/30 to-yellow-200/30 rounded-full blur-xl"
            animate={{
              scale: [1.1, 1, 1.1],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
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