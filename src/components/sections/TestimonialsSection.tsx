'use client'

import { motion } from 'framer-motion'
import { StarIcon } from '../icons/DesertIcons'

const testimonials = [
  {
    text: "Loved my lash lift and tint here. Such a cute place too. Felt so comfortable & relaxing. They also took off my lashes I had from a previous technician & it was a quick and painless process. Will definitely be returning for all of my lash needs (:)",
    author: "Lillian G.",
    rating: 5
  },
  {
    text: "I recently had my lashes done here by Emily. I can't even tell you how amazed I am with my lashes. I was so afraid to get them done after a horrible experience years ago. Emily listened to my concerns and did EXACTLY what I wanted. I've seen some awful jobs done and you won't have that experience here. I am crazy about reviews before going anywhere and LashPop lives to the 5 star ratings they hold. I am beyond thankful I ended up there.",
    author: "Lyndsie C.",
    rating: 5
  },
  {
    text: "Savannah is incredible!! These lashes are the best I've ever had. This was my first time at Lashpop and it is now my new addiction. Savannah is so sweet and made the whole appointment fun and comfortable! It's so beautiful inside and everyone was so sweet. 10/10 recommend",
    author: "Ava N.",
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
          <span className="caption text-golden">Client Love</span>
          <h2 className="h2 text-dune mt-2">
            What people are saying...
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