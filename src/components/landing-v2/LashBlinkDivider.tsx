'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'

// Lash icon paths - alternating between the 3 types to fill full width
const lashIcons = [
  '/lashpop-images/lashicons/Classic+Lash+Photo+White.png.webp',
  '/lashpop-images/lashicons/Hybrid+Lash+White.png.webp',
  '/lashpop-images/lashicons/Volume+Lash+Logo.png.webp',
  '/lashpop-images/lashicons/Classic+Lash+Photo+White.png.webp',
  '/lashpop-images/lashicons/Hybrid+Lash+White.png.webp',
  '/lashpop-images/lashicons/Volume+Lash+Logo.png.webp',
  '/lashpop-images/lashicons/Classic+Lash+Photo+White.png.webp',
  '/lashpop-images/lashicons/Hybrid+Lash+White.png.webp',
  '/lashpop-images/lashicons/Volume+Lash+Logo.png.webp',
  '/lashpop-images/lashicons/Classic+Lash+Photo+White.png.webp',
  '/lashpop-images/lashicons/Hybrid+Lash+White.png.webp',
]

// Stagger delays for the "wink wave" effect - center-out pattern
// With 7 lashes: center is index 3, then 2&4, then 1&5, then 0&6
const getStaggerDelay = (index: number, total: number): number => {
  const center = Math.floor(total / 2)
  const distanceFromCenter = Math.abs(index - center)
  return distanceFromCenter * 0.06 // 60ms stagger between each "ring"
}

interface LashProps {
  src: string
  index: number
  total: number
  scrollProgress: any // MotionValue<number>
}

function BlinkingLash({ src, index, total, scrollProgress }: LashProps) {
  const staggerDelay = getStaggerDelay(index, total)

  // Each lash has its own timing based on stagger
  // The blink happens in the middle of the scroll range (0.3 to 0.7)
  // Adjust input range based on stagger to create wave effect
  const blinkStart = 0.3 + staggerDelay
  const blinkPeak = 0.5 + staggerDelay
  const blinkEnd = 0.7 + staggerDelay

  // Rotation: 0 -> 180 (closed) -> 0 (open)
  // This flips the lash vertically to simulate closing
  const rotateX = useTransform(
    scrollProgress,
    [blinkStart, blinkPeak, blinkEnd],
    [0, 90, 0]
  )

  // Scale: slight squeeze at peak of blink
  const scaleY = useTransform(
    scrollProgress,
    [blinkStart, blinkPeak, blinkEnd],
    [1, 0.3, 1]
  )

  // Opacity: slight dim at peak
  const opacity = useTransform(
    scrollProgress,
    [blinkStart, blinkPeak, blinkEnd],
    [0.7, 0.4, 0.7]
  )

  return (
    <motion.div
      className="relative flex-1 h-16 md:h-24 lg:h-32"
      style={{
        rotateX,
        scaleY,
        opacity,
        transformStyle: 'preserve-3d',
        transformOrigin: 'center bottom', // Pivot from bottom like an eyelid
      }}
    >
      {/* Lash - flipped vertically, white color */}
      <Image
        src={src}
        alt="Lash"
        fill
        className="object-contain"
        style={{
          filter: 'brightness(0) invert(1)', // Pure white
          transform: 'scaleY(-1)', // Flip vertically
        }}
      />
    </motion.div>
  )
}

export function LashBlinkDivider() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Track scroll progress through this element
  // The animation triggers when the divider is in view
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"] // Full range as element passes through viewport
  })

  return (
    <div
      ref={containerRef}
      className="relative h-0 w-full z-20 pointer-events-none"
      style={{
        // Position at exact intersection - pulled up to overlap both sections
        marginTop: '-2rem',
        marginBottom: '-2rem',
      }}
    >
      {/* The lash row - full width */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-4 md:px-8 lg:px-12">
        {lashIcons.map((src, index) => (
          <BlinkingLash
            key={index}
            src={src}
            index={index}
            total={lashIcons.length}
            scrollProgress={scrollYProgress}
          />
        ))}
      </div>

      {/* Subtle full-width glow effect during blink */}
      <motion.div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.15) 70%, transparent)',
          opacity: useTransform(
            scrollYProgress,
            [0.3, 0.5, 0.7],
            [0, 1, 0]
          ),
        }}
      />
    </div>
  )
}
