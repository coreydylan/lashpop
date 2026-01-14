'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface GalleryImage {
  id: string
  url: string
  alt?: string
}

interface ServiceGalleryProps {
  images: GalleryImage[]
  isLoading?: boolean
}

export function ServiceGallery({ images, isLoading }: ServiceGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  const goNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % images.length)
    }
  }

  const goPrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto scrollbar-hide md:grid md:grid-cols-4 md:gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-32 h-32 md:w-auto md:h-auto md:aspect-square shrink-0 rounded-xl bg-sage/10 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (images.length === 0) {
    return null
  }

  return (
    <>
      {/* Gallery Grid - horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide md:grid md:grid-cols-4 md:gap-3 -mx-4 px-4 md:mx-0 md:px-0">
        {images.map((image, index) => (
          <motion.button
            key={image.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => openLightbox(index)}
            className="relative w-32 h-32 md:w-auto md:h-auto md:aspect-square shrink-0 rounded-xl overflow-hidden group"
          >
            <Image
              src={image.url}
              alt={image.alt || 'Service photo'}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              sizes="(max-width: 768px) 128px, 25vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </motion.button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Previous button */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-4 p-2 text-white/80 hover:text-white transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative w-[90vw] h-[80vh] md:w-[70vw] md:h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[lightboxIndex].url}
                alt={images[lightboxIndex].alt || 'Service photo'}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </motion.div>

            {/* Next button */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-4 p-2 text-white/80 hover:text-white transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {lightboxIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
