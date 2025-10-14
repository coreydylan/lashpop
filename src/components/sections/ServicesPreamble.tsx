'use client'

import { motion } from 'framer-motion'

export function ServicesPreamble() {
  return (
    <section className="py-[var(--space-md)] bg-warm-sand/10">
      <div className="container-narrow text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <h2 className="h2 text-dune">
            Discover Our Services
          </h2>
          <p className="body-lg text-dune/70">
            From lash artistry to brow design, every service is crafted to enhance your natural beauty
            with precision and care. Explore our full range of offerings below.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
