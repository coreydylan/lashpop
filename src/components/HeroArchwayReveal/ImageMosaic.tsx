/**
 * ImageMosaic - Edge-to-edge photo grid with masonry layout
 */

'use client'

import { motion, MotionValue, useTransform } from 'framer-motion'
import Image from 'next/image'
import { useMemo } from 'react'
import type { GridImage, MosaicLayoutConfig } from './types'
import { DEFAULT_LAYOUT_CONFIG } from './types'
import { useMosaicLayout } from './hooks/useMosaicLayout'
import { GRID_ANIMATION } from './animations'

interface ImageMosaicProps {
  images: GridImage[]
  scrollYProgress: MotionValue<number>
  config?: MosaicLayoutConfig
}

export function ImageMosaic({
  images,
  scrollYProgress,
  config = DEFAULT_LAYOUT_CONFIG,
}: ImageMosaicProps) {
  // Calculate layout
  const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
  const { layout, columnCount } = useMosaicLayout(images, config, containerWidth)

  // Grid opacity - fades out during transition phase
  const gridOpacity = useTransform(
    scrollYProgress,
    [0.7, 0.9], // Transition out phase
    [1, 0]
  )

  // Calculate grid template columns
  const gridTemplateColumns = useMemo(() => {
    return `repeat(${columnCount}, 1fr)`
  }, [columnCount])

  return (
    <motion.div
      className="fixed inset-0 w-full"
      style={{
        opacity: gridOpacity,
        zIndex: 1,
      }}
    >
      <div
        className="grid w-full h-full"
        style={{
          gridTemplateColumns,
          gap: `${config.gap}px`,
          gridAutoFlow: 'dense',
        }}
      >
        {images.map((image, index) => (
          <MosaicImage
            key={image.id}
            image={image}
            index={index}
            scrollYProgress={scrollYProgress}
          />
        ))}
      </div>
    </motion.div>
  )
}

interface MosaicImageProps {
  image: GridImage
  index: number
  scrollYProgress: MotionValue<number>
}

function MosaicImage({ image, index, scrollYProgress }: MosaicImageProps) {
  // Optional subtle parallax effect
  const y = useTransform(
    scrollYProgress,
    [0.4, 0.7],
    [0, -50 * GRID_ANIMATION.parallaxStrength * (index % 3)]
  )

  // Stagger fade-in animation
  const opacity = useTransform(
    scrollYProgress,
    [0.4 + index * 0.02, 0.4 + index * 0.02 + 0.1],
    [0, 1]
  )

  return (
    <motion.div
      className="relative overflow-hidden group"
      style={{
        aspectRatio: image.aspectRatio,
        y,
        opacity,
      }}
    >
      <Image
        src={image.url}
        alt={image.alt}
        fill
        className="object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:brightness-110"
        sizes={`(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw`}
        quality={90}
        priority={index < 6} // Prioritize first few images
      />

      {/* Soft overlay on hover for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-dune/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Subtle border on hover */}
      <div className="absolute inset-0 ring-1 ring-inset ring-white/0 group-hover:ring-white/20 transition-all duration-700" />

      {/* Key image indicator (optional visual indicator) */}
      {image.isKeyImage && (
        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="glass rounded-full px-3 py-1.5 backdrop-blur-md">
            <span className="caption text-golden font-medium">Featured</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
