'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import AutoScroll from 'embla-carousel-auto-scroll'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'

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
  const isInView = useInView(ref, { once: true, margin: "-20%" })
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Initialize Embla with AutoScroll
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
        speed: 1.5, // Increased back to 1.5 as requested
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        rootNode: (emblaRoot: HTMLElement) => emblaRoot.parentElement 
      })
    ]
  )

  // Handle trackpad/mouse wheel scrolling
  useEffect(() => {
    if (!emblaApi) return

    const onWheel = (event: WheelEvent) => {
      // Only handle horizontal scrolling
      // We check if the user is intentionally scrolling horizontally
      const isHorizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      
      if (isHorizontal) {
        // Stop the event from scrolling the page (if supported) or triggering back/forward
        event.preventDefault()
        
        const engine = (emblaApi as any).internalEngine()
        
        if (engine && engine.animation && engine.location) {
           // Stop auto-scroll animation temporarily while user interacts
           const autoScroll = emblaApi.plugins().autoScroll
           if (autoScroll && autoScroll.isPlaying()) {
             autoScroll.stop()
           }

           // Emulate "drag" physics by using scrollBody instead of direct location setting
           // This ensures the momentum and friction feel exactly like a touch drag
           // Multiplier 2.5 matches the "feel" of direct touch manipulation better for wheel events
           engine.scrollBody.useBaseFriction().useDuration(20) // Small duration helps it "catch" the drag
           const delta = event.deltaX * -1 // Invert delta for natural scroll direction
           const target = engine.location.get() + delta
           engine.location.set(target)
           engine.translate.to(target)
           engine.animation.start()
        }
      }
    }

    // Add wheel listener to the viewport with { passive: false } to allow preventDefault
    const viewport = emblaApi.rootNode()
    viewport.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      viewport.removeEventListener('wheel', onWheel)
    }
  }, [emblaApi])

  // Use provided posts or fallback to gallery images
  // We duplicate them once to ensure smooth looping even on wide screens
  const rawItems = posts.length > 0 
    ? posts.map(p => ({ mediaUrl: p.mediaUrl, permalink: p.permalink }))
    : galleryImages.map(url => ({ mediaUrl: url, permalink: null }))

  // Triple the items to ensure absolutely seamless infinite scroll on large screens
  const displayItems = [...rawItems, ...rawItems, ...rawItems]

  return (
    <>
      <section ref={ref} className="relative py-20 overflow-hidden bg-cream">
        {/* Follow Button Header - Styled like review stats */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center px-4">
            <motion.a
              href="https://instagram.com/lashpopstudios"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Frosted Glass Badge with Emboss/Deboss Effect */}
              <div className="relative group">
                {/* Subtle outer glow/shadow */}
                <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-50 group-hover:opacity-70 transition-opacity" />

                {/* Main badge */}
                <div className="relative px-5 py-3 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_3px_rgba(0,0,0,0.1)] transition-all duration-300 group-hover:bg-white/60 group-hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.12)]">
                  <div className="flex items-center gap-3">
                    {/* Instagram Icon */}
                    <svg className="w-5 h-5 text-dune" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                    </svg>

                    {/* Vertical Divider */}
                    <div className="h-5 w-px bg-gradient-to-b from-transparent via-sage/20 to-transparent" />

                    {/* Text */}
                    <span className="font-sans text-sm font-medium text-dune/80 tracking-tight">
                      Follow @lashpopstudios
                    </span>

                    {/* Arrow Icon */}
                    <svg className="w-4 h-4 text-dune/60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.a>
          </div>
        </motion.div>

        {/* Carousel Container */}
        <motion.div
          className="relative w-full"
          initial={{ opacity: 0, x: 100 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Embla Viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            {/* Embla Container */}
            <div className="flex touch-pan-y gap-4 px-4">
              {displayItems.map((item, index) => (
                <div
                  key={index}
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
                      className="object-cover"
                      draggable={false} // Prevent default image drag ghost
                    />
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center pointer-events-none">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ opacity: 1, scale: 1 }}
                        className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg"
                      >
                        {item.permalink ? (
                          <svg className="w-6 h-6 text-dune" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-dune" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gradient edges for seamless look */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-cream to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-cream to-transparent pointer-events-none z-10" />
        </motion.div>
      </section>

      {/* Modal for enlarged image view */}
      {selectedImage && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedImage(null)}
        >
          <motion.div
            className="relative max-w-4xl max-h-[90vh] m-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
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
              <svg className="w-6 h-6 text-dune" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}
