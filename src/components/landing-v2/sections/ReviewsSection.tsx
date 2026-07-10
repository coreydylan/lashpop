'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion'
import { useCarouselWheelScroll } from '@/hooks/useCarouselWheelScroll'
import { useEdgeHoverScroll } from '@/hooks/useEdgeHoverScroll'
import { ChevronUp } from 'lucide-react'
import { YelpLogo, GoogleLogo, VagaroLogo, YelpLogoCompact, GoogleLogoCompact, VagaroLogoCompact } from '@/components/icons/ReviewLogos'
import { SectionRule } from '../SectionRule'
import { DEFAULT_STUDIO_SETTINGS, type StudioSettings } from '@/types/studio'

function CountUp({ to, inView }: { to: number; inView: boolean }) {
  const mv = useMotionValue(0)
  const rounded = useTransform(mv, (latest) => Math.round(latest).toLocaleString())
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (!inView) return
    const controls = animate(mv, to, { duration: 0.9, ease: [0.22, 1, 0.36, 1] })
    const unsubscribe = rounded.on('change', (v) => setDisplay(v))
    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [inView, to, mv, rounded])

  return <>{display}</>
}

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
  stylistName?: string | null
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
  studio?: StudioSettings
}

export function ReviewsSection({ reviews, reviewStats = [], studio = DEFAULT_STUDIO_SETTINGS }: ReviewsSectionProps) {
  // Review platform URLs sourced from studio settings; fall back to studio
  // defaults if a particular network is unset in admin.
  const reviewPlatformUrls: Record<string, string | undefined> = {
    yelp: studio.social.yelp,
    google: studio.social.google,
    vagaro: studio.social.vagaro ?? studio.vagaroBookingUrl,
  }
  const ref = useRef(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const statsInView = useInView(statsRef, { once: true, margin: '-80px' })
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    skipSnaps: false,
    dragFree: false
  })

  // Hover-based wheel scroll - only captures wheel events when hovering
  const { wheelContainerRef } = useCarouselWheelScroll(emblaApi)
  // Desktop: hovering the left/right edge of the strip crawls it that way.
  const { edgeScrollRef } = useEdgeHoverScroll(emblaApi)
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
      {/*
        Reviews and the Team section above share the same cream (#f0e0db)
        background. Stacking py-20 on both produced 160px of cream between
        the last team card and this heading, but only 80px below the cards
        before the ivory transition — visibly asymmetric. Drop our top
        padding entirely so the team section's pb-20 is the only space
        above the heading; bottom stays py-20-equivalent so it matches.
      */}
      <section ref={ref} id="reviews" className="relative pb-12 md:pb-20 overflow-hidden" style={{ backgroundColor: '#f0e0db' }}>
        <div className="relative">

        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2
            className="text-2xl md:text-5xl font-display font-medium tracking-wide mb-4 md:mb-6"
            style={{ color: '#cc947f' }}
          >
            What People Are Saying
          </h2>
          <SectionRule />
        </div>

        {/* Review Stats Chips - Between Header and Carousel */}
        {reviewStats.length > 0 && (
          <div ref={statsRef}>
            {/* Desktop View */}
            <div className="hidden md:flex justify-center gap-6 mb-8">
              {[...reviewStats].sort((a, b) => {
                const order: Record<string, number> = { google: 0, yelp: 1, vagaro: 2 }
                return (order[a.source.toLowerCase()] ?? 1) - (order[b.source.toLowerCase()] ?? 1)
              }).map((stat, index) => (
                <motion.a
                  key={stat.id || `stat-${index}`}
                  href={reviewPlatformUrls[stat.source.toLowerCase()]}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 8 }}
                  animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                  transition={{ delay: index * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-full px-5 py-2.5 shadow-sm border border-white/40 transition-[transform,box-shadow,background-color] duration-200 hover:scale-105 hover:shadow-lg hover:bg-white/80"
                >
                  <div className="scale-100">
                    {getSourceLogoCompact(stat.source)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-semibold text-dune text-base">{stat.rating}</span>
                    <svg className="w-4 h-4 text-golden" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-dune/60 text-xs tabular-nums">(<CountUp to={stat.reviewCount} inView={statsInView} />)</span>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex justify-center gap-3 mb-6 px-4">
              {[...reviewStats].sort((a, b) => {
                const order: Record<string, number> = { google: 0, yelp: 1, vagaro: 2 }
                return (order[a.source.toLowerCase()] ?? 1) - (order[b.source.toLowerCase()] ?? 1)
              }).map((stat, index) => (
                <motion.a
                  key={stat.id || `stat-${index}`}
                  href={reviewPlatformUrls[stat.source.toLowerCase()]}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 8 }}
                  animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                  transition={{ delay: index * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-white/40 transition-[transform,box-shadow,background-color] duration-200 hover:scale-105 hover:shadow-lg hover:bg-white/80"
                >
                  <div className="scale-90">
                    {getSourceLogoCompact(stat.source)}
                  </div>
                  <span className="font-sans font-semibold text-dune text-sm">{stat.rating}</span>
                  <svg className="w-3 h-3 text-golden" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </motion.a>
              ))}
            </div>
          </div>
        )}

        {/* Full-width Reviews Container with Beautiful Frosted Glass */}
        <div
          ref={(node) => { wheelContainerRef(node); edgeScrollRef(node) }}
          className="relative"
        >
          {/* Instagram-style Snap Carousel */}
          <div
            ref={emblaRef}
            className="review-carousel overflow-visible cursor-grab active:cursor-grabbing"
          >
            <div className="flex touch-pan-x px-4">
              {reviews.map((review, index) => (
                <div
                  key={review.id || `review-${index}`}
                  className="flex-[0_0_auto] mr-5 pl-4 first:pl-0"
                >
                <div
                  className="review-card w-[85vw] md:w-[420px] lg:w-[480px]"
                  onMouseEnter={() => setHoveredCard(review.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="relative">
                    {/* Frosted Glass Card */}
                    <div className="bg-white/50 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-white/60 relative overflow-hidden group h-[420px] md:h-[280px] flex flex-col w-full">
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
                            <h3 className="font-display font-semibold text-charcoal text-base mb-1 truncate">
                              {review.reviewerName}
                            </h3>
                            {review.stylistName && (
                              <p className="text-xs text-soft-terracotta font-sans truncate">
                                with {review.stylistName}
                              </p>
                            )}
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
                          <p className="font-sans font-light text-charcoal leading-relaxed text-[15px]">
                            &quot;{review.reviewText}&quot;
                          </p>
                        </div>

                        {/* Scroll hint for first card on mobile */}
                        {index === 0 && isMobile && !hasScrolledText && review.reviewText.length > 200 && (
                          <div
                            className="absolute bottom-0 left-0 right-0 pointer-events-none"
                            style={{ bottom: 0 }}
                          >
                            {/* Fade gradient - reduced height to avoid blocking scroll */}
                            <div className="h-8 bg-gradient-to-t from-white/70 to-transparent rounded-b-2xl pointer-events-none" />
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
