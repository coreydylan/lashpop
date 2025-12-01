'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'framer-motion'
import { PROGRAMMATIC_SCROLL_EVENT } from '@/hooks/useMobileGSAPScroll'

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

// Custom event to signal FAQ interaction state changes
const FAQ_INTERACTION_EVENT = 'faq-interaction-change'

export function dispatchFAQInteraction(isInteracting: boolean) {
  window.dispatchEvent(new CustomEvent(FAQ_INTERACTION_EVENT, {
    detail: { isInteracting }
  }))
}

// Signal that a programmatic scroll is happening (prevents snap)
function dispatchProgrammaticScroll() {
  window.dispatchEvent(new CustomEvent(PROGRAMMATIC_SCROLL_EVENT))
}

export function FAQSection({ categories, itemsByCategory, featuredItems }: FAQSectionProps) {
  const ref = useRef(null)
  const sectionRef = useRef<HTMLElement>(null)
  const faqListRef = useRef<HTMLDivElement>(null)
  const stickyHeaderRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-10%" })
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('top-faqs')
  const [isMobile, setIsMobile] = useState(false)
  const hasSnappedOnEntryRef = useRef(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Entry snap: when FAQ section enters viewport from scrolling down, snap once to dock sticky header
  useEffect(() => {
    if (!isMobile || !sectionRef.current) return

    const section = sectionRef.current
    const container = document.querySelector('.mobile-scroll-container') as HTMLElement
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Only snap when entering from above (scrolling down) and haven't snapped yet
          if (entry.isIntersecting && !hasSnappedOnEntryRef.current) {
            const rect = section.getBoundingClientRect()
            // Only snap if section top is near the viewport top (entering, not already scrolled into)
            if (rect.top > -100 && rect.top < 200) {
              hasSnappedOnEntryRef.current = true
              dispatchProgrammaticScroll()

              // Calculate snap position to show first FAQ card at top
              // We want: faqList top = mobileHeader (44px) + stickyHeader height + small buffer
              const headerHeight = 44
              const stickyHeight = stickyHeaderRef.current?.offsetHeight || 52
              const buffer = 8

              if (faqListRef.current) {
                // Get current position of FAQ list relative to viewport
                const faqListRect = faqListRef.current.getBoundingClientRect()
                // Calculate where we want the FAQ list to be (below both headers)
                const targetFaqListTop = headerHeight + stickyHeight + buffer
                // Calculate scroll adjustment needed
                const scrollAdjustment = faqListRect.top - targetFaqListTop
                const targetScrollY = container.scrollTop + scrollAdjustment

                container.scrollTo({ top: targetScrollY, behavior: 'smooth' })
              }
            }
          }

          // Reset flag when section leaves viewport (so we can snap again on re-entry)
          if (!entry.isIntersecting) {
            hasSnappedOnEntryRef.current = false
          }
        })
      },
      {
        root: container,
        threshold: [0, 0.1],
        rootMargin: '-44px 0px 0px 0px' // Account for mobile header
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
      // Signal programmatic scroll to prevent snap interference
      dispatchProgrammaticScroll()

      setTimeout(() => {
        const headerHeight = 44 // Mobile header height (44px)
        const stickyChipsHeight = stickyHeaderRef.current?.offsetHeight || 60
        const totalOffset = headerHeight + stickyChipsHeight + 8

        // Use getBoundingClientRect to get position relative to viewport
        const faqListRect = faqListRef.current!.getBoundingClientRect()

        // Get the mobile scroll container
        const container = document.querySelector('.mobile-scroll-container')
        if (container) {
          // Signal again right before scroll
          dispatchProgrammaticScroll()
          const currentScrollTop = container.scrollTop
          // Calculate target: current scroll + how far the list is from where it should be
          const targetScrollY = currentScrollTop + faqListRect.top - totalOffset
          container.scrollTo({ top: targetScrollY, behavior: 'smooth' })
        }
      }, 50) // Small delay to let the DOM update
    }
  }

  const toggleFAQ = (id: string) => {
    const isExpanding = expandedIndex !== id

    // On mobile, handle scroll adjustments when expanding cards
    if (isMobile && isExpanding) {
      // Signal programmatic scroll before any adjustments
      dispatchProgrammaticScroll()

      // When expanding, scroll to ensure the card header stays visible
      setTimeout(() => {
        const cardElement = document.querySelector(`[data-faq-id="${id}"]`)
        if (cardElement) {
          const rect = cardElement.getBoundingClientRect()
          const headerHeight = 44
          const stickyHeight = stickyHeaderRef.current?.offsetHeight || 60
          const minVisibleTop = headerHeight + stickyHeight + 16 // 16px buffer

          // If card header is above the visible area (behind sticky elements)
          if (rect.top < minVisibleTop) {
            const container = document.querySelector('.mobile-scroll-container')
            if (container) {
              // Signal again right before scroll
              dispatchProgrammaticScroll()
              const scrollAdjustment = minVisibleTop - rect.top + 8
              container.scrollBy({ top: -scrollAdjustment, behavior: 'smooth' })
            }
          }
        }
      }, 50) // Small delay for DOM update
    }

    setExpandedIndex(isExpanding ? id : null)
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
    { id: 'all', label: 'All' },
    ...categories.map(c => ({ id: c.id, label: c.displayName }))
  ]

  // If no data, show a message
  if (categories.length === 0 && featuredItems.length === 0) {
    return null
  }

  return (
    <section ref={(el) => { (ref as any).current = el; sectionRef.current = el; }} className="pt-8 pb-20 bg-cream">
      <div className="container max-w-4xl">
        {/* Category Sorter - Compact Frosted Glass Chips */}
        {/* On mobile: sticky at top-[44px] with gradient fade at bottom */}
        <motion.div
          ref={stickyHeaderRef}
          className="mb-4 md:mb-12 sticky md:static top-[44px] z-50 md:bg-transparent md:backdrop-blur-none md:pt-0 md:pb-0 md:mt-0"
          style={isMobile ? {
            background: 'linear-gradient(180deg, rgba(250, 247, 244, 0.85) 0%, rgba(250, 247, 244, 0.85) 70%, rgba(250, 247, 244, 0) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            paddingTop: '8px',
            paddingBottom: '16px',
            marginTop: '-8px',
          } : undefined}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          {/* Scrollable container for mobile */}
          <div className="overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:overflow-visible scrollbar-hide [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden relative">
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
                  className="relative group shrink-0"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Active/Hover State Background */}
                  <div className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
                    activeCategory === category.id
                      ? 'bg-dusty-rose shadow-sm'
                      : 'bg-white/50 hover:bg-white/80'
                  }`} />

                  {/* Content - Compact sizing for mobile */}
                  <div className={`relative px-3 py-1.5 md:px-4 md:py-2 rounded-full border transition-colors duration-300 ${
                    activeCategory === category.id
                      ? 'border-dusty-rose text-white'
                      : 'border-white/60 text-dune hover:border-dusty-rose/30'
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
        <motion.div
          ref={faqListRef}
          className="space-y-4"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredFAQs.map((faq) => (
              <motion.div
                key={faq.id}
                data-faq-id={faq.id}
                layout
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-sage/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between group"
                >
                  <div className="flex flex-col items-start gap-1">
                    {/* Show category label if in All or Top FAQs view */}
                    {(activeCategory === 'all' || activeCategory === 'top-faqs') && (
                      <span className="text-xs font-medium text-dusty-rose uppercase tracking-wider">
                        {faq.category}
                      </span>
                    )}
                    <h3 className="font-sans font-semibold text-dune group-hover:text-dusty-rose transition-colors pr-8">
                      {faq.question}
                    </h3>
                  </div>
                  <motion.div
                    className="shrink-0 ml-4 text-dusty-rose bg-dusty-rose/10 rounded-full p-1.5 group-hover:bg-dusty-rose group-hover:text-white transition-colors duration-300"
                    animate={{ rotate: expandedIndex === faq.id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <div className="px-6 pb-6 pt-2 border-t border-sage/5">
                        <div 
                          className="body text-dune/80 leading-relaxed space-y-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_p]:mb-2 [&_strong]:font-semibold"
                          dangerouslySetInnerHTML={{ __html: faq.answer }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

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
