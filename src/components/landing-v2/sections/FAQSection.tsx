'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'framer-motion'

interface FAQCategory {
  id: string
  name: string
  displayName: string
  displayOrder: number
}

interface FAQItem {
  id: string
  categoryId: string
  question: string
  answer: string
  displayOrder: number
  isFeatured: boolean
}

interface FAQWithCategory extends FAQItem {
  categoryDisplayName: string
}

interface FAQSectionProps {
  categories: FAQCategory[]
  itemsByCategory: Record<string, FAQItem[]>
  featuredItems: FAQWithCategory[]
}

export function FAQSection({ categories, itemsByCategory, featuredItems }: FAQSectionProps) {
  const ref = useRef(null)
  const sectionRef = useRef<HTMLElement>(null)
  const faqListRef = useRef<HTMLDivElement>(null)
  const stickyHeaderRef = useRef<HTMLDivElement>(null)
  const hasSnappedOnEntryRef = useRef(false)
  const isInView = useInView(ref, { once: true, margin: "-10%" })
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('top-faqs')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Entry snap: when FAQ section enters viewport, snap ONCE to dock sticky header
  // After this snap, user can freely scroll through FAQ cards
  useEffect(() => {
    if (!isMobile || !sectionRef.current) return

    const section = sectionRef.current
    const container = document.querySelector('.mobile-scroll-container') as HTMLElement
    if (!container) return

    // Get mobile header height from CSS variable
    const mobileHeaderHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--mobile-header-height') || '44'
    )

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Snap when entering viewport and haven't snapped yet
          if (entry.isIntersecting && !hasSnappedOnEntryRef.current) {
            const rect = section.getBoundingClientRect()
            // Only snap if section top is near viewport top (scrolling down into section)
            if (rect.top > -100 && rect.top < 200) {
              hasSnappedOnEntryRef.current = true

              // Calculate snap position: dock sticky header below mobile header
              const stickyHeight = stickyHeaderRef.current?.offsetHeight || 52
              const buffer = 8

              // Position FAQ list top right below both headers
              if (faqListRef.current) {
                const faqListRect = faqListRef.current.getBoundingClientRect()
                const targetFaqListTop = mobileHeaderHeight + stickyHeight + buffer
                const scrollAdjustment = faqListRect.top - targetFaqListTop
                const targetScrollY = container.scrollTop + scrollAdjustment

                container.scrollTo({ top: targetScrollY, behavior: 'smooth' })
              }
            }
          }

          // Reset flag when section leaves viewport (allows snap on re-entry)
          if (!entry.isIntersecting) {
            hasSnappedOnEntryRef.current = false
          }
        })
      },
      {
        root: container,
        threshold: [0, 0.1],
        rootMargin: `-${mobileHeaderHeight}px 0px 0px 0px` // Account for mobile header
      }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [isMobile])

  // Scroll to align first FAQ card with bottom of sticky header when category changes
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId)
    setExpandedIndex(null) // Close any expanded FAQ

    // On mobile, scroll to position first card below sticky header
    if (isMobile && faqListRef.current) {
      setTimeout(() => {
        const mobileHeaderHeight = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--mobile-header-height') || '44'
        )
        const stickyChipsHeight = stickyHeaderRef.current?.offsetHeight || 60
        const totalOffset = mobileHeaderHeight + stickyChipsHeight + 8

        const faqListRect = faqListRef.current!.getBoundingClientRect()
        const container = document.querySelector('.mobile-scroll-container')
        if (container) {
          const currentScrollTop = container.scrollTop
          const targetScrollY = currentScrollTop + faqListRect.top - totalOffset
          container.scrollTo({ top: targetScrollY, behavior: 'smooth' })
        }
      }, 50) // Small delay to let DOM update after category change
    }
  }

  const toggleFAQ = (id: string) => {
    setExpandedIndex(expandedIndex === id ? null : id)
  }

  // Get FAQs to display based on active category
  const getFilteredFAQs = (): Array<{ id: string; question: string; answer: string; category: string }> => {
    if (activeCategory === 'top-faqs') {
      return featuredItems.map(item => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
        category: item.categoryDisplayName
      }))
    }

    if (activeCategory === 'all') {
      return categories.flatMap(category => 
        (itemsByCategory[category.id] || []).map(item => ({
          id: item.id,
          question: item.question,
          answer: item.answer,
          category: category.displayName
        }))
      )
    }

    // Specific category
    const category = categories.find(c => c.id === activeCategory)
    if (!category) return []

    return (itemsByCategory[activeCategory] || []).map(item => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
      category: category.displayName
    }))
  }

  const filteredFAQs = getFilteredFAQs()

  // Build category options for the filter
  const categoryOptions = [
    { id: 'top-faqs', label: 'Top FAQs' },
    { id: 'all', label: 'All FAQs' },
    ...categories.map(c => ({ id: c.id, label: c.displayName }))
  ]

  // If no data, show a message
  if (categories.length === 0 && featuredItems.length === 0) {
    return null
  }

  return (
    <section
      ref={(el) => {
        (ref as React.MutableRefObject<HTMLElement | null>).current = el
        sectionRef.current = el
      }}
      className="pt-8 pb-20 bg-cream"
    >
      <div className="container max-w-4xl">
        {/* Category Sorter - Compact Frosted Glass Chips */}
        {/* On mobile: sticky at top-[44px] with gradient fade at bottom */}
        <motion.div
          ref={stickyHeaderRef}
          className="mb-4 md:mb-12 sticky md:static top-[44px] z-40 md:top-0 md:bg-transparent md:backdrop-blur-none md:pt-0 md:pb-0 md:mt-0"
          style={isMobile ? {
            background: 'linear-gradient(180deg, rgba(250, 247, 244, 0.98) 0%, rgba(250, 247, 244, 0.95) 60%, rgba(250, 247, 244, 0) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            paddingTop: '16px',
            paddingBottom: '24px',
            marginTop: '-4px',
            willChange: 'transform',
            transform: 'translateZ(0)',
          } : undefined}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          {/* Scrollable container for mobile - py for shadow room */}
          <div className="overflow-x-auto py-2 -my-2 -mx-4 px-4 md:mx-0 md:px-0 md:py-0 md:my-0 md:overflow-visible scrollbar-hide [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden relative">
            <motion.div
              className="flex flex-nowrap md:flex-wrap justify-start md:justify-center gap-2 md:gap-3 min-w-max md:min-w-0"
              initial={{ x: 0 }}
              animate={{
                x: isMobile && isInView ? [0, -10, 0] : 0
              }}
              transition={{
                x: {
                  delay: 1.2,
                  duration: 0.6,
                  ease: "easeInOut",
                  times: [0, 0.5, 1],
                  repeat: 0
                }
              }}>
              {categoryOptions.map((category, index) => (
                <motion.button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className="relative group shrink-0 focus:outline-none focus-visible:outline-none"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Active/Hover State Background */}
                  <div className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
                    activeCategory === category.id
                      ? 'bg-dusty-rose shadow-md'
                      : 'bg-white/50 hover:bg-white/80'
                  }`} />

                  {/* Content - Compact sizing for mobile */}
                  <div className={`relative px-3 py-1.5 md:px-4 md:py-2 rounded-full border ${
                    activeCategory === category.id
                      ? 'border-transparent text-white'
                      : 'border-white/60 text-dune hover:border-dusty-rose/30 transition-colors duration-300'
                  }`}>
                    <span className="text-xs md:text-sm font-medium whitespace-nowrap">
                      {category.label}
                    </span>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* FAQ Items */}
        <div
          ref={faqListRef}
          className="space-y-3 md:space-y-4"
        >
          <AnimatePresence mode="sync">
            {filteredFAQs.map((faq) => (
              <motion.div
                key={faq.id}
                className="bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-sage/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-4 py-3.5 md:px-6 md:py-5 text-left flex items-center justify-between group"
                >
                  <div className="flex flex-col items-start gap-0.5 md:gap-1">
                    {/* Show category label if in All or Top FAQs view */}
                    {(activeCategory === 'all' || activeCategory === 'top-faqs') && (
                      <span className="text-[10px] md:text-xs font-medium text-dusty-rose uppercase tracking-wider">
                        {faq.category}
                      </span>
                    )}
                    <h3 className="font-sans text-sm md:text-base font-semibold text-dune group-hover:text-dusty-rose transition-colors pr-6 md:pr-8">
                      {faq.question}
                    </h3>
                  </div>
                  <motion.div
                    className="shrink-0 ml-3 md:ml-4 text-dusty-rose bg-dusty-rose/10 rounded-full p-1 md:p-1.5 group-hover:bg-dusty-rose group-hover:text-white transition-colors duration-300"
                    animate={{ rotate: expandedIndex === faq.id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </button>

                <AnimatePresence>
                  {expandedIndex === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <div className="px-4 pb-4 pt-1.5 md:px-6 md:pb-6 md:pt-2 border-t border-sage/5">
                        <div
                          className="text-sm md:text-base text-dune/80 leading-relaxed space-y-3 md:space-y-4 [&_ul]:list-disc [&_ul]:pl-4 md:[&_ul]:pl-5 [&_ul]:space-y-1 [&_p]:mb-2 [&_strong]:font-semibold"
                          dangerouslySetInnerHTML={{ __html: faq.answer }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="body text-dune/70 mb-4">
            Still have questions?
          </p>
          <a
            href="mailto:hello@lashpopstudios.com"
            className="btn btn-secondary inline-flex items-center gap-2 bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Us
          </a>
        </motion.div>
      </div>
    </section>
  )
}
