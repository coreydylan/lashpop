'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'framer-motion'
import { YelpLogo, GoogleLogo, VagaroLogo, YelpLogoCompact, GoogleLogoCompact, VagaroLogoCompact } from '@/components/icons/ReviewLogos'

// Custom CSS for hidden scrollbars
const scrollbarStyles = `
  .review-carousel {
    -ms-overflow-style: none;
    scrollbar-width: none;
    scroll-behavior: smooth;
  }

  .review-carousel::-webkit-scrollbar {
    display: none;
  }

  .review-text-scroll {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .review-text-scroll::-webkit-scrollbar {
    display: none;
  }
`

interface Review {
  id: string
  reviewerName: string
  subject: string | null
  reviewText: string
  rating: number
  reviewDate: Date | null
  source: string
}

interface ReviewStat {
  id: string
  source: string
  rating: string
  reviewCount: number
  updatedAt: Date
}

interface ReviewsSectionProps {
  reviews: Review[]
  reviewStats?: ReviewStat[]
}

export function ReviewsSection({ reviews, reviewStats = [] }: ReviewsSectionProps) {
  const ref = useRef(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-20%" })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  // Auto-rotate reviews - pause when hovering
  useEffect(() => {
    if (reviews.length > 0 && !hoveredCard && !isDragging) {
      const interval = setInterval(() => {
        handleScroll('right')
      }, 7000)
      return () => clearInterval(interval)
    }
  }, [reviews.length, hoveredCard, isDragging])

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const containerWidth = container.offsetWidth
      const scrollAmount = containerWidth * 0.85 // Scroll almost full width

      const targetScroll = direction === 'left'
        ? Math.max(0, container.scrollLeft - scrollAmount)
        : Math.min(container.scrollWidth - containerWidth, container.scrollLeft + scrollAmount)

      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })

      // Update index after scroll
      setTimeout(() => {
        const cards = container.querySelectorAll('.review-card')
        let closestIndex = 0
        let closestDistance = Infinity

        cards.forEach((card, index) => {
          const cardRect = card.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()
          const distance = Math.abs(cardRect.left - containerRect.left)

          if (distance < closestDistance) {
            closestDistance = distance
            closestIndex = index
          }
        })

        setCurrentIndex(closestIndex)
      }, 300)
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

  const getSourceLogo = (source: string) => {
    switch (source.toLowerCase()) {
      case 'yelp':
        return <YelpLogo />
      case 'google':
        return <GoogleLogo />
      case 'vagaro':
        return <VagaroLogo />
      default:
        return null
    }
  }

  const getSourceLogoCompact = (source: string) => {
    switch (source.toLowerCase()) {
      case 'yelp':
        return <YelpLogoCompact />
      case 'google':
        return <GoogleLogoCompact />
      case 'vagaro':
        return <VagaroLogoCompact />
      default:
        return null
    }
  }

  const getSourceLabel = (source: string) => {
      switch (source.toLowerCase()) {
          case 'yelp': return 'Yelp'
          case 'google': return 'Google'
          case 'vagaro': return 'Vagaro'
          default: return source
      }
  }

  if (reviews.length === 0) {
    return null
  }

  return (
    <>
      <style jsx>{scrollbarStyles}</style>
      <section ref={ref} className="relative py-20 overflow-hidden bg-cream">
        <div className="relative">

        {/* Review Platform Stats - Above Cards */}
        {reviewStats && reviewStats.length > 0 && (
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex justify-center gap-2.5 flex-wrap px-4">
              {reviewStats.map((stat, index) => (
                <motion.div
                  key={stat.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: 0.1 + (index * 0.05), ease: [0.23, 1, 0.32, 1] }}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Frosted Glass Badge with Emboss/Deboss Effect */}
                  <div className="relative group cursor-default">
                    {/* Subtle outer glow/shadow */}
                    <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-50 group-hover:opacity-70 transition-opacity" />

                    {/* Main badge */}
                    <div className="relative px-4 py-2.5 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_3px_rgba(0,0,0,0.1)] transition-all duration-300 group-hover:bg-white/60 group-hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.12)]">
                      <div className="flex items-center gap-2.5">
                        {/* Platform Logo - Compact */}
                        <div className="shrink-0 flex items-center pr-2.5">
                          {getSourceLogoCompact(stat.source)}
                        </div>

                        {/* Count */}
                        <span className="font-sans text-sm font-semibold text-dune tracking-tight">
                          {stat.reviewCount.toLocaleString()}
                        </span>

                        {/* Stars */}
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <svg
                                key={i}
                                className={`w-3.5 h-3.5 ${i < parseFloat(stat.rating) ? 'text-golden' : 'text-sage/30'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>

                        {/* "Reviews" text */}
                        <span className="font-sans text-xs text-dune/60 font-medium">Reviews</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Full-width Reviews Container with Beautiful Frosted Glass */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Enhanced Navigation Buttons */}
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 bg-white/30 backdrop-blur-xl rounded-full p-4 shadow-xl hover:bg-white/40 transition-all duration-300 border border-white/50 group hover:scale-110"
            aria-label="Previous review"
          >
            <svg className="w-6 h-6 text-dune group-hover:text-dusty-rose transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => handleScroll('right')}
            className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 bg-white/30 backdrop-blur-xl rounded-full p-4 shadow-xl hover:bg-white/40 transition-all duration-300 border border-white/50 group hover:scale-110"
            aria-label="Next review"
          >
            <svg className="w-6 h-6 text-dune group-hover:text-dusty-rose transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Instagram-style Snap Carousel */}
          <div
            ref={scrollContainerRef}
            className="review-carousel overflow-x-auto cursor-grab active:cursor-grabbing"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="flex gap-5 pb-8 px-4 lg:px-12">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  className="review-card shrink-0 w-[85vw] md:w-[420px] lg:w-[480px]"
                  style={{ scrollSnapAlign: 'start' }}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.05 * (index % 6), ease: [0.23, 1, 0.32, 1] }}
                  onMouseEnter={() => setHoveredCard(review.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <motion.div
                    className="relative"
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  >
                    {/* Frosted Glass Card */}
                    <div className="bg-white/50 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/60 relative overflow-hidden group h-[280px] flex flex-col w-full">
                      {/* Subtle gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-dusty-rose/3 via-transparent to-sage/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Rating with number and source icon - Absolute positioned */}
                      <div className="absolute top-5 right-5 flex items-center gap-2 z-20">
                        <div className="flex items-center gap-2 bg-golden/10 px-3 py-1.5 rounded-full">
                          <span className="font-sans font-bold text-golden text-sm">{review.rating}</span>
                          <svg className="w-4 h-4 text-golden" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        {/* Source Icon */}
                        <div className="scale-90">
                          {getSourceLogo(review.source)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="relative z-10 flex flex-col h-full p-7 pt-9">
                        {/* Header: Name */}
                        <div className="flex items-start gap-4 mb-4 shrink-0 pr-24">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-sans font-semibold text-dune text-base mb-1 truncate">
                              {review.reviewerName}
                            </h3>
                            {review.reviewDate && (
                              <p className="text-xs text-dune/50 font-sans">
                                {new Date(review.reviewDate).toLocaleDateString('en-US', {
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Review Text - Scrollable */}
                        <div className="flex-1 overflow-y-auto review-text-scroll pr-2">
                          <p className="text-dune/85 leading-relaxed text-[15px]">
                            &quot;{review.reviewText}&quot;
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Ultra Minimal Morphing Line Indicator - Commented out as requested */}
          {/* <motion.div
            className="flex justify-center mt-8"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="flex items-center gap-1.5">
              {reviews.slice(0, Math.min(reviews.length, 5)).map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index)
                    if (scrollContainerRef.current) {
                      const firstCard = scrollContainerRef.current.firstChild?.firstChild as HTMLElement
                      const cardWidth = firstCard?.clientWidth || 400
                      const gap = 24
                      scrollContainerRef.current.scrollTo({
                        left: index * (cardWidth + gap),
                        behavior: 'smooth'
                      })
                    }
                  }}
                  className="relative"
                  aria-label={`Go to review ${index + 1}`}
                >
                  <motion.div
                    className="rounded-full"
                    animate={{
                      width: index === currentIndex % 5 ? 24 : 4,
                      height: index === currentIndex % 5 ? 2 : 4,
                      backgroundColor: index === currentIndex % 5
                        ? 'rgb(224, 166, 170)'
                        : 'rgba(177, 162, 150, 0.25)',
                    }}
                    transition={{
                      duration: 0.4,
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                    whileHover={{
                      backgroundColor: index !== currentIndex % 5
                        ? 'rgba(177, 162, 150, 0.4)'
                        : 'rgb(224, 166, 170)'
                    }}
                  />
                </motion.button>
              ))}
            </div>
          </motion.div> */}
        </motion.div>
      </div>
      </section>
    </>
  )
}
