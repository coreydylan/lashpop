'use client'

import { useRef, useEffect, useState } from 'react'
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

      {/* Left gradient */}
      {showLeftGradient && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-ivory to-transparent z-10 pointer-events-none" />
      )}

      {/* Right gradient */}
      {showRightGradient && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-ivory to-transparent z-10 pointer-events-none" />
      )}

      {/* Tabs container */}
      <div
        ref={scrollRef}
        className="subcategory-tabs-scroll flex gap-2 overflow-x-auto pb-2 px-4 md:px-6"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {allTabs.map((tab) => {
          const isActive = activeSubcategory === tab.slug
          return (
            <motion.button
              key={tab.id}
              onClick={() => onSelect(tab.slug)}
              className={`
                relative px-4 py-2 rounded-full text-sm font-sans font-medium whitespace-nowrap shrink-0
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
