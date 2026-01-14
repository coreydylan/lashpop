'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useServiceBrowser } from '@/components/service-browser'

// Service category data - focused on "how" (what makes them special) vs "what"
const serviceCategories = [
  {
    id: 'lashes',
    slug: 'lashes',
    title: 'LASHES',
    tagline: 'Wake up ready.',
    description: 'From subtle enhancements to full-on glamour, our lash artists customize every set to complement your eye shape and lifestyle. No two sets are the same—because no two people are.',
    icon: '/lashpop-images/services/lashes-icon.svg',
  },
  {
    id: 'brows',
    slug: 'brows',
    title: 'BROWS',
    tagline: 'Frame your face.',
    description: 'Whether it\'s shaping, laminating, or microblading, we take time to understand your face structure and style. The result? Brows that look effortlessly you.',
    icon: '/lashpop-images/services/brows-icon.svg',
  },
  {
    id: 'facials',
    slug: 'facials',
    title: 'SKINCARE',
    tagline: 'Glow from within.',
    description: 'Our estheticians don\'t just follow a script—they analyze your skin and create a treatment that addresses what it actually needs. Real results, not just relaxation.',
    icon: '/lashpop-images/services/skincare-icon.svg',
  },
  {
    id: 'waxing',
    slug: 'waxing',
    title: 'WAXING',
    tagline: 'Smooth confidence.',
    description: 'Quick, precise, and surprisingly comfortable. Our technique minimizes irritation and maximizes smooth—so you can get on with your day feeling fresh.',
    icon: '/lashpop-images/services/waxing-icon.svg',
  },
  {
    id: 'permanent-makeup',
    slug: 'permanent-makeup',
    title: 'PERMANENT MAKEUP',
    tagline: 'Effortless beauty.',
    description: 'Wake up with perfectly defined features. From brows to lips, our artists create natural-looking enhancements that simplify your routine and boost your confidence.',
    icon: '/lashpop-images/services/permanent-makeup-icon.svg',
  },
  {
    id: 'specialty',
    slug: 'specialty',
    title: 'PERMANENT JEWELRY',
    tagline: 'Meaningful moments.',
    description: 'A delicate chain, welded on forever. It\'s become our favorite way to celebrate friendships, milestones, or just treating yourself to something beautiful.',
    icon: '/lashpop-images/services/permanent-jewelry-icon.svg',
  },
  {
    id: 'injectables',
    slug: 'injectables',
    title: 'BOTOX',
    tagline: 'Subtle refinement.',
    description: 'Expert-administered Botox, fillers, and aesthetic injectables. Our licensed professionals deliver natural results that enhance your features while maintaining your unique look.',
    icon: '/lashpop-images/services/injectables-icon.svg',
  },
]

// Service Card Component for Desktop
function ServiceCard({
  category,
  onClick,
}: {
  category: typeof serviceCategories[0]
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group text-center p-6 rounded-2xl transition-all duration-300 hover:bg-white/30"
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
        className="text-sm font-display font-medium tracking-[0.15em] mb-3"
        style={{ color: '#ac4d3c' }}
      >
        {category.title}
      </h3>

      {/* Tagline */}
      <p
        className="text-base font-sans font-normal italic mb-3"
        style={{ color: '#cc947f' }}
      >
        {category.tagline}
      </p>

      {/* Description */}
      <p
        className="text-sm font-sans font-light leading-relaxed"
        style={{ color: '#3d3632' }}
      >
        {category.description}
      </p>
    </button>
  )
}

// Mobile Swipeable Cards Component
function MobileSwipeableServiceCards({
  onCategoryClick,
}: {
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
          setCurrentIndex((prev) => (prev + 1) % serviceCategories.length)
        } else {
          // Swiped right - previous card
          setCurrentIndex((prev) => prev === 0 ? serviceCategories.length - 1 : prev - 1)
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
  }, [])

  const currentCategory = serviceCategories[currentIndex]

  return (
    <div className="flex flex-col items-center w-full">
      {/* Card with arrows on outside */}
      <div className="relative w-full flex items-center justify-center">
        {/* Left arrow - outside card */}
        <motion.div
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
          animate={{
            opacity: [0.2, 0.45, 0.2],
            x: [0, -2, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <ChevronLeft className="w-5 h-5 text-terracotta" strokeWidth={1.5} />
        </motion.div>

        {/* Right arrow - outside card */}
        <motion.div
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
          animate={{
            opacity: [0.2, 0.45, 0.2],
            x: [0, 2, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <ChevronRight className="w-5 h-5 text-terracotta" strokeWidth={1.5} />
        </motion.div>

        {/* Card container */}
        <div
          ref={containerRef}
          className="w-full max-w-[280px]"
          style={{ touchAction: 'pan-y pinch-zoom' }}
        >
          {/* Subtle card container */}
          <div
            className="cursor-pointer rounded-2xl bg-white/40 border border-warm-sand/30 shadow-sm"
            onClick={() => onCategoryClick(currentCategory.slug)}
          >
            <div className="flex flex-col items-center justify-center text-center px-6 py-6">
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
                className="text-xs font-display font-medium tracking-[0.15em] mb-2"
                style={{ color: '#ac4d3c' }}
              >
                {currentCategory.title}
              </h3>

              {/* Tagline */}
              <p
                className="text-sm font-sans font-normal italic mb-3"
                style={{ color: '#cc947f' }}
              >
                {currentCategory.tagline}
              </p>

              {/* Description */}
              <p
                className="text-xs font-sans font-light leading-relaxed mb-4"
                style={{ color: '#3d3632' }}
              >
                {currentCategory.description}
              </p>

              {/* Explore button */}
              <button
                className="px-5 py-2 rounded-full border transition-all duration-300 active:scale-[0.98]"
                style={{
                  borderColor: 'rgba(172, 77, 60, 0.4)',
                  color: '#ac4d3c',
                }}
              >
                <span className="text-[10px] font-sans font-medium tracking-[0.1em] uppercase">
                  Explore {currentCategory.title.toLowerCase() === 'skincare' ? 'Skincare' : currentCategory.title.charAt(0) + currentCategory.title.slice(1).toLowerCase()} Services
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress indicator - exact match to FindYourLook quiz */}
      <div className="flex justify-center gap-2 mt-5">
        {serviceCategories.map((_, index) => (
          <div
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              index === currentIndex
                ? 'bg-terracotta w-5'
                : index < currentIndex
                ? 'bg-terracotta/40 w-1.5'
                : 'bg-cream w-1.5'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

interface ServicesSectionProps {
  isMobile?: boolean
}

export function ServicesSection({ isMobile: propIsMobile }: ServicesSectionProps) {
  const [stateIsMobile, setIsMobile] = useState(false)
  const { actions: browserActions } = useServiceBrowser()

  const isMobile = propIsMobile ?? stateIsMobile

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
  }, [browserActions])

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
            className="text-xl font-display font-medium tracking-wide mb-4"
            style={{ color: '#ac4d3c' }}
          >
            Choose a Service
          </h2>
          <div className="w-16 h-px bg-terracotta/30 mx-auto" />
        </div>

        {/* Swipeable Cards */}
        <MobileSwipeableServiceCards onCategoryClick={handleCategoryClick} />
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
            className="text-3xl font-display font-medium tracking-wide mb-6"
            style={{ color: '#ac4d3c' }}
          >
            Choose a Service
          </h2>
          <div className="w-16 h-px bg-terracotta/30 mx-auto" />
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
