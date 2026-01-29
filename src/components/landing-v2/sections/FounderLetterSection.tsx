'use client'

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
  greeting: 'I\'m so glad you\'re here.',
  paragraphs: [
    'When I launched LashPop back in 2016, I wanted something simple: a place where women could feel genuinely cared for and walk out looking refreshed without the long routine. That idea grew into the beauty collective we have today: artists who specialize in lashes, brows, skincare, injectables, waxing, permanent jewelry, and more, all with one goal in mind.',
    'We\'re united by the same mission: helping you feel effortlessly beautiful and confident, with a few less things to stress about during your busy week. If we can give you that "just woke up from eight blissful hours" look with almost no effort (even if you\'re running on five), we\'ll call that a win.',
    'We can\'t wait to see you soon!'
  ],
  signOff: 'Xo,',
  signature: 'Emily'
}

export function FounderLetterSection({ content }: FounderLetterSectionProps) {
  // Use provided content or fallback to defaults
  const letterContent = content || defaultContent

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
              <div className="max-w-xl z-30 pl-4 lg:pl-8">
                {/* Section Header */}
                <div className="mb-8">
                  <h2
                    className="text-3xl font-display font-medium tracking-wide mb-6"
                    style={{ color: '#ac4d3c' }}
                  >
                    Welcome to LashPop Studios
                  </h2>
                  <div className="w-16 h-px bg-terracotta/30" />
                </div>
                {/* Letter Content */}
                <div className="relative w-full text-[#3d3632] text-[clamp(0.95rem,1.3vw,1.25rem)] leading-relaxed font-normal font-sans italic">
                  <p className="mb-[1.5vh]">{letterContent.greeting}</p>

                  {letterContent.paragraphs.map((paragraph, index) => (
                    <p key={index} className={index === letterContent.paragraphs.length - 1 ? "mb-[2vh]" : "mb-[1.5vh]"}>
                      {paragraph}
                    </p>
                  ))}

                  <div className="flex flex-col gap-[0.5vh]">
                    <p>{letterContent.signOff}</p>
                    <p>{letterContent.signature}</p>
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
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Simple static scroll */}
      <div className="md:hidden relative bg-ivory">
        {/* Emily Arch Image - static, full width */}
        <div className="w-full flex justify-center bg-ivory">
          <img
            src="/lashpop-images/founder-letter-bg-mobile.jpg"
            alt="Emily in studio archway"
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
          <div className="text-[#3d3632] text-base leading-relaxed font-normal font-sans italic max-w-lg mx-auto">
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
              <p>{letterContent.signature}</p>
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
