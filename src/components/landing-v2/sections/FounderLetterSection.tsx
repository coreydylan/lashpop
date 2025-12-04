'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { gsap, ScrollTrigger, initGSAP, initGSAPSync } from '@/lib/gsap'

interface FounderLetterContent {
  greeting: string
  paragraphs: string[]
  signOff: string
  signature: string
}

interface FounderLetterSectionProps {
  content?: FounderLetterContent
}

// Default content fallback
const defaultContent: FounderLetterContent = {
  greeting: 'Welcome to LashPop Studios — I\'m so glad you\'re here. 🤎',
  paragraphs: [
    'When I launched LashPop in 2016, I wanted something simple: a place where women actually feel cared for and walk out looking refreshed without the long routine.',
    'That vision eventually grew into the beauty collective we have today—artists offering lashes, brows, skincare, injectables, waxing, permanent jewelry, and more—all with one goal in mind: helping you feel effortlessly beautiful and confident.',
    'We\'re here to make your week a little easier. If we can give you that "just woke up from eight blissful hours" feeling with almost no effort—even if you\'re running on five—we\'re doing our job.',
    'We can\'t wait to see you soon!'
  ],
  signOff: 'Xo',
  signature: 'Emily'
}

export function FounderLetterSection({ content }: FounderLetterSectionProps) {
  // Use provided content or fallback to defaults
  const letterContent = content || defaultContent
  // Desktop refs
  const desktopSectionRef = useRef<HTMLDivElement>(null)
  const desktopContentRef = useRef<HTMLDivElement>(null)
  const archRef = useRef<HTMLDivElement>(null)
  const letterRef = useRef<HTMLDivElement>(null)

  // Mobile scroll logic - using container ref properly
  const mobileContainerRef = useRef<HTMLDivElement>(null)
  const mobileArchRef = useRef<HTMLDivElement>(null)
  const mobileArchImageRef = useRef<HTMLDivElement>(null)
  const mobileLetterRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Track scroll progress of the container (mobile)
  const { scrollYProgress } = useScroll({
    target: mobileContainerRef,
    offset: ["start start", "end end"],
    layoutEffect: false
  } as any)

  // GSAP ScrollTrigger for desktop
  useEffect(() => {
    let mm: gsap.MatchMedia | null = null

    // Initialize GSAP deferred, then set up animations
    initGSAP().then(() => {
      // Configure ScrollTrigger for smoother behavior
      ScrollTrigger.config({
        ignoreMobileResize: true,
      })

      mm = gsap.matchMedia()

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
    })

    return () => {
      if (mm) mm.revert()
    }
  }, [])

  // GSAP ScrollTrigger for mobile arch animation
  // Phase 1: Soft zoom as arch scrolls up
  // Phase 2: Welcome text "pushes" the bottom of the arch up by cropping it in real-time
  // Phase 3: Once Emily's face is cropped into a rectangle, it stays fixed and text scrolls under
  useEffect(() => {
    if (!isMobile || !mobileArchRef.current || !mobileArchImageRef.current || !mobileLetterRef.current) return

    // Initialize GSAP synchronously for mobile scroll
    initGSAPSync()

    // Get the scroll container (mobile uses .mobile-scroll-container)
    const scrollContainer = document.querySelector('.mobile-scroll-container') as HTMLElement
    if (!scrollContainer) return

    // Store refs for closure
    const imageRef = mobileArchImageRef.current
    const archContainerRef = mobileArchRef.current
    const letterRef = mobileLetterRef.current

    const triggers: ScrollTrigger[] = []

    // Phase 1: Soft zoom as arch scrolls into view (scale 1 -> 1.087 = 115vw -> 125vw)
    const zoomTween = gsap.to(imageRef, {
      scale: 1.087,
      ease: 'none',
      scrollTrigger: {
        trigger: archContainerRef,
        scroller: scrollContainer,
        start: 'top 100%',
        end: 'top 0%',
        scrub: 1.5,
        invalidateOnRefresh: true,
      }
    })
    if (zoomTween.scrollTrigger) triggers.push(zoomTween.scrollTrigger)

    // Phase 2: Real-time crop based on welcome text position
    // The welcome text's top edge "pushes" against the arch's bottom edge
    // Crop stops when only 15vh of the arch remains visible (Emily's face banner)
    const cropTrigger = ScrollTrigger.create({
      trigger: letterRef,
      scroller: scrollContainer,
      start: 'top bottom',
      end: 'bottom top', // Keep active until letter scrolls past
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const viewportHeight = window.innerHeight
        const minVisibleHeight = viewportHeight * 0.25 // 25vh - Emily's face banner

        // Get actual element positions - use imageRect since that's what we're clipping
        const imageRect = imageRef.getBoundingClientRect()
        const letterRect = letterRef.getBoundingClientRect()

        const imageBottom = imageRect.bottom // Where image currently ends
        const imageTop = imageRect.top // Where image starts (likely above viewport)
        const letterTop = letterRect.top // Where welcome text starts
        const imageHeight = imageRect.height

        // If letter hasn't reached image bottom yet, no crop
        if (letterTop >= imageBottom) {
          gsap.set(imageRef, { clipPath: 'inset(0 0 0% 0)' })
          return
        }

        // Calculate how much image extends below the welcome text
        // This is how much we need to crop
        const cropPixels = imageBottom - letterTop

        // Calculate how much of the image is currently visible in viewport
        const imageVisibleTop = Math.max(0, imageTop)
        const imageVisibleBottom = Math.min(viewportHeight, imageBottom)
        const imageVisibleHeight = imageVisibleBottom - imageVisibleTop

        // Cap the crop so at least 15vh remains visible
        const maxCropPixels = Math.max(0, imageVisibleHeight - minVisibleHeight)
        const finalCropPixels = Math.min(cropPixels, maxCropPixels)

        // Convert to percentage of image height
        const cropPercent = Math.max(0, Math.min(100, (finalCropPixels / imageHeight) * 100))

        // Apply crop from bottom
        gsap.set(imageRef, { clipPath: `inset(0 0 ${cropPercent}% 0)` })
      }
    })
    triggers.push(cropTrigger)

    // Handle resize
    const handleResize = () => {
      ScrollTrigger.refresh()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      triggers.forEach(t => t.kill())
      zoomTween.kill()
      window.removeEventListener('resize', handleResize)
    }
  }, [isMobile])

  return (
    <section className="relative w-full md:bg-cream">

      {/* Desktop/Tablet Layout - GSAP ScrollTrigger pinning */}
      <div ref={desktopSectionRef} className="hidden md:block relative z-20 overflow-hidden">
        <div ref={desktopContentRef} className="h-screen flex flex-col justify-between will-change-transform pt-[calc(96px+3vh)]">
          {/* Spacer to push content down from docked panels */}
          <div className="flex-shrink-0" />
          {/* Content Container - bottom-aligned with arch touching viewport bottom */}
          <div className="container flex justify-between items-end gap-12">
            {/* Letter Content - Left Side */}
            <div
              ref={letterRef}
              className="max-w-2xl z-30 pb-[16vh]"
            >
              {/* Letter Content */}
              <div className="relative w-full text-[#8a5e55] text-[clamp(0.95rem,1.4vw,1.4rem)] leading-relaxed font-normal font-swanky">
                <p className="mb-[1.5vh]">{letterContent.greeting}</p>

                {letterContent.paragraphs.map((paragraph, index) => (
                  <p key={index} className={index === letterContent.paragraphs.length - 1 ? "mb-[2vh]" : "mb-[1.5vh]"}>
                    {paragraph}
                  </p>
                ))}

                <div className="flex flex-col gap-[0.5vh]">
                  <p>{letterContent.signOff}</p>
                  <p className="text-[clamp(1.2rem,1.8vw,1.7rem)]">{letterContent.signature}</p>
                </div>
              </div>

              {/* Hidden accessible text for screen readers and SEO */}
              <div id="founder-letter-text" className="sr-only">
                <h2>A Letter from Our Founder</h2>
                <p>{letterContent.greeting}</p>
                {letterContent.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
                <p>{letterContent.signOff} {letterContent.signature}</p>
              </div>
            </div>

            {/* Arch Image - Right Side, bottom-aligned */}
            <div
              ref={archRef}
              className="relative w-[35vw] max-w-[485px] flex-shrink-0"
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
                      width={600}
                      height={720}
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

      {/* Mobile Layout - Arch with scroll-driven zoom and crop animation */}
      <div
        ref={mobileContainerRef}
        className="md:hidden relative"
      >
        {/* Emily Arch Image Container - sticky after ~40% of image scrolls off */}
        {/* Image is 105vw wide, aspect ratio ~1.86, so height is ~195vw */}
        {/* 40% of 195vw = ~78vw, so top: -78vw lets 40% scroll off before sticking */}
        <div
          ref={mobileArchRef}
          className="sticky w-[115vw] -ml-[7.5vw] z-40 flex justify-center overflow-visible"
          style={{
            background: 'transparent',
            top: '-78vw',
          }}
        >
          {/* Arch image - width set via style, GSAP controls scale */}
          <div
            ref={mobileArchImageRef}
            className="relative"
            style={{
              transformOrigin: 'center top',
              width: '115vw',
            }}
          >
            <img
              src="/lashpop-images/emily-arch.png"
              alt="Emily in decorative arch"
              style={{
                width: '100%',
                height: 'auto',
              }}
            />
          </div>
        </div>

        {/* Letter Content - z-30 so it scrolls UNDER the sticky arch (z-40) */}
        <div ref={mobileLetterRef} className="px-6 pb-16 bg-cream relative z-30">
          <motion.div
            className="text-[#8a5e55] text-base leading-relaxed font-normal font-swanky max-w-lg mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            <p className="mb-5">{letterContent.greeting}</p>

            {letterContent.paragraphs.map((paragraph, index) => (
              <motion.p
                key={index}
                className={index === letterContent.paragraphs.length - 1 ? "mb-8" : "mb-5"}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * (index + 1), ease: [0.23, 1, 0.32, 1] }}
              >
                {paragraph}
              </motion.p>
            ))}

            <motion.div
              className="flex flex-col gap-2"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              <p>{letterContent.signOff}</p>
              <p className="text-lg">{letterContent.signature}</p>
            </motion.div>
          </motion.div>
        </div>

        {/* Hidden accessible text for screen readers */}
        <div id="founder-letter-text-mobile" className="sr-only">
          <h2>A Letter from Our Founder</h2>
          <p>{letterContent.greeting}</p>
          {letterContent.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          <p>{letterContent.signOff} {letterContent.signature}</p>
        </div>
      </div>
    </section>
  )
}