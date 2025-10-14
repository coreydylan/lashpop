'use client'

import { motion } from 'framer-motion'
import { StarIcon } from '../icons/DesertIcons'

const testimonials = [
  {
    text: "Loved my lash lift and tint here. Such a cute place too. Felt so comfortable & relaxing. They also took off my lashes I had from a previous technician & it was a quick and painless process. Will definitely be returning for all of my lash needs (:)",
    author: "Lillian G.",
    platform: "Google",
    rating: 5
  },
  {
    text: "I recently had my lashes done here by Emily. I can't even tell you how amazed I am with my lashes. I was so afraid to get them done after a horrible experience years ago. Emily listened to my concerns and did EXACTLY what I wanted. I've seen some awful jobs done and you won't have that experience here. I am crazy about reviews before going anywhere and LashPop lives to the 5 star ratings they hold. I am beyond thankful I ended up there.",
    author: "Lyndsie C.",
    platform: "Yelp",
    rating: 5
  },
  {
    text: "Savannah is incredible!! These lashes are the best I've ever had. This was my first time at Lashpop and it is now my new addiction. Savannah is so sweet and made the whole appointment fun and comfortable! It's so beautiful inside and everyone was so sweet. 10/10 recommend",
    author: "Ava N.",
    platform: "Google",
    rating: 5
  }
]

const reviewStats = {
  google: { rating: 5.0, count: 127 },
  yelp: { rating: 5.0, count: 89 },
  vagaro: { rating: 5.0, count: 203 }
}

export function EnhancedReviews() {
  return (
    <section className="py-[var(--space-xl)] bg-ocean-mist/5">
      <div className="container">
        {/* Header with Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-[var(--space-md)]"
        >
          <span className="caption text-golden">Client Love</span>
          <h2 className="h2 text-dune mt-2 mb-8">
            What people are saying...
          </h2>

          {/* Review Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            {Object.entries(reviewStats).map(([platform, stats], index) => (
              <motion.div
                key={platform}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-golden fill-current" />
                  ))}
                </div>
                <p className="text-2xl font-light text-dune">{stats.rating}</p>
                <p className="caption text-dune/60 capitalize">{stats.count} {platform} reviews</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-cream arch-full p-8"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} className="w-4 h-4 text-golden fill-current" />
                ))}
              </div>
              <p className="body text-dune/80 mb-6">
                &ldquo;{testimonial.text}&rdquo;
              </p>
              <div className="pt-4 border-t border-sage/10">
                <p className="caption text-dusty-rose font-medium">
                  {testimonial.author}
                </p>
                <p className="caption text-dune/50 text-xs">
                  {testimonial.platform}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mt-12"
        >
          <p className="body text-dune/70 mb-6">
            Join hundreds of happy clients
          </p>
          <button className="btn btn-primary">
            Book Your Appointment
          </button>
        </motion.div>
      </div>
    </section>
  )
}
