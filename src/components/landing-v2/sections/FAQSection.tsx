'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// Escape user-controlled-but-internally-trusted strings before injecting via innerHTML
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c] as string))
}

// Convert any <ul> where most <li> entries match "Label: Value" into a minimal
// menu-style two-column layout with leader dots — feels editorial, like a
// service menu. Falls back to a normal bullet list if the pattern doesn't hold.
function enhanceTabularLists(root: HTMLElement) {
  const uls = root.querySelectorAll('ul')
  uls.forEach((ul) => {
    if (ul.dataset.enhanced === '1') return
    const items = Array.from(ul.querySelectorAll(':scope > li'))
    if (items.length < 3) return

    type Row = { label: string; value: string } | null
    const rows: Row[] = items.map((li) => {
      const text = (li.textContent || '').trim()
      const colonIdx = text.indexOf(':')
      if (colonIdx === -1 || colonIdx > 80) return null
      const label = text.slice(0, colonIdx).trim()
      const value = text.slice(colonIdx + 1).trim()
      if (!label || !value) return null
      return { label, value }
    })

    const matched = rows.filter((r): r is { label: string; value: string } => r !== null)
    if (matched.length < items.length * 0.7) return

    const wrap = document.createElement('div')
    wrap.dataset.enhanced = '1'
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:0.5rem;margin:0.25rem 0;'
    wrap.innerHTML = matched
      .map(
        (row) => `
        <div style="display:flex;align-items:baseline;gap:0.5rem;">
          <span style="font-weight:500;color:#2f2a26;">${escapeHtml(row.label)}</span>
          <span aria-hidden="true" style="flex:1;align-self:flex-end;height:4px;margin-bottom:0.45em;background-image:radial-gradient(circle, rgba(204,148,127,0.4) 1px, transparent 1.5px);background-size:7px 4px;background-repeat:repeat-x;"></span>
          <span style="font-weight:500;color:#a24730;font-variant-numeric:tabular-nums;white-space:nowrap;">${escapeHtml(row.value)}</span>
        </div>`,
      )
      .join('')

    ul.replaceWith(wrap)
  })
}

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

  // Auto-open a specific FAQ when navigated via ?openFaq=<question-slug> (e.g. footer "Cancellation Policy" link)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const openFaqSlug = params.get('openFaq')
    if (!openFaqSlug) return

    const slugify = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    let targetId: string | null = null
    const featured = featuredItems.find(f => slugify(f.question) === openFaqSlug)
    if (featured) {
      setActiveCategory('top-faqs')
      setExpandedIndex(featured.id)
      targetId = featured.id
    } else {
      for (const cat of categories) {
        const item = (itemsByCategory[cat.id] || []).find(f => slugify(f.question) === openFaqSlug)
        if (item) {
          setActiveCategory(cat.id)
          setExpandedIndex(item.id)
          targetId = item.id
          break
        }
      }
    }

    if (!targetId) return

    // After state updates render, scroll the specific card just below the sticky header.
    // Mobile uses a custom scroll container; desktop uses the window.
    const t = window.setTimeout(() => {
      const card = document.getElementById(`faq-card-${targetId}`)
      if (!card) return

      const mobileHeaderHeight = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--mobile-header-height') || '44'
      )
      const stickyChipsHeight = stickyHeaderRef.current?.offsetHeight || 0
      const mobileOffset = mobileHeaderHeight + stickyChipsHeight + 8
      const desktopOffset = 96 // matches scroll-mt-24 on the section

      const mobileContainer = document.querySelector('.mobile-scroll-container') as HTMLElement | null
      if (mobileContainer && window.getComputedStyle(mobileContainer).overflowY !== 'visible') {
        const cardRect = card.getBoundingClientRect()
        const targetScrollY = mobileContainer.scrollTop + cardRect.top - mobileOffset
        mobileContainer.scrollTo({ top: targetScrollY, behavior: 'smooth' })
      } else {
        const targetScrollY = window.scrollY + card.getBoundingClientRect().top - desktopOffset
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' })
      }
    }, 150)
    return () => window.clearTimeout(t)
  }, [categories, itemsByCategory, featuredItems])

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
      className="py-12 md:py-20 bg-cream"
    >
      <div className="container max-w-4xl">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2
            className="text-2xl md:text-5xl font-display font-medium tracking-wide mb-4 md:mb-6"
            style={{ color: 'rgb(var(--terracotta-ink))' }}
          >
            FAQ
          </h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="w-24 h-px bg-terracotta/30 mx-auto"
            style={{ transformOrigin: 'center' }}
          />
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
              {categoryOptions.map((category, index) => {
                const isActive = activeCategory === category.id
                return (
                  <motion.div
                    key={category.id || `cat-${index}`}
                    className="shrink-0"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.3, ease: 'easeOut' }}
                  >
                    <button
                      onClick={() => handleCategoryChange(category.id)}
                      aria-label={`Filter by ${category.label}`}
                      aria-pressed={isActive}
                      className="relative group rounded-full"
                    >
                      {/* Inactive base layer (always present so unselected chips have hover bg) */}
                      <div className="absolute inset-0 rounded-full bg-white/50 group-hover:bg-white/80 transition-colors" />

                      {/* Active terracotta pill — slides between chips via shared layout */}
                      {isActive && (
                        <motion.div
                          layoutId="activeFaqChip"
                          className="absolute inset-0 rounded-full shadow-md"
                          style={{ backgroundColor: 'rgb(var(--terracotta-ink))' }}
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}

                      {/* Content - Compact sizing for mobile */}
                      <div className={`relative px-3 py-1.5 md:px-4 md:py-2 rounded-full border transition-colors ${
                        isActive
                          ? 'border-transparent text-white'
                          : 'border-white/60 text-charcoal'
                      }`}
                      style={!isActive ? { ['--tw-border-opacity' as string]: 0.3 } : undefined}
                      >
                        <span className="text-xs md:text-sm font-sans font-medium whitespace-nowrap">
                          {category.label}
                        </span>
                      </div>
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* FAQ Items */}
        <div
          ref={faqListRef}
          className="space-y-3 md:space-y-4"
        >
          {filteredFAQs.map((faq, index) => {
            const isExpanded = expandedIndex === faq.id
            const isDimmed = expandedIndex !== null && !isExpanded
            return (
              <FAQCard
                key={faq.id || `faq-${index}`}
                faq={faq}
                isExpanded={isExpanded}
                isDimmed={isDimmed}
                showCategory={activeCategory === 'all' || activeCategory === 'top-faqs'}
                onToggle={() => toggleFAQ(faq.id)}
              />
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="font-sans font-light text-charcoal mb-6">
            Still have questions?
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="tel:+17602120448"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/80 hover:-translate-y-0.5 border border-dusty-rose/20 transition-[background-color,transform] duration-200"
            >
              <svg className="w-4 h-4" style={{ color: 'rgb(var(--terracotta-ink))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="font-sans font-medium text-sm text-charcoal">Call Us</span>
            </a>
            <a
              href="sms:+17602120448"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/80 hover:-translate-y-0.5 border border-dusty-rose/20 transition-[background-color,transform] duration-200"
            >
              <svg className="w-4 h-4" style={{ color: 'rgb(var(--terracotta-ink))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="font-sans font-medium text-sm text-charcoal">Text Us</span>
            </a>
            <a
              href="mailto:lashpopstudios@gmail.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/80 hover:-translate-y-0.5 border border-dusty-rose/20 transition-[background-color,transform] duration-200"
            >
              <svg className="w-4 h-4" style={{ color: 'rgb(var(--terracotta-ink))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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

interface FAQCardProps {
  faq: { id: string; question: string; answer: string; category: string }
  isExpanded: boolean
  isDimmed: boolean
  showCategory: boolean
  onToggle: () => void
}

function FAQCard({ faq, isExpanded, isDimmed, showCategory, onToggle }: FAQCardProps) {
  const answerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!isExpanded) return
    const root = answerRef.current
    if (!root) return
    enhanceTabularLists(root)
  }, [isExpanded, faq.id])

  return (
    <div
      id={faq.id ? `faq-card-${faq.id}` : undefined}
      className={`bg-white rounded-xl md:rounded-2xl overflow-hidden border border-dusty-rose/20 transition-[box-shadow,opacity,transform] duration-300 ease-out ${
        isExpanded ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
      } ${isDimmed ? 'opacity-60' : 'opacity-100'} ${!isExpanded && !isDimmed ? 'hover:-translate-y-0.5' : ''}`}
    >
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full px-4 py-3.5 md:px-6 md:py-5 text-left flex items-center justify-between group"
      >
        <div className="flex flex-col items-start gap-0.5 md:gap-1">
          {showCategory && (
            <span
              className="text-[10px] md:text-xs font-sans font-medium uppercase tracking-wider"
              style={{ color: 'rgb(var(--terracotta-ink))' }}
            >
              {faq.category}
            </span>
          )}
          <h3 className="font-sans text-sm md:text-base font-semibold text-charcoal pr-6 md:pr-8 group-hover:text-[rgb(var(--terracotta-ink))]">
            {faq.question}
          </h3>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="shrink-0 ml-3 md:ml-4 rounded-full p-1 md:p-1.5 transition-colors text-[rgb(var(--terracotta-ink))] [background-color:rgba(162,71,48,0.1)] group-hover:bg-[rgb(var(--terracotta-ink))] group-hover:text-white"
        >
          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 },
              opacity: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
            }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 pt-3 md:px-6 md:pb-6 md:pt-4"
              style={{ backgroundColor: 'rgba(211, 163, 146, 0.06)' }}
            >
              <motion.div
                ref={answerRef}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4, transition: { duration: 0.12 } }}
                transition={{
                  opacity: { duration: 0.28, delay: 0.12 },
                  y: { duration: 0.32, delay: 0.12, ease: [0.22, 1, 0.36, 1] },
                }}
                className="text-sm md:text-base font-sans font-light text-charcoal leading-relaxed space-y-3 md:space-y-4 [&_ul]:list-disc [&_ul]:pl-4 md:[&_ul]:pl-5 [&_ul]:space-y-1 [&_p]:mb-2 [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{ __html: faq.answer }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
