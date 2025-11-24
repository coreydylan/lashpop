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
    { id: 'all', label: 'All' },
    ...categories.map(c => ({ id: c.id, label: c.displayName }))
  ]

  // If no data, show a message
  if (categories.length === 0 && featuredItems.length === 0) {
    return null
  }

  return (
    <section ref={ref} className="pb-20 bg-cream">
      <div className="container max-w-4xl">
        {/* Category Sorter - Beautiful Frosted Glass Chips */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          {/* Scrollable container for mobile */}
          <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:overflow-visible scrollbar-hide [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden relative">
            <motion.div
              className="flex flex-nowrap md:flex-wrap justify-start md:justify-center gap-3 min-w-max md:min-w-0"
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
                  onClick={() => setActiveCategory(category.id)}
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
                      ? 'bg-dusty-rose shadow-md' 
                      : 'bg-white/50 hover:bg-white/80'
                  }`} />
                  
                  {/* Content */}
                  <div className={`relative px-4 py-2 rounded-full border transition-colors duration-300 ${
                    activeCategory === category.id
                      ? 'border-dusty-rose text-white'
                      : 'border-white/60 text-dune hover:border-dusty-rose/30'
                  }`}>
                    <span className="text-sm font-medium whitespace-nowrap">
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
          className="space-y-4"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredFAQs.map((faq) => (
              <motion.div
                key={faq.id}
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
