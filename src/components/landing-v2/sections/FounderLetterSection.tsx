'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useEffect } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
  // Configure ScrollTrigger for smoother behavior
  ScrollTrigger.config({
    ignoreMobileResize: true,
  })
}

export function FounderLetterSection() {
  // Desktop refs
  const desktopSectionRef = useRef<HTMLDivElement>(null)
  const desktopContentRef = useRef<HTMLDivElement>(null)
  const archRef = useRef<HTMLDivElement>(null)
  const letterRef = useRef<HTMLDivElement>(null)

  // Mobile scroll logic - using container ref properly
  const mobileContainerRef = useRef<HTMLDivElement>(null)

  // Track scroll progress of the container (mobile)
  const { scrollYProgress } = useScroll({
    target: mobileContainerRef,
    offset: ["start start", "end end"],
    layoutEffect: false
  } as any)

  // GSAP ScrollTrigger for desktop
  useEffect(() => {
    // Only run on desktop
    const mm = gsap.matchMedia()
    
    mm.add("(min-width: 768px)", () => {
      const section = desktopSectionRef.current
      const content = desktopContentRef.current
      const arch = archRef.current
      const letter = letterRef.current
      
      if (!section || !content || !arch || !letter) return

      // Create the pin trigger - pins when arch bottom hits viewport bottom
      const pinTrigger = ScrollTrigger.create({
        trigger: content,
        start: "bottom bottom", // Pin when content bottom hits viewport bottom
        end: "+=80%", // Stay pinned for 80% of viewport height worth of scrolling (reduced from 150%)
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        fastScrollEnd: true, // Prevents jumping on fast scroll
        preventOverlaps: true, // Prevents overlap issues
        onUpdate: (self) => {
          const progress = self.progress
          
          // Timeline:
          // 0.0 - 0.2: Pause phase (everything visible, no changes)
          // 0.2 - 0.6: Arch fades out
          // 0.4 - 0.8: Letter fades out and moves up
          // 0.8 - 1.0: Everything gone
          
          if (progress <= 0.2) {
            // Pause phase - everything fully visible
            gsap.set(arch, { opacity: 1 })
            gsap.set(letter, { opacity: 1, y: 0 })
          } else if (progress <= 0.6) {
            // Arch fading out
            const archProgress = (progress - 0.2) / 0.4 // 0 to 1 over this range
            gsap.set(arch, { opacity: 1 - archProgress })
            
            if (progress <= 0.4) {
              gsap.set(letter, { opacity: 1, y: 0 })
            } else {
              const letterProgress = (progress - 0.4) / 0.4
              gsap.set(letter, { opacity: 1 - letterProgress, y: -40 * letterProgress })
            }
          } else {
            // Both faded out
            gsap.set(arch, { opacity: 0 })
            const letterProgress = Math.min(1, (progress - 0.4) / 0.4)
            gsap.set(letter, { opacity: 1 - letterProgress, y: -40 * letterProgress })
          }
        }
      })

      // Cleanup
      return () => {
        pinTrigger.kill()
      }
    })

    return () => mm.revert()
  }, [])

  return (
    <section className="relative w-full bg-cream">

      {/* Desktop/Tablet Layout - GSAP ScrollTrigger pinning */}
      <div ref={desktopSectionRef} className="hidden md:block relative z-20 overflow-hidden">
        <div ref={desktopContentRef} className="min-h-screen flex flex-col justify-end will-change-transform">
          {/* Content Container - sits at bottom of viewport */}
          <div className="container flex justify-between items-end gap-12 pb-0">
            {/* Letter Content - Left Side */}
            <div
              ref={letterRef}
              className="max-w-2xl z-30 pb-16"
            >
              {/* SVG Letter Graphic */}
              <div className="relative w-full text-[#8a5e55] text-xl md:text-2xl leading-relaxed font-normal font-swanky">
                <p className="mb-6">Dear Beautiful Soul,</p>
                
                <p className="mb-6">
                  When I started LashPop, I wanted to build something simple: a place where you actually feel taken care of. A space where you can exhale for an hour, maybe catch a quick nap, and walk out feeling like the best version of yourself.
                </p>

                <p className="mb-6">
                  Our team is united by the same mission—helping you feel effortlessly beautiful and confident, with a few less things to worry about during your busy week. We might be able to give you that &ldquo;just woke up from eight blissful hours&rdquo; look with little effort (even if your reality looks more like five). We&apos;re not here to judge ;)
                </p>

                <p className="mb-6">
                  Every artist here brings something different to the table, but we all share the same obsession with getting it right. The details matter to us because we know they matter to you.
                </p>

                <p className="mb-8">
                  Thank you for trusting us with your beauty routine. We don&apos;t take that lightly, and we can&apos;t wait to welcome you in.
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
            </div>

            {/* Arch Image - Right Side, bottom-aligned */}
            <div
              ref={archRef}
              className="relative flex-1 max-w-lg"
            >
              {/* Decorative circle background - contained within section */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-pink-100/20 to-orange-100/20 rounded-full blur-2xl pointer-events-none"
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

                {/* Decorative elements - removed to prevent shadow artifacts */}
              </div>
            </div>
          </div>
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
            className="text-[#8a5e55] text-lg leading-relaxed font-normal font-swanky"
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
              Our team is united by the same mission—helping you feel effortlessly beautiful and confident, with a few less things to worry about during your busy week. We might be able to give you that &ldquo;just woke up from eight blissful hours&rdquo; look with little effort (even if your reality looks more like five). We&apos;re not here to judge ;)
            </p>

            <p className="mb-6">
              Every artist here brings something different to the table, but we all share the same obsession with getting it right. The details matter to us because we know they matter to you.
            </p>

            <p className="mb-8">
              Thank you for trusting us with your beauty routine. We don&apos;t take that lightly, and we can&apos;t wait to welcome you in.
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