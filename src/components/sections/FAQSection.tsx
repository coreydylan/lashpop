'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const faqs = [
  {
    category: 'Booking',
    questions: [
      {
        q: 'How do I book an appointment?',
        a: 'You can book online through our website, call us at (760) 212-0448, or book directly through your preferred artist\'s booking link.'
      },
      {
        q: 'What is your cancellation policy?',
        a: 'We require 24 hours notice for cancellations. Late cancellations or no-shows may forfeit their deposit.'
      }
    ]
  },
  {
    category: 'Appointments',
    questions: [
      {
        q: 'How should I prepare for my appointment?',
        a: 'Come with clean lashes (no makeup), use the restroom beforehand, and feel free to bring headphones if you\'d like to relax with music or podcasts. We provide blankets if you get cold.'
      },
      {
        q: 'How long do appointments take?',
        a: 'Classic sets: 90 min, Hybrid: 120 min, Volume: 150 min, Lash Lifts: 45 min'
      }
    ]
  },
  {
    category: 'Aftercare',
    questions: [
      {
        q: 'How do I care for my lash extensions?',
        a: 'Keep them dry for 24 hours, clean them daily with lash cleanser, avoid oil-based products, and brush them gently with a spoolie.'
      },
      {
        q: 'How long do lash extensions last?',
        a: 'Extensions last 4-6 weeks with proper care. We recommend fills every 2-3 weeks to maintain fullness.'
      }
    ]
  },
  {
    category: 'Policies',
    questions: [
      {
        q: 'What is your deposit policy?',
        a: 'Some services require a deposit to secure your appointment. Deposits are non-refundable but can be applied to your service.'
      },
      {
        q: 'Can I bring children or pets?',
        a: 'For safety and to maintain a relaxing environment, we ask that you arrange childcare and leave pets at home.'
      }
    ]
  }
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<string | null>(null)

  const toggleQuestion = (categoryIndex: number, questionIndex: number) => {
    const key = `${categoryIndex}-${questionIndex}`
    setOpenIndex(openIndex === key ? null : key)
  }

  return (
    <section id="faq" className="py-[var(--space-xl)] bg-cream">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <span className="caption text-terracotta">FAQ</span>
          <h2 className="h2 text-dune mt-2">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div className="space-y-8">
          {faqs.map((category, catIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: catIndex * 0.1 }}
            >
              <h3 className="text-xl font-light text-dusty-rose mb-4">{category.category}</h3>
              <div className="space-y-2">
                {category.questions.map((faq, qIndex) => {
                  const key = `${catIndex}-${qIndex}`
                  const isOpen = openIndex === key

                  return (
                    <div
                      key={qIndex}
                      className="bg-warm-sand/20 rounded-2xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleQuestion(catIndex, qIndex)}
                        className="w-full text-left p-6 flex justify-between items-center hover:bg-warm-sand/30 transition-colors"
                      >
                        <span className="font-light text-dune pr-4">{faq.q}</span>
                        <motion.span
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-dusty-rose text-2xl flex-shrink-0"
                        >
                          ↓
                        </motion.span>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 text-dune/70">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mt-12"
        >
          <p className="body text-dune/70 mb-4">
            Still have questions?
          </p>
          <button className="btn btn-secondary">
            Contact Us
          </button>
        </motion.div>
      </div>
    </section>
  )
}
