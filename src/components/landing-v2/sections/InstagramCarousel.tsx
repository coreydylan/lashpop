'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { useInView } from 'framer-motion'

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
  const scrollRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-20%" })
  const [isPaused, setIsPaused] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const controls = useAnimation()

  // Use provided posts or fallback to gallery images
  const displayImages = posts.length > 0 
    ? posts.map(p => p.mediaUrl)
    : galleryImages

  // Auto-scroll functionality
  useEffect(() => {
    if (!isPaused && isInView && scrollRef.current) {
      const scroll = async () => {
        const scrollWidth = scrollRef.current?.scrollWidth || 0
        const clientWidth = scrollRef.current?.clientWidth || 0
        const maxScroll = scrollWidth - clientWidth

        // Scroll to end
        await controls.start({
          x: -maxScroll,
          transition: {
            duration: 60, // Slower scroll for better viewing
            ease: "linear",
          }
        })

        // Reset to start
        controls.set({ x: 0 })

        // Start again
        if (!isPaused) {
          scroll()
        }
      }

      scroll()
    }
  }, [isPaused, isInView, controls])

  const handlePauseScroll = () => {
    setIsPaused(true)
    controls.stop()
  }

  const handleResumeScroll = () => {
    setIsPaused(false)
  }

  return (
    <>
      <section ref={ref} className="relative py-20 overflow-hidden bg-gradient-to-b from-cream to-warm-sand/30">
        <div className="container mb-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="heading-2 text-dune mb-4">Our Work</h2>
            <p className="body-text text-dune/70">
              Follow us on Instagram @lashpopstudios for daily inspiration
            </p>
          </motion.div>
        </div>

        {/* Carousel Container */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, x: 100 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div
            ref={scrollRef}
            className="overflow-hidden"
            onMouseEnter={handlePauseScroll}
            onMouseLeave={handleResumeScroll}
          >
            <motion.div
              className="flex gap-4 px-6"
              animate={controls}
            >
              {/* Duplicate images for infinite scroll effect */}
              {[...displayImages, ...displayImages].map((image, index) => (
                <motion.div
                  key={index}
                  className="shrink-0 w-80 h-80 cursor-pointer group"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="relative w-full h-full overflow-hidden rounded-2xl">
                    <img
                      src={image}
                      alt={`Gallery image ${index + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ opacity: 1, scale: 1 }}
                        className="bg-white/90 backdrop-blur-sm rounded-full p-3"
                      >
                        <svg className="w-6 h-6 text-dune" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Gradient edges for seamless look */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-cream to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-warm-sand/30 to-transparent pointer-events-none z-10" />
        </motion.div>

        {/* Instagram CTA */}
        <motion.div
          className="container mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <a
            href="https://instagram.com/lashpopstudios"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 button-secondary group"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
            </svg>
            <span>Follow @lashpopstudios</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
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
            <img
              src={selectedImage}
              alt="Enlarged view"
              className="w-full h-full object-contain rounded-lg"
            />
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