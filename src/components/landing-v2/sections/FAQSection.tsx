'use client'

import { useState, useRef, useEffect } from 'react'

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
  const sectionRef = useRef<HTMLElement>(null)
  const faqListRef = useRef<HTMLDivElement>(null)
  const stickyHeaderRef = useRef<HTMLDivElement>(null)
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
      }, 50)
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
      ref={sectionRef}
      id="faq"
      className="pt-8 pb-8 md:pb-20 bg-cream"
    >
      <div className="container max-w-4xl">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2
            className="text-2xl md:text-5xl font-display font-medium tracking-wide mb-4 md:mb-6"
            style={{ color: '#cc947f' }}
          >
            FAQ
          </h2>
          <div className="w-24 h-px bg-terracotta/30 mx-auto" />
        </div>

        {/* Category Sorter - Compact Frosted Glass Chips */}
        <div
          ref={stickyHeaderRef}
          className="mb-4 md:mb-12 sticky md:static top-[60px] z-40 md:top-0 md:bg-transparent md:backdrop-blur-none md:pt-0 md:pb-0 md:mt-0"
          style={isMobile ? {
            backgroundColor: '#f0e0db',
            paddingTop: '16px',
            paddingBottom: '12px',
            marginTop: '-4px',
          } : undefined}
        >
          {/* Scrollable container for mobile */}
          <div className="overflow-x-auto py-2 -my-2 -mx-4 px-4 md:mx-0 md:px-0 md:py-0 md:my-0 md:overflow-visible scrollbar-hide [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden relative">
            <div className="flex flex-nowrap md:flex-wrap justify-start md:justify-center gap-2 md:gap-3 min-w-max md:min-w-0">
              {categoryOptions.map((category, index) => (
                <button
                  key={category.id || `cat-${index}`}
                  onClick={() => handleCategoryChange(category.id)}
                  aria-label={`Filter by ${category.label}`}
                  aria-pressed={activeCategory === category.id}
                  className="relative group shrink-0 focus:outline-none focus-visible:outline-none"
                >
                  {/* Active/Hover State Background */}
                  <div
                    className={`absolute inset-0 rounded-full ${
                      activeCategory === category.id
                        ? 'shadow-md'
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                    style={activeCategory === category.id ? { backgroundColor: '#d3a392' } : undefined}
                  />

                  {/* Content - Compact sizing for mobile */}
                  <div className={`relative px-3 py-1.5 md:px-4 md:py-2 rounded-full border ${
                    activeCategory === category.id
                      ? 'border-transparent text-white'
                      : 'border-white/60 text-charcoal'
                  }`}
                  style={activeCategory !== category.id ? { ['--tw-border-opacity' as string]: 0.3 } : undefined}
                  >
                    <span className="text-xs md:text-sm font-sans font-medium whitespace-nowrap">
                      {category.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Items */}
        <div
          ref={faqListRef}
          className="space-y-3 md:space-y-4"
        >
          {filteredFAQs.map((faq, index) => (
            <div
              key={faq.id || `faq-${index}`}
              className="bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-dusty-rose/20"
            >
              <button
                onClick={() => toggleFAQ(faq.id)}
                aria-expanded={expandedIndex === faq.id}
                className="w-full px-4 py-3.5 md:px-6 md:py-5 text-left flex items-center justify-between group"
              >
                <div className="flex flex-col items-start gap-0.5 md:gap-1">
                  {/* Show category label if in All or Top FAQs view */}
                  {(activeCategory === 'all' || activeCategory === 'top-faqs') && (
                    <span
                      className="text-[10px] md:text-xs font-sans font-medium uppercase tracking-wider"
                      style={{ color: '#d3a392' }}
                    >
                      {faq.category}
                    </span>
                  )}
                  <h3 className="font-sans text-sm md:text-base font-semibold text-charcoal pr-6 md:pr-8 group-hover:[color:#d3a392]">
                    {faq.question}
                  </h3>
                </div>
                <div
                  className={`shrink-0 ml-3 md:ml-4 rounded-full p-1 md:p-1.5 transition-colors ${
                    expandedIndex === faq.id ? 'rotate-180' : ''
                  } [color:#d3a392] [background-color:rgba(211,163,146,0.1)] group-hover:[background-color:#d3a392] group-hover:text-white`}
                >
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expandedIndex === faq.id && (
                <div>
                  <div className="px-4 pb-4 pt-1.5 md:px-6 md:pb-6 md:pt-2 border-t border-dusty-rose/20">
                    <div
                      className="text-sm md:text-base font-sans font-light text-charcoal leading-relaxed space-y-3 md:space-y-4 [&_ul]:list-disc [&_ul]:pl-4 md:[&_ul]:pl-5 [&_ul]:space-y-1 [&_p]:mb-2 [&_strong]:font-semibold"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="font-sans font-light text-charcoal mb-6">
            Still have questions?
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="tel:+17602120448"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/80 border border-dusty-rose/20 transition-colors"
            >
              <svg className="w-4 h-4 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="font-sans font-medium text-sm text-charcoal">Call Us</span>
            </a>
            <a
              href="sms:+17602120448"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/80 border border-dusty-rose/20 transition-colors"
            >
              <svg className="w-4 h-4 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="font-sans font-medium text-sm text-charcoal">Text Us</span>
            </a>
            <a
              href="mailto:lashpopstudios@gmail.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/80 border border-dusty-rose/20 transition-colors"
            >
              <svg className="w-4 h-4 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="font-sans font-medium text-sm text-charcoal">Email Us</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
