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
  // Emily is at top: 0, covering the viewport. Welcome content is BEHIND her (z-10 under z-40).
  // As user scrolls through welcome section, Emily gets cropped from bottom, revealing welcome behind.
  // When welcome sticky phase ends, welcome content scrolls up and goes UNDER the remaining Emily.
  // Team section eventually pushes Emily off screen.
  useEffect(() => {
    if (!isMobile || !mobileArchRef.current || !mobileArchImageRef.current) return

    initGSAPSync()

    const scrollContainer = document.querySelector('.mobile-scroll-container') as HTMLElement
    const welcomeSection = document.querySelector('[data-section-id="welcome"]') as HTMLElement
    if (!scrollContainer || !welcomeSection) return

    const imageRef = mobileArchImageRef.current

    // Start with full image visible
    gsap.set(imageRef, { clipPath: 'inset(0 0 0% 0)' })

    const triggers: ScrollTrigger[] = []

    // Crop from BOTTOM as welcome content scrolls up (after its sticky phase ends)
    // The welcome content's top edge "pushes" against Emily, cropping her from below
    // Timeline: starts when welcome sticky phase ends (section center at viewport top)
    const clipTween = gsap.to(imageRef, {
      clipPath: 'inset(0 0 65% 0)', // Crop 65% from bottom, leaving Emily's face/upper body
      ease: 'none',
      scrollTrigger: {
        trigger: welcomeSection,
        scroller: scrollContainer,
        // Start when welcome section center reaches viewport top (this is when sticky phase ends)
        start: 'center top',
        // End after scrolling another 60% of viewport (crop stops, welcome continues under)
        end: '+=60%',
        scrub: 0.3,
        invalidateOnRefresh: true,
      }
    })
    if (clipTween.scrollTrigger) triggers.push(clipTween.scrollTrigger)

    const handleResize = () => ScrollTrigger.refresh()
    window.addEventListener('resize', handleResize)

    return () => {
      triggers.forEach(t => t.kill())
      clipTween.kill()
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

      {/* Mobile Layout - Arch with scroll-driven BOTTOM crop animation */}
      <div
        ref={mobileContainerRef}
        className="md:hidden relative"
      >
        {/* Emily Arch Image Container - sticky at viewport top */}
        {/* Emily covers the viewport. Welcome content is BEHIND (z-10 under z-40). */}
        {/* As Emily gets cropped from bottom, welcome content is revealed behind her. */}
        {/* When welcome sticky ends, welcome scrolls up and goes UNDER the cropped Emily. */}
        <div
          ref={mobileArchRef}
          className="sticky w-screen z-40 flex justify-center overflow-visible"
          style={{
            background: 'transparent',
            top: '0', // Sticky at viewport top
          }}
        >
          {/* Arch image - GSAP controls clip-path for cropping effect */}
          <div
            ref={mobileArchImageRef}
            className="relative"
            style={{
              transformOrigin: 'center top',
              width: '100vw',
              willChange: 'clip-path',
            }}
          >
            <img
              src="/lashpop-images/emily-arch.png"
              alt="Emily in decorative arch"
              style={{
                width: '100%',
                height: 'auto',
                filter: 'drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))',
              }}
            />
          </div>
        </div>

        {/* Letter Content - z-30 so it scrolls UNDER the sticky arch (z-40) */}
        {/* Top padding creates space for the arch to be visible before letter starts cropping it */}
        <div ref={mobileLetterRef} className="px-6 pt-8 pb-16 bg-cream relative z-30">
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