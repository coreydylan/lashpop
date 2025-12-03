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
  const mobileArchClipRef = useRef<HTMLDivElement>(null)
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
  // Phase 1: Soft zoom (105% -> 115%) as arch scrolls up
  // Phase 2: Arch sticks when it reaches top of viewport
  // Phase 3: Letter content pushes up, cropping arch from bottom ("roll-up")
  // Phase 4: Release sticky when letter content ends
  useEffect(() => {
    if (!isMobile || !mobileArchRef.current || !mobileArchImageRef.current || !mobileArchClipRef.current || !mobileLetterRef.current) return

    // Initialize GSAP synchronously for mobile scroll
    initGSAPSync()

    // Get the scroll container (mobile uses .mobile-scroll-container)
    const scrollContainer = document.querySelector('.mobile-scroll-container') as HTMLElement
    if (!scrollContainer) return

    const viewportWidth = window.innerWidth

    // Scale calculations - start at 105% of viewport width, end at 115%
    const archImageWidth = 280 // Base image width in px
    const startScale = (viewportWidth * 1.05) / archImageWidth
    const endScale = (viewportWidth * 1.15) / archImageWidth

    // The minimum visible height for the face crop banner (percentage)
    const minVisiblePercent = 15

    // Store refs for closure
    const imageRef = mobileArchImageRef.current
    const clipRef = mobileArchClipRef.current
    const archContainerRef = mobileArchRef.current
    const letterRef = mobileLetterRef.current

    // Set initial state - start at 105% scale, no crop
    gsap.set(imageRef, { scale: startScale })
    gsap.set(clipRef, { clipPath: 'inset(0 0 0 0)' })

    const triggers: ScrollTrigger[] = []

    // Phase 1: Soft zoom as arch scrolls into view (105% -> 115%)
    const zoomTween = gsap.to(imageRef, {
      scale: endScale,
      ease: 'none',
      scrollTrigger: {
        trigger: archContainerRef,
        scroller: scrollContainer,
        start: 'top 100%', // Start when arch enters viewport from bottom
        end: 'top 20%', // End when arch top is near top of viewport
        scrub: 1.5,
        invalidateOnRefresh: true,
      }
    })
    if (zoomTween.scrollTrigger) triggers.push(zoomTween.scrollTrigger)

    // Phase 2 & 3: Sticky + Roll-up crop
    // The arch container is set to sticky via CSS, and we control the clip-path
    // based on where the letter content is relative to the sticky arch
    const cropTrigger = ScrollTrigger.create({
      trigger: letterRef,
      scroller: scrollContainer,
      start: 'top bottom', // When letter top enters viewport bottom
      end: 'bottom top', // When letter bottom exits viewport top
      invalidateOnRefresh: true,
      onUpdate: () => {
        // Get positions - archContainerRef is sticky so its position is fixed when stuck
        const archRect = archContainerRef.getBoundingClientRect()
        const letterRect = letterRef.getBoundingClientRect()

        // The bottom of where the arch image appears (accounting for the container)
        const archBottom = archRect.bottom
        // The top of the letter content
        const letterTop = letterRect.top

        // Calculate overlap - how much the letter has "pushed" into the arch space
        // When letterTop < archBottom, there's overlap
        const overlap = archBottom - letterTop

        if (overlap > 0) {
          // Letter is pushing into the arch - calculate crop percentage
          const archHeight = archRect.height
          if (archHeight > 0) {
            // Crop from bottom, but keep at least minVisiblePercent visible
            const cropPercent = Math.min(100 - minVisiblePercent, (overlap / archHeight) * 100)
            gsap.set(clipRef, {
              clipPath: `inset(0 0 ${cropPercent}% 0)`,
            })
          }
        } else {
          // No overlap yet - show full arch
          gsap.set(clipRef, { clipPath: 'inset(0 0 0 0)' })
        }
      }
    })
    triggers.push(cropTrigger)

    // Handle resize
    const handleResize = () => {
      const newViewportWidth = window.innerWidth
      const newStartScale = (newViewportWidth * 1.05) / archImageWidth
      gsap.set(imageRef, { scale: newStartScale })
      gsap.set(clipRef, { clipPath: 'inset(0 0 0 0)' })
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
        className="md:hidden relative z-30"
      >
        {/* Emily Arch Image Container - FULL WIDTH to allow scale expansion */}
        {/* sticky top-0 makes it stick when reaching top of viewport */}
        {/* overflow-hidden clips the scaled image to viewport width */}
        <div
          ref={mobileArchRef}
          className="sticky top-0 w-screen overflow-hidden"
          style={{
            background: 'transparent',
          }}
        >
          {/* Clip container - handles the bottom crop effect via clip-path */}
          <div
            ref={mobileArchClipRef}
            className="relative w-full flex justify-center will-change-transform"
            style={{ clipPath: 'inset(0 0 0 0)' }}
          >
            {/* Arch image container with zoom transform - GSAP controls scale */}
            {/* Transform origin at center-bottom so zoom expands upward and outward */}
            <div
              ref={mobileArchImageRef}
              className="relative will-change-transform"
              style={{ transformOrigin: 'center bottom' }}
            >
              <Image
                src="/lashpop-images/emily-arch.png"
                alt="Emily in decorative arch"
                width={280}
                height={360}
                style={{ width: '280px', height: 'auto' }}
                className="relative z-10 drop-shadow-xl"
                priority
              />
            </div>
          </div>
        </div>

        {/* Letter Content - this "pushes" the arch crop as it scrolls up */}
        <div ref={mobileLetterRef} className="px-6 pb-16 bg-cream relative z-40">
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