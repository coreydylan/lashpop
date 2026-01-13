'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'

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
  greeting: 'I\'m so glad you\'re here. 🤎',
  paragraphs: [
    'When I launched LashPop back in 2016, I wanted something simple: a place where women could feel genuinely cared for and walk out looking refreshed without the long routine. That idea grew into the beauty collective we have today—artists who specialize in lashes, brows, skincare, injectables, waxing, permanent jewelry, and more, all with one goal in mind.',
    'We\'re united by the same mission: helping you feel effortlessly beautiful and confident, with a few less things to stress about during your busy week. If we can give you that "just woke up from eight blissful hours" look with almost no effort—even if you\'re running on five—we\'ll call that a win.',
    'We can\'t wait to see you soon!'
  ],
  signOff: 'Xo',
  signature: 'Emily'
}

export function FounderLetterSection({ content }: FounderLetterSectionProps) {
  // Use provided content or fallback to defaults
  const letterContent = content || defaultContent
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <section className="relative w-full md:bg-ivory">

      {/* Desktop/Tablet Layout */}
      <div className="hidden md:block relative z-20 overflow-hidden">
        <div className="h-screen flex flex-col justify-between pt-[calc(96px+3vh)]">
          {/* Spacer to push content down from docked panels */}
          <div className="flex-shrink-0" />
          {/* Content Container - bottom-aligned with arch touching viewport bottom */}
          <div className="container flex justify-between items-end gap-12">
            {/* Letter Content - Left Side */}
            <div className="max-w-2xl z-30 pb-[16vh]">
              {/* Section Header */}
              <div className="mb-8">
                <h2
                  className="text-3xl font-display font-medium tracking-wide mb-6"
                  style={{ color: '#ac4d3c' }}
                >
                  Welcome to Lashpop Studios
                </h2>
                <div className="w-16 h-px bg-terracotta/30" />
              </div>
              {/* Letter Content */}
              <div className="relative w-full text-[#ac4d3c] text-[clamp(0.95rem,1.4vw,1.4rem)] leading-relaxed font-normal font-sans">
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
            <div className="relative w-[35vw] max-w-[485px] flex-shrink-0">
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Simple static scroll */}
      <div className="md:hidden relative bg-ivory">
        {/* Emily Arch Image - static, full width */}
        <div className="w-[115vw] -ml-[7.5vw] flex justify-center bg-ivory">
          <img
            src="https://lashpop-dam-assets.s3.us-west-2.amazonaws.com/uploads/1767752866801-a2aa5-emilyarchstaticmobile1.jpg"
            alt="Emily in decorative arch"
            className="w-full h-auto"
          />
        </div>

        {/* Text Container - static, normal scroll */}
        <div className="bg-ivory px-6 pt-6 pb-16">
          {/* Section Header */}
          <div className="text-center mb-6 max-w-lg mx-auto">
            <h2
              className="text-xl font-display font-medium tracking-wide mb-4"
              style={{ color: '#ac4d3c' }}
            >
              Welcome to Lashpop Studios
            </h2>
            <div className="w-16 h-px bg-terracotta/30 mx-auto" />
          </div>
          <div className="text-[#ac4d3c] text-base leading-relaxed font-normal font-sans max-w-lg mx-auto">
            <p className="mb-4">{letterContent.greeting}</p>

            {letterContent.paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className={index === letterContent.paragraphs.length - 1 ? "mb-6" : "mb-4"}
              >
                {paragraph}
              </p>
            ))}

            <div className="flex flex-col gap-1">
              <p>{letterContent.signOff}</p>
              <p className="text-[1.2rem]">{letterContent.signature}</p>
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
