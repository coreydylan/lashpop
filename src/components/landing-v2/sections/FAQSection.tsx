'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const faqs = [
  {
    question: "How long do lash extensions last?",
    answer: "Lash extensions typically last 2-4 weeks, depending on your natural lash growth cycle and how well you care for them. We recommend touch-ups every 2-3 weeks to maintain fullness."
  },
  {
    question: "Will lash extensions damage my natural lashes?",
    answer: "When applied properly by our certified technicians, lash extensions will not damage your natural lashes. We carefully select the appropriate length and weight for your natural lashes to ensure their health."
  },
  {
    question: "How long does the application take?",
    answer: "A full set typically takes 1.5-2 hours, while fill appointments usually take 45-60 minutes. The exact time depends on the style and volume you choose."
  },
  {
    question: "Can I wear makeup with lash extensions?",
    answer: "Yes! However, we recommend avoiding oil-based products near your eyes as they can break down the adhesive. We'll provide you with a complete aftercare guide."
  },
  {
    question: "How do I care for my lash extensions?",
    answer: "Keep them clean with a gentle lash cleanser, avoid rubbing your eyes, and brush them daily with a clean spoolie. Avoid oil-based products and excessive heat or steam for the first 24 hours."
  },
  {
    question: "What's the difference between classic and volume lashes?",
    answer: "Classic lashes apply one extension to each natural lash for a natural look. Volume lashes apply multiple lightweight extensions to each natural lash for a fuller, more dramatic effect."
  }
]

export function FAQSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-20%" })
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <section ref={ref} className="py-20 bg-cream">
      <div className="container max-w-4xl">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="heading-2 text-dune mb-4">Frequently Asked Questions</h2>
          <p className="body-text text-dune/70">
            Everything you need to know about our services
          </p>
        </motion.div>

        {/* FAQ Items */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between group"
              >
                <h3 className="body-text-bold text-dune group-hover:text-dusty-rose transition-colors">
                  {faq.question}
                </h3>
                <motion.svg
                  className="w-5 h-5 text-dusty-rose shrink-0 ml-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  animate={{ rotate: expandedIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </motion.svg>
              </button>

              <AnimatePresence>
                {expandedIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <div className="px-6 pb-5">
                      <p className="body-text text-dune/70">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="body-text text-dune/70 mb-4">
            Still have questions?
          </p>
          <a
            href="mailto:hello@lashpopstudios.com"
            className="button-secondary inline-flex items-center gap-2"
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