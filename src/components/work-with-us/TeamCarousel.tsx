'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import AutoScroll from 'embla-carousel-auto-scroll'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCarouselWheelScroll } from '@/hooks/useCarouselWheelScroll'
import { getEnabledCarouselPhotos } from '@/actions/work-with-us-carousel'

interface TeamCarouselProps {
  photos?: { filePath: string }[]
}

export function TeamCarousel({ photos: initialPhotos }: TeamCarouselProps) {
  const ref = useRef(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [photos, setPhotos] = useState<{ filePath: string }[]>(initialPhotos || [])
  const [loading, setLoading] = useState(!initialPhotos)

  // Fetch photos on mount if not provided via props
  useEffect(() => {
    if (!initialPhotos) {
      getEnabledCarouselPhotos().then((data) => {
        setPhotos(data)
        setLoading(false)
      })
    }
  }, [initialPhotos])

  // Initialize Embla with AutoScroll
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      dragFree: true,
      containScroll: false,
      align: 'center',
      skipSnaps: true,
      inViewThreshold: 0.7
    },
    [
      AutoScroll({
        playOnInit: true,
        speed: 1.5,
        // True so a drag or arrow click stops the auto-scroll instead of
        // fighting it (was producing the "stuck, can't scroll left/right"
        // bug — manual drag would advance one frame then snap back).
        stopOnInteraction: true,
        stopOnMouseEnter: true,
        rootNode: (emblaRoot: HTMLElement) => emblaRoot.parentElement
      })
    ]
  )

  // Hover-based wheel scroll
  const { wheelContainerRef } = useCarouselWheelScroll(emblaApi)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  // Triple the items for seamless infinite scroll
  const displayItems = [...photos, ...photos, ...photos]

  if (loading || photos.length === 0) {
    return null
  }

  return (
    <>
      <div ref={ref} className="relative w-full overflow-hidden py-6 md:py-8">
        {/* Carousel Container */}
        <div ref={wheelContainerRef} className="relative w-full">
          {/* Embla Viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            {/* Embla Container */}
            <div className="flex touch-pan-y gap-4 px-4">
              {displayItems.map((item, index) => (
                <div
                  key={`${index}-${item.filePath}`}
                  className="flex-[0_0_auto] w-56 h-56 md:w-64 md:h-64 min-w-0 cursor-grab active:cursor-grabbing group relative"
                  onClick={() => setSelectedImage(item.filePath)}
                >
                  <div className="relative w-full h-full overflow-hidden rounded-2xl transform transition-transform duration-300 group-hover:scale-[1.02]">
                    <Image
                      src={item.filePath}
                      alt={`Team photo ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 224px, 256px"
                      className="object-cover"
                      draggable={false}
                    />

                    {/* Clean hover - no dark overlay or icon */}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gradient edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-ivory to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-ivory to-transparent pointer-events-none z-10" />

          {/* Desktop prev/next — give Corey something to click instead of
              fighting the auto-scroll with a drag. Hidden on touch since
              mobile uses native horizontal swipe. */}
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous photo"
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white/85 text-charcoal/70 shadow-md backdrop-blur transition-colors hover:bg-white hover:text-charcoal"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next photo"
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white/85 text-charcoal/70 shadow-md backdrop-blur transition-colors hover:bg-white hover:text-charcoal"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Modal for enlarged image view */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              className="relative max-w-4xl max-h-[90vh] m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-full min-h-[50vh] min-w-[50vw] overflow-hidden rounded-lg">
                {/* Blurred backdrop using the already-warm thumb URL — fills
                    the void during the cold CF Image fetch of the full-res
                    version. Picks up the next pixels gracefully when the
                    primary image swaps in over the top. */}
                <Image
                  src={selectedImage}
                  alt=""
                  fill
                  aria-hidden
                  className="object-cover scale-110 blur-2xl opacity-60"
                  sizes="(max-width: 768px) 256px, 320px"
                  draggable={false}
                />
                <Image
                  src={selectedImage}
                  alt="Enlarged view"
                  fill
                  priority
                  quality={80}
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 896px"
                />
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                aria-label="Close"
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
              >
                <X className="w-6 h-6 text-charcoal" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
