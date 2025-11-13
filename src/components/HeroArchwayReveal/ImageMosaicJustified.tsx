/**
 * ImageMosaicJustified - Perfect-fit photo grid with zero gaps
 *
 * Uses justified layout algorithm (like Google Photos) to create
 * a beautiful mosaic where images of different sizes fit perfectly
 * with no gaps, filling exactly 1 viewport height.
 */

'use client'

import { motion, MotionValue, useTransform } from 'framer-motion'
import Image from 'next/image'
import { useMemo, useState, useEffect } from 'react'
import type { GridImage } from './types'
import { calculateJustifiedLayout } from './algorithms/justifiedLayout'
import { GRID_ANIMATION } from './animations'

interface ImageMosaicJustifiedProps {
  images: GridImage[]
  scrollYProgress: MotionValue<number>
}

export function ImageMosaicJustified({
  images,
  scrollYProgress,
}: ImageMosaicJustifiedProps) {
  const [containerWidth, setContainerWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1920
  )
  const [targetHeight, setTargetHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 1080
  )

  // Update dimensions on resize
  useEffect(() => {
    function handleResize() {
      setContainerWidth(window.innerWidth)
      setTargetHeight(window.innerHeight)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calculate justified layout
  const layout = useMemo(() => {
    if (images.length === 0) return { images: [], totalHeight: 0, rows: 0 }

    // Use smaller row heights on mobile
    const rowHeight = containerWidth < 640 ? 200 : containerWidth < 1024 ? 250 : 300
    const maxRowHeight = containerWidth < 640 ? 300 : containerWidth < 1024 ? 350 : 400
    const minRowHeight = containerWidth < 640 ? 150 : 200

    return calculateJustifiedLayout(
      images,
      containerWidth,
      targetHeight,
      rowHeight,
      maxRowHeight,
      minRowHeight
    )
  }, [images, containerWidth, targetHeight])

  // Grid opacity - fades out during transition phase
  const gridOpacity = useTransform(
    scrollYProgress,
    [0.7, 0.9],
    [1, 0]
  )

  return (
    <motion.div
      className="fixed inset-0 w-full overflow-hidden"
      style={{
        opacity: gridOpacity,
        zIndex: 1,
      }}
    >
      {/* Absolute positioned container for justified layout */}
      <div className="relative w-full" style={{ height: `${layout.totalHeight}px` }}>
        {layout.images.map((layoutImage, index) => (
          <MosaicImage
            key={layoutImage.image.id}
            layoutImage={layoutImage}
            index={index}
            scrollYProgress={scrollYProgress}
          />
        ))}
      </div>
    </motion.div>
  )
}

interface MosaicImageProps {
  layoutImage: {
    image: GridImage
    width: number
    height: number
    x: number
    y: number
    scale: number
  }
  index: number
  scrollYProgress: MotionValue<number>
}

function MosaicImage({ layoutImage, index, scrollYProgress }: MosaicImageProps) {
  const { image, width, height, x, y } = layoutImage

  // Optional subtle parallax effect
  const parallaxY = useTransform(
    scrollYProgress,
    [0.4, 0.7],
    [0, -30 * GRID_ANIMATION.parallaxStrength * ((index % 5) - 2)]
  )

  // Stagger fade-in animation
  const opacity = useTransform(
    scrollYProgress,
    [0.4 + index * 0.01, 0.4 + index * 0.01 + 0.15],
    [0, 1]
  )

  // Scale animation on scroll in
  const scale = useTransform(
    scrollYProgress,
    [0.4 + index * 0.01, 0.4 + index * 0.01 + 0.15],
    [0.95, 1]
  )

  return (
    <motion.div
      className="absolute overflow-hidden group"
      style={{
        left: x,
        top: y,
        width,
        height,
        y: parallaxY,
        opacity,
        scale,
      }}
    >
      <Image
        src={image.url}
        alt={image.alt}
        fill
        className="object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:brightness-110"
        sizes={`${Math.round((width / window.innerWidth) * 100)}vw`}
        quality={90}
        priority={index < 8}
      />

      {/* Soft overlay on hover for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-dune/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Subtle border on hover */}
      <div className="absolute inset-0 ring-1 ring-inset ring-white/0 group-hover:ring-white/20 transition-all duration-700" />

      {/* Key image indicator */}
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
