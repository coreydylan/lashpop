'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import AutoScroll from 'embla-carousel-auto-scroll'
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
        speed: 1.2,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        rootNode: (emblaRoot: HTMLElement) => emblaRoot.parentElement
      })
    ]
  )

  // Hover-based wheel scroll
  const { wheelContainerRef } = useCarouselWheelScroll(emblaApi)

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
            <div className="flex touch-pan-y gap-3 px-4">
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

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center pointer-events-none">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <svg className="w-5 h-5 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gradient edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-ivory to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-ivory to-transparent pointer-events-none z-10" />
        </div>
      </div>

      {/* Modal for enlarged image view */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] m-4"
            onClick={(e) => e.stopPropagation()}
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
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
            >
              <svg className="w-6 h-6 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
