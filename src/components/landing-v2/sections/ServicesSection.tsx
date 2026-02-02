'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useServiceBrowser } from '@/components/service-browser'

// Service category type for data from database
export interface ServiceCategory {
  id: string
  slug: string
  title: string
  tagline: string
  description: string
  icon: string
}

// Default service category data - used as fallback if database fetch fails
// These are updated to match the latest content requirements
export const defaultServiceCategories: ServiceCategory[] = [
  {
    id: 'lashes',
    slug: 'lashes',
    title: 'LASHES',
    tagline: 'Wake up ready.',
    description: 'From soft and natural to full and fluffy, every lash look is personalized to your eye shape, natural lashes and your preferences, so getting ready feels like a breeze (and way more fun). Choose from any style of lash extensions or a lash lift + tint.',
    icon: '/lashpop-images/services/thin/lashes-icon.svg',
  },
  {
    id: 'brows',
    slug: 'brows',
    title: 'BROWS',
    tagline: 'Frame your face.',
    description: 'Customized brow services that shape, define and enhance what you already have. Each service tailored so you leave looking refreshed and effortlessly put together. Choose from brow laminations, waxing, tinting, micro blading and nano-brows.',
    icon: '/lashpop-images/services/thin/brows-icon.svg',
  },
  {
    id: 'facials',
    slug: 'facials',
    title: 'SKINCARE',
    tagline: 'Glow-y and fresh.',
    description: 'Personalized skincare treatments designed to support your skin, restore your glow, and leave you feeling refreshed and radiant. Choose from basic facials, hydra facials, derma planing, fibroblast, jet plasma and more.',
    icon: '/lashpop-images/services/thin/skincare-icon.svg',
  },
  {
    id: 'waxing',
    slug: 'waxing',
    title: 'WAXING',
    tagline: 'Smooth + effortless.',
    description: 'Low maintenance waxing services that keep your skin smooth and your routine effortless.',
    icon: '/lashpop-images/services/thin/waxing-icon.svg',
  },
  {
    id: 'permanent-makeup',
    slug: 'permanent-makeup',
    title: 'PERMANENT MAKEUP',
    tagline: 'High impact, low maintenance.',
    description: 'Natural looking results that streamline your routine and elevate your look without feeling overdone. Choose from micro blading and nano-brow services, lip blushing, and faux freckles/beauty marks.',
    icon: '/lashpop-images/services/thin/permanent-makeup-icon.svg',
  },
  {
    id: 'specialty',
    slug: 'specialty',
    title: 'PERMANENT JEWELRY',
    tagline: 'No clasps. No fuss.',
    description: 'Custom, minimal chains welded in place so that you never have to think about it. A personal keepsake you\'ll wear every day, whether you\'re diving into the ocean, traveling, or simply going about your life.',
    icon: '/lashpop-images/services/thin/permanent-jewelry-icon.svg',
  },
  {
    id: 'injectables',
    slug: 'injectables',
    title: 'BOTOX',
    tagline: 'The subtle glow up.',
    description: 'Natural looking results that keep your face looking smooth, relaxed, effortlessly refreshed + still you.',
    icon: '/lashpop-images/services/thin/injectables-icon.svg',
  },
]

// Service Card Component for Desktop
function ServiceCard({
  category,
  onClick,
}: {
  category: ServiceCategory
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group text-center p-6 rounded-2xl transition-all duration-300 hover:bg-white/40 hover:shadow-md hover:scale-[1.02] hover:-translate-y-1"
    >
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className="relative w-24 h-12">
          <Image
            src={category.icon}
            alt={category.title}
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Title */}
      <h3
        className="text-lg font-display font-semibold tracking-[0.15em] mb-3"
        style={{ color: 'rgb(204, 148, 127)' }}
      >
        {category.title}
      </h3>

      {/* Tagline */}
      <p
        className="text-sm font-sans font-semibold uppercase tracking-wide mb-3"
        style={{ color: '#cc947f' }}
      >
        {category.tagline}
      </p>

      {/* Description */}
      <p
        className="text-sm font-sans font-light leading-relaxed italic"
        style={{ color: '#3d3632' }}
      >
        {category.description}
      </p>
    </button>
  )
}

