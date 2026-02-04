'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { ServiceCategory } from '../ServiceBrowserContext'

// Display names matching the main services section titles
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'lashes': 'Lashes',
  'brows': 'Brows',
  'facials': 'Skincare',
  'waxing': 'Waxing',
  'permanent-makeup': 'Permanent Makeup',
  'specialty': 'Permanent Jewelry',
  'injectables': 'Botox',
}

// Order matching the main services section (excluding lash-lifts which opens lashes with subcategory)
const CATEGORY_ORDER: string[] = [
  'lashes',
  'brows',
  'facials',
  'waxing',
  'permanent-makeup',
  'specialty',
  'injectables',
]

interface CategoryTabsProps {
  categories: ServiceCategory[]
  activeCategory: string | null
  onSelect: (categorySlug: string) => void
}

export function CategoryTabs({ categories, activeCategory, onSelect }: CategoryTabsProps) {
  // Sort categories to match the order on the main services section
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const aIndex = CATEGORY_ORDER.indexOf(a.slug)
      const bIndex = CATEGORY_ORDER.indexOf(b.slug)
      // If not in order array, put at end
      const aOrder = aIndex === -1 ? 999 : aIndex
      const bOrder = bIndex === -1 ? 999 : bIndex
      return aOrder - bOrder
    })
  }, [categories])
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftGradient, setShowLeftGradient] = useState(false)
  const [showRightGradient, setShowRightGradient] = useState(false)

  // Check scroll position to show/hide gradients
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container
      setShowLeftGradient(scrollLeft > 10)
      setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 10)
    }

    checkScroll()
    container.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    return () => {
      container.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [sortedCategories])

  // Scroll active tab into view when it changes
  useEffect(() => {
    if (!activeCategory || !scrollRef.current) return

    const container = scrollRef.current
    const activeTab = container.querySelector(`[data-category="${activeCategory}"]`) as HTMLElement
    if (activeTab) {
      const containerRect = container.getBoundingClientRect()
      const tabRect = activeTab.getBoundingClientRect()

      // Check if tab is outside visible area
      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [activeCategory])

  if (sortedCategories.length <= 1) {
    return null
  }

  return (
    <div className="relative">
      {/* Hide scrollbar CSS */}
      <style jsx>{`
        .category-tabs-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Left gradient */}
      {showLeftGradient && (
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-ivory to-transparent z-10 pointer-events-none" />
      )}

      {/* Right gradient */}
      {showRightGradient && (
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-ivory to-transparent z-10 pointer-events-none" />
      )}

      {/* Tabs container */}
      <div
        ref={scrollRef}
        className="category-tabs-scroll flex gap-1 overflow-x-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {sortedCategories.map((category) => {
          const isActive = activeCategory === category.slug
          // Use display name if available, otherwise fall back to database name
          const displayName = CATEGORY_DISPLAY_NAMES[category.slug] || category.name
          return (
            <motion.button
              key={category.id}
              data-category={category.slug}
              onClick={() => onSelect(category.slug)}
              className={`
                relative px-4 py-2.5 text-sm font-sans font-medium whitespace-nowrap shrink-0
                transition-all duration-200 border-b-2
                ${isActive
                  ? 'text-charcoal border-terracotta'
                  : 'text-dune/70 border-transparent hover:text-charcoal hover:border-sage/30'}
              `}
              whileTap={{ scale: 0.98 }}
            >
              {displayName}
            </motion.button>
          )
        })}
      </div>

    </div>
  )
}
