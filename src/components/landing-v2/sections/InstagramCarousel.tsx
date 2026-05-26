'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import AutoScroll from 'embla-carousel-auto-scroll'
import { AnimatePresence, motion } from 'framer-motion'
import { useCarouselWheelScroll } from '@/hooks/useCarouselWheelScroll'
import { SectionRule } from '../SectionRule'

// Stub data using gallery images for now
const galleryImages = [
  '/lashpop-images/gallery/gallery-075b32b2.jpg',
  '/lashpop-images/gallery/gallery-1b1e9a79.jpg',
  '/lashpop-images/gallery/gallery-img-1754.jpg',
  '/lashpop-images/gallery/gallery-img-3405.jpeg',
  '/lashpop-images/gallery/gallery-img-3961.jpeg',
  '/lashpop-images/gallery/gallery-img-3962.jpeg',
  '/lashpop-images/gallery/gallery-img-3973.jpeg',
  '/lashpop-images/gallery/gallery-img-3974.jpeg',
  '/lashpop-images/gallery/gallery-img-7044.jpg',
  '/lashpop-images/gallery/gallery-lash-40.jpeg',
  '/lashpop-images/gallery/lash-102.jpeg',
  '/lashpop-images/gallery/lash-136.jpeg',
  '/lashpop-images/gallery/lash-92.jpeg',
]

interface InstagramPost {
  id: string
  mediaUrl: string
  permalink: string
  caption: string | null
}

interface InstagramCarouselProps {
  posts?: InstagramPost[]
}

export function InstagramCarousel({ posts = [] }: InstagramCarouselProps) {
  const ref = useRef(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Initialize Embla with AutoScroll (wheel gestures handled by useCarouselWheelScroll)
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      dragFree: true, // Keeps the "free scroll" feel
      containScroll: false, // Allow infinite scroll without hard bounds
      align: 'center',
      skipSnaps: true,
      inViewThreshold: 0.7 // Better intersection handling
    },
    [
      AutoScroll({
        playOnInit: true,
        speed: 1.5,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        rootNode: (emblaRoot: HTMLElement) => emblaRoot.parentElement
      })
    ]
  )

  // Hover-based wheel scroll - only captures wheel events when hovering
  const { wheelContainerRef } = useCarouselWheelScroll(emblaApi)

  // Use provided posts or fallback to gallery images
  // We duplicate them once to ensure smooth looping even on wide screens
  const rawItems = posts.length > 0
    ? posts.map(p => ({ mediaUrl: p.mediaUrl, permalink: p.permalink }))
    : galleryImages.map(url => ({ mediaUrl: url, permalink: null }))

  // Triple the items to ensure absolutely seamless infinite scroll on large screens
  const displayItems = [...rawItems, ...rawItems, ...rawItems]

  return (
    <>
      <section ref={ref} id="gallery" className="relative py-12 md:py-20 overflow-hidden bg-ivory">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2
            className="text-2xl md:text-5xl font-display font-medium tracking-wide mb-4 md:mb-6"
            style={{ color: '#cc947f' }}
          >
            Gallery
          </h2>
          <SectionRule />
        </div>

        {/* Carousel Container */}
        <div
          ref={wheelContainerRef}
          className="relative w-full"
        >
          {/* Embla Viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            {/* Embla Container */}
            <div className="flex touch-pan-y gap-4 px-4">
              {displayItems.map((item, index) => (
                <div
                  key={`${index}-${item.mediaUrl}`}
                  className="flex-[0_0_auto] w-80 h-80 min-w-0 cursor-grab active:cursor-grabbing group relative"
                  onClick={() => {
                    if (item.permalink) {
                      window.open(item.permalink, '_blank', 'noopener,noreferrer')
                    } else {
                      setSelectedImage(item.mediaUrl)
                    }
                  }}
                >
                  <div className="relative w-full h-full overflow-hidden rounded-2xl transform transition-transform duration-300 group-hover:scale-[1.02]">
                    <Image
                      src={item.mediaUrl}
                      alt={`Gallery image ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 320px"
                      className="object-cover transition-opacity duration-300 ease-out"
                      style={{ opacity: loadedImages.has(item.mediaUrl) ? 1 : 0 }}
                      draggable={false}
                      onLoad={() => setLoadedImages((prev) => {
                        if (prev.has(item.mediaUrl)) return prev
                        const next = new Set(prev)
                        next.add(item.mediaUrl)
                        return next
                      })}
                    />

                    {/* Clean hover - no dark overlay or icon */}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gradient edges for seamless look */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-cream to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-cream to-transparent pointer-events-none z-10" />
        </div>

        {/* Follow Button - Below Carousel */}
        <div className="mt-10 md:mt-12">
          <div className="flex justify-center px-4">
            <a
              href="https://instagram.com/lashpopstudios"
              target="_blank"
              rel="noopener noreferrer"
            >
              {/* Frosted Glass Badge with Emboss/Deboss Effect */}
              <div className="relative group">
                {/* Subtle outer glow/shadow */}
                <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-50 group-hover:opacity-70 transition-opacity" />

                {/* Main badge */}
                <div className="relative px-5 py-3 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_3px_rgba(0,0,0,0.1)] transition-[background-color] duration-300 group-hover:bg-white/60">
                  <div className="flex items-center gap-3">
                    {/* Instagram Icon */}
                    <svg className="w-5 h-5" style={{ color: '#cc947f' }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                    </svg>

                    {/* Vertical Divider */}
                    <div className="h-5 w-px bg-gradient-to-b from-transparent via-sage/20 to-transparent" />

                    {/* Text */}
                    <span className="font-sans text-sm font-medium tracking-tight" style={{ color: '#cc947f' }}>
                      Follow @lashpopstudios
                    </span>

                    {/* Arrow Icon */}
                    <svg className="w-4 h-4 text-dune/60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Modal for enlarged image view */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            key="gallery-modal-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <motion.div
              key={selectedImage}
              className="relative max-w-4xl max-h-[90vh] m-4"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            >
              <div className="relative w-full h-full min-h-[50vh] min-w-[50vw]">
                <Image
                  src={selectedImage}
                  alt="Enlarged view"
                  fill
                  className="object-contain rounded-lg"
                  sizes="100vw"
                />
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                aria-label="Close enlarged image"
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
              >
                <svg className="w-6 h-6 text-dune" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
