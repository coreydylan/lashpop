'use client'

import Image from 'next/image'
import { DEFAULT_FOUNDER_LETTER, type FounderLetterContent } from '@/types/founder-letter'

interface FounderLetterSectionProps {
  content?: FounderLetterContent
}

export function FounderLetterSection({ content }: FounderLetterSectionProps) {
  // Fall back to DEFAULT_FOUNDER_LETTER if the parent didn't pass content.
  // Source of truth lives in `website_settings.section = 'founder_letter'`,
  // edited at /admin/content/founder-letter.
  const letterContent = content ?? DEFAULT_FOUNDER_LETTER

  return (
    <section className="relative w-full">

      {/* Desktop/Tablet Layout */}
      <div className="hidden md:block relative z-20 overflow-hidden">
        {/* Full-width background image */}
        <div className="relative h-screen w-full">
          <Image
            src="/lashpop-images/founder-letter-bg.jpg"
            alt="Emily in studio archway"
            fill
            className="object-cover object-right"
            priority
          />

          {/* Content overlay */}
          <div className="absolute inset-0 flex items-center">
            <div className="container">
              {/* Letter Content - Left Side */}
              <div className="max-w-xl z-30 pl-4 lg:pl-8 mt-12">
                {/* Section Header */}
                <div className="mb-6">
                  <h2
                    className="text-4xl font-display font-semibold tracking-wide"
                    style={{ color: '#3d3632' }}
                  >
                    {letterContent.heading}
                  </h2>
                </div>
                {/* Letter Content */}
                <div className="relative w-full text-[#3d3632] text-[clamp(0.95rem,1.3vw,1.25rem)] leading-relaxed font-normal font-sans italic">
                  <p className="mb-[1.5vh]">{letterContent.greeting}</p>

                  {letterContent.paragraphs.map((paragraph, index) => (
                    <p key={index} className={index === letterContent.paragraphs.length - 1 ? "mb-[2vh]" : "mb-[1.5vh]"}>
                      {paragraph}
                    </p>
                  ))}

                  <picture>
                    <source srcSet="/lashpop-images/emily-signature-2.webp" type="image/webp" />
                    <img
                      src="/lashpop-images/emily-signature-2.png"
                      alt="Xo, Emily"
                      width={88}
                      height={64}
                      className="h-16 w-auto"
                    />
                  </picture>
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
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Simple static scroll */}
      {/* Background matches surrounding ivory sections so the letter flows with the rest of the page
          instead of reading as a boxed-off chapter (the prior pink #e9d1c8 created hard horizontal
          edges against both hero above and services below). */}
      <div className="md:hidden relative bg-ivory">
        {/* Emily at studio counter - static, full width, aligned with hero bottom */}
        <div className="w-full overflow-hidden relative" style={{ aspectRatio: '2161/1575' }}>
          <Image
            src="/lashpop-images/founder-letter-bg-mobile.webp"
            alt="Emily at LashPop Studios"
            fill
            sizes="100vw"
            className="object-cover"
            quality={90}
          />
          {/* Soft ivory fade at image bottom — kills the hard horizontal cut where the desk meets the body bg */}
          <div className="absolute inset-x-0 bottom-0 h-12 pointer-events-none bg-gradient-to-b from-transparent to-[#faf6f2]" />
        </div>

        {/* Text Container */}
        <div className="px-6 pt-6 pb-16 bg-ivory">
          {/* Section Header */}
          <div className="mb-6 max-w-lg mx-auto">
            <h2
              className="text-2xl font-display font-medium tracking-wide leading-tight"
              style={{ color: '#3d3632' }}
            >
              {letterContent.heading}
            </h2>
          </div>
          {/* Letter content */}
          <div className="max-w-lg mx-auto">
            <div className="text-[#3d3632] text-base leading-relaxed font-normal font-sans italic">
              <p className="mb-4">{letterContent.greeting}</p>

              {letterContent.paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className={index === letterContent.paragraphs.length - 1 ? "mb-6" : "mb-4"}
                >
                  {paragraph}
                </p>
              ))}

              <picture>
                <source srcSet="/lashpop-images/emily-signature-2.webp" type="image/webp" />
                <img
                  src="/lashpop-images/emily-signature-2.png"
                  alt="Xo, Emily"
                  width={77}
                  height={56}
                  className="h-14 w-auto"
                />
              </picture>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