// Mobile Swipeable Cards Component
function MobileSwipeableServiceCards({
  categories,
  onCategoryClick,
}: {
  categories: ServiceCategory[]
  onCategoryClick: (slug: string) => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const isHorizontalSwipe = useRef<boolean | null>(null)
  const currentIndexRef = useRef(currentIndex)

  // Keep ref in sync with state for use in event handlers
  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  const swipeThreshold = 40

  // Use native event listeners with passive: false to allow preventDefault
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      isHorizontalSwipe.current = null
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return

      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      const deltaX = Math.abs(currentX - touchStartX.current)
      const deltaY = Math.abs(currentY - touchStartY.current)

      // Determine swipe direction on first significant movement
      if (isHorizontalSwipe.current === null && (deltaX > 8 || deltaY > 8)) {
        // More lenient horizontal detection - 1.2x ratio instead of equal
        isHorizontalSwipe.current = deltaX > deltaY * 0.8
      }

      // If it's a horizontal swipe, prevent vertical scroll
      if (isHorizontalSwipe.current === true) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return

      const touchEndX = e.changedTouches[0].clientX
      const diff = touchStartX.current - touchEndX

      // Only process if this was determined to be a horizontal swipe
      if (isHorizontalSwipe.current === true && Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          // Swiped left - next card
          setCurrentIndex((prev) => (prev + 1) % categories.length)
        } else {
          // Swiped right - previous card
          setCurrentIndex((prev) => prev === 0 ? categories.length - 1 : prev - 1)
        }
      }

      touchStartX.current = null
      touchStartY.current = null
      isHorizontalSwipe.current = null
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [categories.length])

  const currentCategory = categories[currentIndex]

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center w-full"
      style={{ touchAction: 'pan-y pinch-zoom' }}
    >
      {/* Card container - wider */}
      <div className="w-full">
        <div
          className="rounded-2xl bg-white/40 border border-warm-sand/30 shadow-sm overflow-hidden h-[340px] flex flex-col"
        >
          {/* Top content */}
          <div className="flex flex-col items-center text-center px-6 py-6 flex-1">
            {/* Icon */}
            <div className="relative w-20 h-10 mb-4">
              <Image
                src={currentCategory.icon}
                alt={currentCategory.title}
                fill
                className="object-contain"
              />
            </div>

            {/* Title */}
            <h3
              className="text-base font-display font-semibold tracking-[0.15em] mb-2"
              style={{ color: 'rgb(204, 148, 127)' }}
            >
              {currentCategory.title}
            </h3>

            {/* Tagline */}
            <p
              className="text-xs font-sans font-semibold uppercase tracking-wide mb-3"
              style={{ color: '#cc947f' }}
            >
              {currentCategory.tagline}
            </p>

            {/* Description */}
            <p
              className="text-sm font-sans font-light leading-relaxed italic"
              style={{ color: '#3d3632' }}
            >
              {currentCategory.description}
            </p>
          </div>

          {/* Bottom button area - full width, pinned to bottom */}
          <button
            onClick={() => onCategoryClick(currentCategory.slug)}
            className="w-full py-3 border-t border-warm-sand/40 bg-white/30 transition-all duration-300 active:bg-white/50 mt-auto flex items-center justify-center"
          >
            <span
              className="text-[10px] font-sans font-medium tracking-[0.1em] uppercase"
              style={{ color: '#ac4d3c' }}
            >
              Explore {currentCategory.title.toLowerCase() === 'skincare' ? 'Skincare' : currentCategory.title.charAt(0) + currentCategory.title.slice(1).toLowerCase()} Services
            </span>
          </button>
        </div>
      </div>

      {/* Progress indicator - all dots visible */}
      <div className="flex justify-center gap-2 mt-8">
        {categories.map((_, index) => (
          <div
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              index === currentIndex
                ? 'bg-terracotta w-5'
                : 'bg-terracotta/40 w-1.5'
            }`}
          />
        ))}
      </div>

      {/* Swipe to explore with arrows on sides */}
      <div className="flex items-center justify-center gap-4 mt-4">
        {/* Left arrow */}
        <motion.button
          onClick={() => setCurrentIndex((prev) => prev === 0 ? categories.length - 1 : prev - 1)}
          className="w-8 h-8 rounded-full border border-terracotta/30 bg-white/60 flex items-center justify-center"
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <ChevronLeft className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
        </motion.button>

        <p
          className="text-[10px] font-sans font-light tracking-[0.1em] uppercase"
          style={{ color: '#cc947f' }}
        >
          swipe to explore
        </p>

        {/* Right arrow */}
        <motion.button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % categories.length)}
          className="w-8 h-8 rounded-full border border-terracotta/30 bg-white/60 flex items-center justify-center"
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <ChevronRight className="w-4 h-4 text-terracotta" strokeWidth={1.5} />
        </motion.button>
      </div>
    </div>
  )
}

interface ServicesSectionProps {
  isMobile?: boolean
  categories?: ServiceCategory[]
}

export function ServicesSection({ isMobile: propIsMobile, categories: propCategories }: ServicesSectionProps) {
  const [stateIsMobile, setIsMobile] = useState(false)
  const { actions: browserActions } = useServiceBrowser()

  const isMobile = propIsMobile ?? stateIsMobile

  // Use prop categories if provided, otherwise use defaults
  const serviceCategories = propCategories || defaultServiceCategories

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle category click - open the service browser modal for that category
  const handleCategoryClick = useCallback((categorySlug: string) => {
    const category = serviceCategories.find(c => c.slug === categorySlug)
    if (category) {
      browserActions.openModal(categorySlug, category.title)
    }
  }, [browserActions, serviceCategories])

  // Handle Book Now button click - open with first category
  const handleBookNowClick = useCallback(() => {
    browserActions.openModal('lashes', 'Lashes')
  }, [browserActions])

  // Mobile Layout
  if (isMobile) {
    return (
      <section
        id="services"
        className="relative w-full py-12 px-6 bg-ivory"
        data-section-id="services"
      >
        {/* Section Header */}
        <div className="text-center mb-6">
          <h2
            className="text-2xl font-display font-medium tracking-wide mb-4"
            style={{ color: 'rgb(204, 148, 127)' }}
          >
            Choose a Service
          </h2>
          <div className="w-24 h-px bg-terracotta/30 mx-auto" />
        </div>

        {/* Swipeable Cards */}
        <MobileSwipeableServiceCards categories={serviceCategories} onCategoryClick={handleCategoryClick} />
      </section>
    )
  }

  // Desktop Layout - 3 columns
  return (
    <section
      id="services"
      className="relative w-full py-20 px-8 bg-ivory"
      data-section-id="services"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2
            className="text-5xl font-display font-medium tracking-wide mb-6"
            style={{ color: 'rgb(204, 148, 127)' }}
          >
            Choose a Service
          </h2>
          <div className="w-24 h-px bg-terracotta/30 mx-auto" />
        </div>

        {/* Services Grid - 4 on top, 3 centered on bottom */}
        <div className="space-y-8">
          {/* Top row - 4 items */}
          <div className="grid grid-cols-4 gap-6">
            {serviceCategories.slice(0, 4).map((category, index) => (
              <ServiceCard
                key={category.id || `cat-${index}`}
                category={category}
                onClick={() => handleCategoryClick(category.slug)}
              />
            ))}
          </div>
          {/* Bottom row - 3 items centered */}
          <div className="flex justify-center gap-6">
            {serviceCategories.slice(4).map((category, index) => (
              <div key={category.id || `cat-bottom-${index}`} className="w-[calc(25%-1.125rem)]">
                <ServiceCard
                  category={category}
                  onClick={() => handleCategoryClick(category.slug)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Book Now Button - Below services */}
        <div className="text-center mt-14">
          <button
            onClick={handleBookNowClick}
            className="px-10 py-3.5 rounded-full border-2 transition-all duration-300 hover:bg-[#ac4d3c] hover:text-white"
            style={{
              borderColor: '#ac4d3c',
              color: '#ac4d3c',
            }}
          >
            <span className="text-sm font-sans font-medium tracking-[0.15em] uppercase">
              Book an Appointment
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}
