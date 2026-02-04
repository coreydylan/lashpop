'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface Subcategory {
  id: string
  name: string
  slug: string
}

interface SubcategoryTabsProps {
  subcategories: Subcategory[]
  activeSubcategory: string | null
  onSelect: (subcategorySlug: string | null) => void
}

export function SubcategoryTabs({ subcategories, activeSubcategory, onSelect }: SubcategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftGradient, setShowLeftGradient] = useState(false)
  const [showRightGradient, setShowRightGradient] = useState(true)
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
  }, [subcategories])

  // Cleanup scroll interval on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
      }
    }
  }, [])

  // Start scrolling in a direction
  const startScrolling = useCallback((direction: 'left' | 'right') => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
    }

    const container = scrollRef.current
    if (!container) return

    const scrollAmount = direction === 'left' ? -4 : 4

    scrollIntervalRef.current = setInterval(() => {
      container.scrollLeft += scrollAmount
    }, 16) // ~60fps
  }, [])

  // Stop scrolling
  const stopScrolling = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
      scrollIntervalRef.current = null
    }
  }, [])

  if (subcategories.length === 0) {
    return null
  }

  const allTabs = [{ id: 'all', name: 'All', slug: null as string | null }, ...subcategories]

  return (
    <div className="relative -mx-4 md:-mx-6">
      {/* Hide scrollbar CSS */}
      <style jsx>{`
        .subcategory-tabs-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Left gradient with hover scroll zone (desktop only) */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-12 z-10 hidden md:block ${
          showLeftGradient ? 'pointer-events-auto cursor-w-resize' : 'pointer-events-none'
        }`}
        onMouseEnter={() => showLeftGradient && startScrolling('left')}
        onMouseLeave={stopScrolling}
      >
        {showLeftGradient && (
          <div className="absolute inset-0 bg-gradient-to-r from-ivory via-ivory/80 to-transparent" />
        )}
      </div>

      {/* Right gradient with hover scroll zone (desktop only) */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-12 z-10 hidden md:block ${
          showRightGradient ? 'pointer-events-auto cursor-e-resize' : 'pointer-events-none'
        }`}
        onMouseEnter={() => showRightGradient && startScrolling('right')}
        onMouseLeave={stopScrolling}
      >
        {showRightGradient && (
          <div className="absolute inset-0 bg-gradient-to-l from-ivory via-ivory/80 to-transparent" />
        )}
      </div>

      {/* Mobile gradients (non-interactive) */}
      {showLeftGradient && (
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-ivory to-transparent z-10 pointer-events-none md:hidden" />
      )}
      {showRightGradient && (
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-ivory to-transparent z-10 pointer-events-none md:hidden" />
      )}

      {/* Tabs container */}
      <div
        ref={scrollRef}
        className="subcategory-tabs-scroll flex gap-1.5 overflow-x-auto pb-2 px-4 md:px-6"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {allTabs.map((tab, index) => {
          const isActive = activeSubcategory === tab.slug
          return (
            <motion.button
              key={tab.id || `tab-${index}`}
              onClick={() => onSelect(tab.slug)}
              className={`
                relative px-2.5 py-1 rounded-full text-xs font-sans font-medium whitespace-nowrap shrink-0
                transition-colors duration-200
                ${isActive
                  ? 'bg-terracotta text-white'
                  : 'bg-white/60 text-dune hover:bg-white/80 border border-sage/20'}
              `}
              whileTap={{ scale: 0.97 }}
            >
              {tab.name}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
