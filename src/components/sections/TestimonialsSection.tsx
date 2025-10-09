'use client'

import { motion } from 'framer-motion'
import { StarIcon } from '../icons/DesertIcons'

const testimonials = [
  {
    text: "LashPop isn't just a beauty appointment—it's my monthly sanctuary. Sarah's artistry is unmatched.",
    author: "Emma R.",
    rating: 5
  },
  {
    text: "The studio feels like a retreat. I leave feeling refreshed, beautiful, and ready to take on the world.",
    author: "Victoria M.",
    rating: 5
  },
  {
    text: "Natural, effortless, perfect. My lashes look like they were always meant to be this way.",
    author: "Sophia L.",
    rating: 5
  }
]

export function TestimonialsSection() {
  return (
    <section className="py-[var(--space-lg)] bg-ocean-mist/5">
      <div className="container-narrow">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-[var(--space-md)]"
        >
          <span className="caption text-golden">Testimonials</span>
          <h2 className="h2 text-dune mt-2">
            Words from our clients
          </h2>
        </motion.div>
        
        {/* Testimonials */}
        <div className="space-y-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} className="w-4 h-4 text-golden" />
                ))}
              </div>
              <p className="body-lg text-dune/80 italic mb-4 max-w-2xl mx-auto">
                &ldquo;{testimonial.text}&rdquo;
              </p>
              <p className="caption text-dusty-rose">
                — {testimonial.author}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}