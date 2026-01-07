'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { useCarouselWheelScroll } from '@/hooks/useCarouselWheelScroll'
import { ChevronUp } from 'lucide-react'
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
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    skipSnaps: false,
    dragFree: false
  })

  // Hover-based wheel scroll - only captures wheel events when hovering
  const { wheelContainerRef } = useCarouselWheelScroll(emblaApi)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hasScrolledText, setHasScrolledText] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const onSelect = useCallback((api: any) => {
    setCurrentIndex(api.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)

    // Track dragging for auto-rotate pause
    const onPointerDown = () => {
      setIsDragging(true)
    }
    const onPointerUp = () => {
      setIsDragging(false)
    }

    emblaApi.on('pointerDown', onPointerDown)
    emblaApi.on('pointerUp', onPointerUp)

    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
      emblaApi.off('pointerDown', onPointerDown)
      emblaApi.off('pointerUp', onPointerUp)
    }
  }, [emblaApi, onSelect])

  // Auto-rotate reviews - pause when hovering or dragging
  useEffect(() => {
    if (reviews.length > 0 && !hoveredCard && !isDragging && emblaApi) {
      const interval = setInterval(() => {
        if (emblaApi.canScrollNext()) {
            emblaApi.scrollNext()
        } else {
            emblaApi.scrollTo(0)
        }
      }, 7000)
      return () => clearInterval(interval)
    }
  }, [reviews.length, hoveredCard, isDragging, emblaApi])


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
      <section ref={ref} className="relative py-20 overflow-hidden bg-ivory">
        <div className="relative">

        {/* Review Platform Stats - Above Cards */}
        {reviewStats && reviewStats.length > 0 && (
          <div className="mb-6 md:mb-8">
            {/* Desktop View */}
            <div className="hidden md:flex justify-center gap-2.5 flex-wrap px-4">
              {reviewStats.map((stat) => (
                <div key={stat.id}>
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
                </div>
              ))}
            </div>

            {/* Mobile View - Interactive Chip */}
            <div className="flex md:hidden justify-center px-4 overflow-hidden relative min-h-[50px]">
              {!isMobileExpanded ? (
                <div
                  onClick={() => setIsMobileExpanded(true)}
                  className="cursor-pointer"
                >
                  <div className="relative group">
                    {/* Subtle outer glow/shadow */}
                    <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-50 group-hover:opacity-70 transition-opacity" />

                    {/* Main badge */}
                  <div className="relative px-4 py-2.5 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_3px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-3">
                      {/* Platform Logos - Side by side */}
                      <div className="flex items-center gap-2">
                         <div className="w-5 h-5 flex items-center justify-center">
                           <GoogleLogoCompact />
                         </div>
                         <div className="w-5 h-5 flex items-center justify-center">
                           <YelpLogoCompact />
                         </div>
                         <div className="w-5 h-5 flex items-center justify-center">
                           <VagaroLogoCompact />
                         </div>
                      </div>

                      <div className="h-4 w-[1px] bg-dune/10" />

                      {/* Total Count and Stars */}
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-sm font-semibold text-dune tracking-tight">
                            {reviewStats.reduce((sum, stat) => sum + stat.reviewCount, 0).toLocaleString()}
                          </span>

                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                  key={i}
                                  className="w-3.5 h-3.5 text-golden"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full overflow-x-auto no-scrollbar touch-pan-x px-4">
                  <div className="flex gap-3 min-w-max pb-2 mx-auto justify-center">
                    {reviewStats.map((stat) => (
                      <div key={stat.id} className="relative group shrink-0">
                        {/* Main badge */}
                        <div
                          className="relative px-3 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white/60 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {/* Platform Logo */}
                            <div className="shrink-0 flex items-center">
                              {getSourceLogoCompact(stat.source)}
                            </div>
                            {/* Count */}
                            <span className="font-sans text-sm font-semibold text-dune">
                              {stat.reviewCount}
                            </span>
                            {/* Stars */}
                            <div className="flex gap-0.5">
                              <svg className="w-3 h-3 text-golden" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Close button for expanded view */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMobileExpanded(false);
                      }}
                      className="w-8 h-8 rounded-full bg-white/40 backdrop-blur-md border border-white/50 flex items-center justify-center text-dune/60"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Full-width Reviews Container with Beautiful Frosted Glass */}
        <div
          ref={wheelContainerRef}
          className="relative"
        >
          {/* Instagram-style Snap Carousel */}
          <div
            ref={emblaRef}
            className="review-carousel overflow-visible cursor-grab active:cursor-grabbing"
          >
            <div className="flex touch-pan-x pt-4 pb-16 md:py-10 px-4">
              {reviews.map((review, index) => (
                <div
                  key={review.id}
                  className="flex-[0_0_auto] mr-5 pl-4 first:pl-0"
                >
                <div
                  className="review-card w-[85vw] md:w-[420px] lg:w-[480px]"
                  onMouseEnter={() => setHoveredCard(review.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="relative">
                    {/* Frosted Glass Card */}
                    <div className="bg-white/50 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/60 relative overflow-hidden group h-[420px] md:h-[280px] flex flex-col w-full">
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
                        <div
                          className="flex-1 overflow-y-auto review-text-scroll pr-2 relative"
                          onScroll={(e) => {
                            if (index === 0 && !hasScrolledText && (e.target as HTMLElement).scrollTop > 10) {
                              setHasScrolledText(true)
                            }
                          }}
                        >
                          <p className="text-dune/85 leading-relaxed text-[15px]">
                            &quot;{review.reviewText}&quot;
                          </p>
                        </div>

                        {/* Scroll hint for first card on mobile */}
                        {index === 0 && isMobile && !hasScrolledText && review.reviewText.length > 200 && (
                          <div
                            className="absolute bottom-0 left-0 right-0 pointer-events-none"
                            style={{ bottom: 0 }}
                          >
                            {/* Fade gradient */}
                            <div className="h-16 bg-gradient-to-t from-white/80 via-white/40 to-transparent rounded-b-2xl" />
                            {/* Scroll up hint */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                              <div className="bg-dune/10 backdrop-blur-sm rounded-full p-1.5">
                                <ChevronUp className="w-3.5 h-3.5 text-dune/40" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </section>
    </>
  )
}
