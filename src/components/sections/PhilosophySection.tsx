'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'

const philosophyPillars = [
  {
    title: "Natural Elevation",
    description: "We don't mask beauty—we reveal it. Every service is designed to enhance what's already there, creating that 'your lashes, but better' effect.",
    image: "/lashpop-images/gallery/lash-92.jpeg",
    gradient: "from-[rgb(255,248,243)] to-[rgba(255,192,203,0.3)]"
  },
  {
    title: "Intentional Sanctuary",
    description: "More than a beauty appointment—it's a ritual of restoration. Our studio becomes your personal retreat where time slows down.",
    image: "/lashpop-images/studio/studio-lash-65.jpeg",
    gradient: "from-[rgba(232,237,231,0.3)] to-[rgb(255,248,243)]"
  },
  {
    title: "Precision with Soul",
    description: "Technical mastery meets genuine warmth. Every lash placed with care, every client greeted like a friend returning home.",
    image: "/lashpop-images/gallery/gallery-img-3962.jpeg",
    gradient: "from-[rgb(255,248,243)] to-[rgba(232,180,184,0.3)]"
  },
  {
    title: "Time as Luxury",
    description: "We give you back your mornings. No more mascara rituals—just wake up, look in the mirror, and go.",
    image: "/lashpop-images/gallery/gallery-lash-40.jpeg",
    gradient: "from-[rgba(255,192,203,0.2)] to-[rgb(255,248,243)]"
  }
]

export function PhilosophySection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
    layoutEffect: false
  })
  
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.95, 1, 1, 0.95])
  
  return (
    <motion.section 
      ref={containerRef}
      style={{ opacity, scale }}
      className="py-[var(--space-section)] overflow-hidden"
    >
      <div className="max-width-content section-padding">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-[var(--space-block)]"
        >
          <span className="heading-script gradient-text">Our Philosophy</span>
          <h2 className="heading-primary mt-4">
            The LashPop Difference
          </h2>
          <p className="body-large mt-6 max-w-3xl mx-auto text-[rgb(74,74,74)]">
            It&apos;s not just in how you look—it&apos;s in how you feel. Every service is a carefully crafted experience,
            designed to honor your natural beauty while giving you that extra something that makes mirrors irresistible.
          </p>
        </motion.div>
        
        {/* Philosophy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {philosophyPillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="group cursor-pointer"
              >
                {/* Image Container */}
                <div className="relative h-64 lg:h-80 rounded-2xl overflow-hidden mb-6">
                  <div className={`absolute inset-0 bg-gradient-to-br ${pillar.gradient} z-10 opacity-40 group-hover:opacity-20 transition-opacity duration-500`} />
                  <Image
                    src={pillar.image}
                    alt={pillar.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  
                  {/* Floating Number */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                    className="absolute top-4 left-4 w-12 h-12 rounded-full glass-soft flex items-center justify-center"
                  >
                    <span className="text-[rgb(232,180,184)] font-serif text-xl">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                  </motion.div>
                </div>
                
                {/* Text Content */}
                <div className="space-y-3">
                  <h3 className="heading-tertiary text-[rgb(74,74,74)]">
                    {pillar.title}
                  </h3>
                  <p className="body-base text-[rgb(74,74,74)]/80 leading-relaxed">
                    {pillar.description}
                  </p>
                  
                  {/* Animated Underline */}
                  <div className="relative h-[1px] w-full overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgb(232,180,184)] to-transparent shimmer-effect"
                      initial={{ x: '-100%' }}
                      whileInView={{ x: '100%' }}
                      transition={{ duration: 2, delay: 0.5 + index * 0.1 }}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
        
        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8 }}
          className="text-center mt-[var(--space-block)]"
        >
          <p className="body-large mb-8 text-[rgb(74,74,74)]">
            Ready to experience the difference?
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-gradient-to-r from-[rgb(232,180,184)] to-[rgb(255,192,203)] text-white rounded-full font-medium hover-glow"
          >
            Reserve your moment
          </motion.button>
        </motion.div>
      </div>
    </motion.section>
  )
}
