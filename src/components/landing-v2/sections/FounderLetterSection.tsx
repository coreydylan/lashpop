'use client'

import { motion } from 'framer-motion'
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
  greeting: 'Dear Beautiful Soul,',
  paragraphs: [
    'When I started LashPop, I wanted to build something simple: a place where you actually feel taken care of.',
    'We\'re all united by the same mission—helping you feel effortlessly beautiful and confident, with a few less things to worry about during your busy week. We might be able to give you that "just woke up from eight blissful hours" look with little effort (even if your reality looks more like five). We\'re not here to judge ;)',
    'Thank you for trusting us. We can\'t wait to see you.'
  ],
  signOff: 'With love and lashes,',
  signature: 'Emily and the LashPop Family'
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
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  // Mobile: Subtle zoom effect on arch as it scrolls up (card overlay effect)
  // The arch section slides up over the pinned WelcomeSection
  useEffect(() => {
    if (!isMobile) return

    const scrollContainer = document.querySelector('.mobile-scroll-container') as HTMLElement
    const archImage = mobileArchImageRef.current

    if (!scrollContainer || !archImage) return

    let rafId: number
    let lastScrollTop = -1

    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId)

      rafId = requestAnimationFrame(() => {
        const scrollTop = scrollContainer.scrollTop

        // Skip if scroll hasn't changed meaningfully
        if (Math.abs(scrollTop - lastScrollTop) < 0.5) return
        lastScrollTop = scrollTop

        const viewportHeight = window.innerHeight

        // Get arch image position
        const archRect = archImage.getBoundingClientRect()
        const archTop = archRect.top

        // Calculate progress based on how far into the viewport the arch has traveled
        // 0 = arch just entering from bottom, 1 = arch at top of viewport
        const progress = Math.max(0, Math.min(1, (viewportHeight - archTop) / viewportHeight))

        // Subtle zoom: 1.0 → 1.08 (just 8% zoom for depth)
        const scale = 1 + (progress * 0.08)

        // Apply transform with GPU acceleration
        archImage.style.transform = `scale3d(${scale}, ${scale}, 1)`
      })
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    const handleResize = () => {
      lastScrollTop = -1
      handleScroll()
    }
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [isMobile])

  return (
    <section className="relative w-full bg-cream">

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
              <div className="relative w-full text-[#8a5e55] text-[clamp(1.1rem,1.6vw,1.6rem)] leading-relaxed font-normal font-swanky">
                <p className="mb-[1.5vh]">{letterContent.greeting}</p>

                {letterContent.paragraphs.map((paragraph, index) => (
                  <p key={index} className={index === letterContent.paragraphs.length - 1 ? "mb-[2vh]" : "mb-[1.5vh]"}>
                    {paragraph}
                  </p>
                ))}

                <div className="flex flex-col gap-[0.5vh]">
                  <p>{letterContent.signOff}</p>
                  <p className="text-[clamp(1.35rem,2.2vw,2rem)]">{letterContent.signature}</p>
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

      {/* Mobile Layout - Card overlay effect */}
      {/* This section scrolls up and covers the WelcomeSection below */}
      <div
        ref={mobileContainerRef}
        className="md:hidden relative z-30 bg-cream"
      >
        {/* Emily Arch Image - Full width, subtle zoom on scroll */}
        <div
          ref={mobileArchRef}
          className="relative w-full overflow-hidden"
        >
          <div
            ref={mobileArchImageRef}
            className="relative w-full will-change-transform"
            style={{
              transformOrigin: 'center center',
              transform: 'scale3d(1, 1, 1)',
              backfaceVisibility: 'hidden',
            }}
          >
            <Image
              src="/lashpop-images/emily-arch.png"
              alt="Emily in decorative arch"
              width={600}
              height={720}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>

        {/* Letter Content */}
        <div className="px-6 py-10 bg-cream">
          <div className="text-[#8a5e55] text-lg leading-relaxed font-normal font-swanky max-w-lg mx-auto">
            <p className="mb-5">{letterContent.greeting}</p>

            {letterContent.paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className={index === letterContent.paragraphs.length - 1 ? "mb-8" : "mb-5"}
              >
                {paragraph}
              </p>
            ))}

            <div className="flex flex-col gap-2">
              <p>{letterContent.signOff}</p>
              <p className="text-xl">{letterContent.signature}</p>
            </div>
          </div>
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