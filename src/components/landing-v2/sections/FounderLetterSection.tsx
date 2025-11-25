'use client'

import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'

export function FounderLetterSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-10%" }) // Adjusted for earlier trigger

  // Mobile scroll logic - using container ref properly
  const mobileContainerRef = useRef<HTMLDivElement>(null)

  // Track scroll progress of the container
  const { scrollYProgress } = useScroll({
    target: mobileContainerRef,
    offset: ["start start", "end end"],
    layoutEffect: false
  } as any)

  // Transform vertical scroll to horizontal movement
  // Start at left edge, anchor at 25%, pan to right edge
  const x = useTransform(
    scrollYProgress,
    [0, 0.1, 0.2, 0.8, 0.9, 1],
    ["0%", "0%", "-25%", "-75%", "-75%", "-75%"]
  )

  return (
    <section className="relative w-full">
      {/* Background Image and Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/lashpop-images/flower-pattern.png"
          alt="Flower pattern background"
          fill
          className="object-cover"
          quality={100}
          priority
        />
        <div className="absolute inset-0 bg-[#dbcdcc]/80" />
      </div>

      {/* Desktop/Tablet Layout - New Design */}
      <div ref={ref} className="hidden md:block relative overflow-hidden z-20 pt-24 pb-0">
        {/* Content Container */}
        <div className="relative container flex justify-between items-end z-20">
          {/* Letter Content - Left Side */}
          <motion.div
            className="max-w-2xl z-30 self-center translate-y-56"
            initial={{ opacity: 1, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* SVG Letter Graphic */}
            <div className="relative w-full text-[#8a5e55] font-corey text-xl md:text-2xl leading-relaxed font-normal">
              <p className="mb-6">Dear Beautiful Soul,</p>
              
              <p className="mb-6">
                When I started LashPop, I wanted to build something simple: a place where you actually feel taken care of. A space where you can exhale for an hour, maybe catch a quick nap, and walk out feeling like the best version of yourself.
              </p>

              <p className="mb-6">
                Our team is united by the same mission—helping you feel effortlessly beautiful and confident, with a few less things to worry about during your busy week. We might be able to give you that "just woke up from eight blissful hours" look with little effort (even if your reality looks more like five). We're not here to judge ;)
              </p>

              <p className="mb-6">
                Every artist here brings something different to the table, but we all share the same obsession with getting it right. The details matter to us because we know they matter to you.
              </p>

              <p className="mb-8">
                Thank you for trusting us with your beauty routine. We don't take that lightly, and we can't wait to welcome you in.
              </p>

              <div className="flex flex-col gap-2">
                <p>With love and lashes,</p>
                <p className="text-2xl md:text-3xl">The LashPop Family</p>
              </div>
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
            className="relative flex-1 max-w-lg ml-12"
            initial={{ opacity: 1, scale: 1, rotate: 0 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              duration: 1,
              delay: 0.4,
              ease: [0.23, 1, 0.32, 1]
            }}
          >
            {/* Decorative circle background */}
            <motion.div
              className="absolute -inset-8 bg-gradient-to-br from-pink-100/30 to-orange-100/30 rounded-full blur-3xl"
            />

            {/* Arch container with creative styling */}
            <div className="relative">
              {/* Static image wrapper */}
              <div className="relative w-full h-auto">
                  <Image
                    src="/lashpop-images/emily-arch.png"
                    alt="Emily in decorative arch"
                    width={500}
                    height={600}
                    style={{ width: '100%', height: 'auto' }}
                    className="relative z-10 drop-shadow-2xl"
                  />
              </div>

              {/* Decorative elements */}
              <div
                className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-pink-200/40 to-purple-200/40 rounded-full blur-2xl opacity-60"
              />
              <div
                className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-tr from-orange-200/40 to-yellow-200/40 rounded-full blur-2xl opacity-60"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile Layout - Arch First with Zoom Effect */}
      <div
        ref={mobileContainerRef}
        className="md:hidden relative z-20"
      >
        {/* Sticky Container for Arch with Zoom Effect */}
        <div className="relative min-h-[150vh]">
          {/* Arch Image - Now First with Zoom Effect */}
          <div className="sticky top-0 h-screen flex items-start justify-center overflow-hidden pt-20">
            <motion.div
              className="relative"
              style={{
                scale: useTransform(scrollYProgress, [0, 0.5], [1, 1.5]),
                y: useTransform(scrollYProgress, [0, 0.5], [0, 150]),
                transformOrigin: 'center bottom'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {/* Decorative background blur */}
              <motion.div
                className="absolute -inset-8 bg-gradient-to-br from-pink-100/40 to-orange-100/40 rounded-full blur-2xl"
                style={{
                  opacity: useTransform(scrollYProgress, [0.3, 0.5], [1, 0.3])
                }}
              />

              {/* Arch image */}
              <div className="relative">
                <Image
                  src="/lashpop-images/emily-arch.png"
                  alt="Emily in decorative arch"
                  width={350}
                  height={450}
                  style={{ width: '100%', height: 'auto' }}
                  className="relative z-10 drop-shadow-xl max-w-[350px]"
                  priority
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
          </div>
        </div>

        {/* Letter Content - Now at Bottom with Full Width */}
        <div className="relative bg-inherit pt-8 pb-12 px-6">
          <motion.div
            className="text-[#8a5e55] font-corey text-lg leading-relaxed font-normal"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          >
            <p className="mb-6">Dear Beautiful Soul,</p>
            
            <p className="mb-6">
              When I started LashPop, I wanted to build something simple: a place where you actually feel taken care of. A space where you can exhale for an hour, maybe catch a quick nap, and walk out feeling like the best version of yourself.
            </p>

            <p className="mb-6">
              Our team is united by the same mission—helping you feel effortlessly beautiful and confident, with a few less things to worry about during your busy week. We might be able to give you that "just woke up from eight blissful hours" look with little effort (even if your reality looks more like five). We're not here to judge ;)
            </p>

            <p className="mb-6">
              Every artist here brings something different to the table, but we all share the same obsession with getting it right. The details matter to us because we know they matter to you.
            </p>

            <p className="mb-8">
              Thank you for trusting us with your beauty routine. We don't take that lightly, and we can't wait to welcome you in.
            </p>

            <div className="flex flex-col gap-2">
              <p>With love and lashes,</p>
              <p className="text-xl">The LashPop Family</p>
            </div>
          </motion.div>
        </div>

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