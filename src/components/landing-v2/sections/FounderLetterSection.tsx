'use client'

import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { DEFAULT_FOUNDER_LETTER, type FounderLetterContent } from '@/types/founder-letter'
import { Editable } from '@/components/admin-mode/Editable'

interface FounderLetterSectionProps {
  content?: FounderLetterContent
}

export function FounderLetterSection({ content }: FounderLetterSectionProps) {
  // Source of truth lives in `website_settings.section = 'founder_letter'`.
  // Inline admin edits PUT the whole letter object; we hold local state so both
  // the desktop and mobile layouts reflect edits immediately (optimistic).
  const [letter, setLetter] = useState<FounderLetterContent>(content ?? DEFAULT_FOUNDER_LETTER)
  const letterRef = useRef(letter)
  letterRef.current = letter

  useEffect(() => {
    if (content) {
      setLetter(content)
      letterRef.current = content
    }
  }, [content])

  // PUT the whole letter. The founder-letter route accepts a partial and returns
  // the normalized object; we always send the full merged letter.
  const putLetter = useCallback(async (next: FounderLetterContent) => {
    const res = await fetch('/api/admin/website/founder-letter', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    })
    if (!res.ok) {
      const msg = await res.json().catch(() => null)
      throw new Error(msg?.error || 'Failed to save founder letter')
    }
    const data = await res.json()
    const saved = (data.content ?? next) as FounderLetterContent
    setLetter(saved)
    letterRef.current = saved
  }, [])

  // Merge a single scalar field into the current letter, then persist the whole.
  const saveField = useCallback(
    (field: 'heading' | 'greeting') => async (value: string) => {
      await putLetter({ ...letterRef.current, [field]: value })
    },
    [putLetter]
  )

  // Merge one paragraph by index, then persist the whole letter.
  const saveParagraph = useCallback(
    (index: number) => async (value: string) => {
      const paragraphs = [...letterRef.current.paragraphs]
      paragraphs[index] = value
      await putLetter({ ...letterRef.current, paragraphs })
    },
    [putLetter]
  )

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
                    <Editable
                      id="founder-heading-d"
                      label="Founder letter — heading"
                      kind="text"
                      as="span"
                      value={letter.heading}
                      onSave={saveField('heading')}
                    />
                  </h2>
                </div>
                {/* Letter Content */}
                <div className="relative w-full text-[#3d3632] text-[clamp(0.95rem,1.3vw,1.25rem)] leading-relaxed font-normal font-sans italic">
                  <Editable
                    id="founder-greeting-d"
                    label="Founder letter — greeting"
                    kind="multiline"
                    as="p"
                    className="mb-[1.5vh]"
                    value={letter.greeting}
                    onSave={saveField('greeting')}
                  />

                  {letter.paragraphs.map((paragraph, index) => (
                    <Editable
                      key={index}
                      id={`founder-para-d-${index}`}
                      label={`Founder letter — paragraph ${index + 1}`}
                      kind="multiline"
                      as="p"
                      className={index === letter.paragraphs.length - 1 ? 'mb-[2vh]' : 'mb-[1.5vh]'}
                      value={paragraph}
                      onSave={saveParagraph(index)}
                    />
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
                  <p>{letter.greeting}</p>
                  {letter.paragraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                  <p>{letter.signOff} {letter.signature}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Simple static scroll */}
      {/* Cream bg (#f0e0db) — pairs with the Reviews section so both
          "warm accent" blocks read as one tone family. */}
      <div className="md:hidden relative bg-cream">
        {/* Emily at studio counter - static, full width, aligned with hero bottom */}
        <div className="w-full overflow-hidden relative" style={{ aspectRatio: '2161/1575' }}>
          <Image
            src="/lashpop-images/founder-letter-bg-mobile.webp"
            alt="Emily at LashPop Studios"
            fill
            sizes="100vw"
            className="object-cover"
            quality={75}
          />
          {/* Soft cream fade at image bottom — kills the hard horizontal cut where the desk meets the body bg */}
          <div className="absolute inset-x-0 bottom-0 h-12 pointer-events-none bg-gradient-to-b from-transparent to-[#f0e0db]" />
        </div>

        {/* Text Container */}
        <div className="px-6 pt-6 pb-16 bg-cream">
          {/* Section Header — preserve the mobile "Welcome to\nLashPop Studios"
              line break for the default heading; admin-customized headings wrap
              naturally (handled in renderMobileHeading). */}
          <div className="mb-6 max-w-lg mx-auto">
            <h2
              className="text-2xl font-display font-medium tracking-wide leading-tight"
              style={{ color: '#3d3632' }}
            >
              <Editable
                id="founder-heading-m"
                label="Founder letter — heading"
                kind="text"
                as="span"
                value={letter.heading}
                onSave={saveField('heading')}
                renderDisplay={renderMobileHeading}
              />
            </h2>
          </div>
          {/* Letter content */}
          <div className="max-w-lg mx-auto">
            <div className="text-[#3d3632] text-base leading-relaxed font-normal font-sans italic">
              <Editable
                id="founder-greeting-m"
                label="Founder letter — greeting"
                kind="multiline"
                as="p"
                className="mb-4"
                value={letter.greeting}
                onSave={saveField('greeting')}
              />

              {letter.paragraphs.map((paragraph, index) => (
                <Editable
                  key={index}
                  id={`founder-para-m-${index}`}
                  label={`Founder letter — paragraph ${index + 1}`}
                  kind="multiline"
                  as="p"
                  className={index === letter.paragraphs.length - 1 ? 'mb-6' : 'mb-4'}
                  value={paragraph}
                  onSave={saveParagraph(index)}
                />
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

/**
 * Mobile-only render: preserves the original "Welcome to<br/>LashPop Studios"
 * two-line layout for the default heading. Any other heading text is
 * rendered as-is and wraps naturally.
 */
function renderMobileHeading(heading: string): React.ReactNode {
  if (heading === DEFAULT_FOUNDER_LETTER.heading) {
    return (
      <>
        Welcome to<br />LashPop Studios
      </>
    )
  }
  return heading
}
