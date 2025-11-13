/**
 * HeroArchwayReveal - Main orchestrator component
 *
 * This component creates a scroll-based experience that:
 * 1. Shows hero with archway revealing a key image
 * 2. Expands archway to full screen as hero scrolls away
 * 3. Reveals full photo grid underneath
 * 4. Scrolls through 1 viewport height of grid
 * 5. Transitions to next section
 */

'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useGridImages } from './hooks/useGridImages'
import { useScrollPhases } from './hooks/useScrollPhases'
import { useReducedMotion } from './hooks/useReducedMotion'
import { ImageMosaicJustified } from './ImageMosaicJustified'
import { HERO_ANIMATION } from './animations'

interface HeroArchwayRevealProps {
  heroContent: React.ReactNode
  nextSection?: React.ReactNode
}

export function HeroArchwayReveal({ heroContent, nextSection }: HeroArchwayRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  // Set up scroll tracking
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  // Track current scroll phase
  const currentPhase = useScrollPhases(scrollYProgress)

  // Fetch grid images
  const { images, isLoading } = useGridImages()

  // Hero scroll-away animation (simplified if reduced motion)
  const heroY = useTransform(
    scrollYProgress,
    [0, 0.4],
    prefersReducedMotion ? [0, 0] : [0, HERO_ANIMATION.translateY.to]
  )

  const heroOpacity = useTransform(
    scrollYProgress,
    [0.2, 0.4],
    prefersReducedMotion
      ? [HERO_ANIMATION.opacity.from, HERO_ANIMATION.opacity.from]
      : [HERO_ANIMATION.opacity.from, HERO_ANIMATION.opacity.to]
  )

  // Next section slide-in animation
  const nextSectionY = useTransform(
    scrollYProgress,
    [0.7, 1.0],
    prefersReducedMotion ? [0, 0] : [100, 0]
  )

  const nextSectionOpacity = useTransform(
    scrollYProgress,
    [0.7, 0.9],
    [0, 1]
  )

  // If reduced motion, show simplified version
  if (prefersReducedMotion) {
    return (
      <div className="relative">
        <div className="relative z-10">{heroContent}</div>
        {!isLoading && images.length > 0 && (
          <div className="w-full py-20 bg-warm-sand/30">
            <div className="container-wide">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg">
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {nextSection && <div className="relative z-5">{nextSection}</div>}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative" style={{ height: '400vh' }}>
      {/* Page Surface Layer (z-10) - Hero Section */}
      <motion.div
        className="sticky top-0 w-full h-screen overflow-hidden"
        style={{
          y: heroY,
          opacity: heroOpacity,
          zIndex: 10,
        }}
      >
        {heroContent}
      </motion.div>

      {/* Subsurface Layer (z-1) - Image Grid */}
      {!isLoading && images.length > 0 && (
        <ImageMosaicJustified images={images} scrollYProgress={scrollYProgress} />
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="fixed inset-0 w-full h-screen bg-warm-sand/20 z-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 mx-auto border-2 border-golden border-t-transparent rounded-full"
            />
            <p className="caption text-dune/60">Loading gallery...</p>
          </div>
        </div>
      )}

      {/* Next Section - Slides in at the end */}
      {nextSection && (
        <motion.div
          className="absolute bottom-0 w-full bg-gradient-to-b from-transparent to-warm-sand"
          style={{
            y: nextSectionY,
            opacity: nextSectionOpacity,
            zIndex: 5,
          }}
        >
          {nextSection}
        </motion.div>
      )}

      {/* Debug indicator (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50 glass rounded-lg px-4 py-2 shadow-lg">
          <p className="caption text-dune">
            <span className="font-medium">Phase:</span> {currentPhase}
          </p>
          <p className="caption text-dune/60 mt-1">
            <span className="font-medium">Images:</span> {images.length}
          </p>
        </div>
      )}
    </div>
  )
}

export { useGridImages } from './hooks/useGridImages'
export { useScrollPhases } from './hooks/useScrollPhases'
export { useMosaicLayout } from './hooks/useMosaicLayout'
export { ImageMosaicJustified } from './ImageMosaicJustified'
export type { GridImage, ScrollPhase, MosaicLayoutConfig } from './types'
