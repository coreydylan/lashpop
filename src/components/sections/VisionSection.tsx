'use client'

import { motion } from 'framer-motion'
import { StarIcon } from '../icons/DesertIcons'

export function VisionSection() {
  return (
    <section className="py-[var(--space-xl)] bg-gradient-to-b from-cream to-warm-sand/20">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-8"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <StarIcon className="w-12 h-12 text-dusty-rose" />
          </motion.div>

          {/* Title */}
          <div>
            <span className="caption text-terracotta">Our Vision</span>
            <h2 className="h2 text-dune mt-2">
              A Letter from Our Founder
            </h2>
          </div>

          {/* Letter Content */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-6"
          >
            <p className="body-lg text-dune/80 italic">
              &ldquo;When I founded LashPop Studios, I had a vision of creating more than just a beauty space—
              I wanted to build a collective where talented professionals could thrive together.&rdquo;
            </p>

            <p className="body text-dune/70">
              Our studio is home to hand-selected beauty professionals who share our commitment to
              effortless, low-maintenance beauty. Whether you&apos;re visiting one of our talented employees
              or an independent artist, you can expect the same high standard of service, skill, and
              kindness that defines the LashPop experience.
            </p>

            <p className="body text-dune/70">
              We believe beauty should enhance your natural confidence, not define it. That&apos;s why we
              focus on creating looks that feel authentically you—beautiful, effortless, and perfectly
              suited to your modern lifestyle.
            </p>

            <p className="body-lg text-dune font-light mt-8">
              — Emily Rogers, Owner & Founder
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
