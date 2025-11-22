'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'framer-motion'

interface Review {
  id: string
  reviewerName: string
  subject: string | null
  reviewText: string
  rating: number
  reviewDate: Date | null
}

interface ReviewsSectionProps {
  reviews: Review[]
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  const ref = useRef(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-20%" })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [expandedReview, setExpandedReview] = useState<string | null>(null)

  // Auto-rotate reviews
  useEffect(() => {
    if (reviews.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [reviews.length])

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-5 h-5 ${i < rating ? 'text-golden' : 'text-sage/30'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return null
  }

  return (
    <section ref={ref} className="py-20 bg-gradient-to-b from-warm-sand/30 to-cream">
      <div className="container">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="heading-2 text-dune mb-4">What Our Clients Say</h2>
          <p className="body-text text-dune/70">
            Real reviews from our amazing clients
          </p>
        </motion.div>

        {/* Reviews Container - Horizontal Scroll */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Navigation Buttons */}
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors"
            aria-label="Previous review"
          >
            <svg className="w-5 h-5 text-dune" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors"
            aria-label="Next review"
          >
            <svg className="w-5 h-5 text-dune" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Reviews Carousel */}
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-hide px-12"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            <div className="flex gap-6 pb-4">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  className="shrink-0 w-96"
                  style={{ scrollSnapAlign: 'center' }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: 0.1 * (index % 3) }}
                >
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col">
                    {/* Rating */}
                    <div className="mb-4">
                      {renderStars(review.rating)}
                    </div>

                    {/* Review Text */}
                    <div className="flex-1">
                      <AnimatePresence mode="wait">
                        {expandedReview === review.id ? (
                          <motion.p
                            key="expanded"
                            className="body-text text-dune/80 mb-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            {review.reviewText}
                          </motion.p>
                        ) : (
                          <motion.p
                            key="collapsed"
                            className="body-text text-dune/80 mb-4 line-clamp-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            {review.reviewText}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      {review.reviewText.length > 200 && (
                        <button
                          onClick={() => setExpandedReview(
                            expandedReview === review.id ? null : review.id
                          )}
                          className="caption text-dusty-rose hover:text-dusty-rose/80 transition-colors"
                        >
                          {expandedReview === review.id ? 'Read less' : 'Read more'}
                        </button>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-6 border-t border-sage/10">
                      <p className="caption-bold text-dune">{review.reviewerName}</p>
                      {review.subject && (
                        <p className="caption text-dune/60 mt-1">{review.subject}</p>
                      )}
                      {review.reviewDate && (
                        <p className="caption text-dune/40 mt-1">
                          {new Date(review.reviewDate).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {reviews.slice(0, Math.min(reviews.length, 5)).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTo({
                      left: index * 432,
                      behavior: 'smooth'
                    })
                  }
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex % 5
                    ? 'w-8 bg-dusty-rose'
                    : 'bg-sage/30 hover:bg-sage/50'
                }`}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}