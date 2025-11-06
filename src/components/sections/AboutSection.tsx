'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { LeafIcon, StarIcon } from '../icons/DesertIcons'

const values = [
  {
    icon: <StarIcon className="w-6 h-6" />,
    title: 'Hand-Selected Professionals',
    description: 'Every artist meets our high standards'
  },
  {
    icon: <LeafIcon className="w-6 h-6" />,
    title: 'Effortless Beauty',
    description: 'Low-maintenance looks that fit your lifestyle'
  },
  {
    icon: <StarIcon className="w-6 h-6" />,
    title: 'Peaceful Atmosphere',
    description: 'A beautiful space for your beauty rituals'
  }
]

export function AboutSection() {
  return (
    <section id="about" className="py-[var(--space-xl)] bg-ocean-mist/10">
      <div className="container">
        {/* About Content */}
        <div className="grid lg:grid-cols-2 gap-[var(--space-lg)] items-center mb-[var(--space-xl)]">
          {/* Left - Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative">
              <div className="aspect-[4/5] rounded-[0_200px_200px_0] overflow-hidden">
                <Image
                  src="/lashpop-images/studio/studio-lash-65.jpeg"
                  alt="LashPop Studio"
                  fill
                  className="object-cover"
                />
              </div>
              {/* Decorative element */}
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-sage/10 blur-3xl" />
            </div>
          </motion.div>
          
          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div>
              <span className="caption text-terracotta">Why LashPop</span>
              <h2 className="h2 text-dune mt-2 mb-6">
                A collective of
                <span className="block italic text-dusty-rose">exceptional talent</span>
              </h2>
              <p className="body-lg text-dune/70 mb-4">
                Each beauty professional and business has been hand-selected to be part of our beauty collective,
                meeting the LashPop standard and fitting into our effortless, low-maintenance beauty vibe.
              </p>
              <p className="body text-dune/60">
                You can expect consistency across the board with amazing services, talented and kind-hearted
                service providers, and our cute and peaceful atmosphere. We believe in effortless beauty
                for the modern woman.
              </p>
            </div>
            
            {/* Values */}
            <div className="space-y-4 pt-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="text-golden mt-1">{value.icon}</div>
                  <div>
                    <h4 className="font-normal text-dune mb-1">{value.title}</h4>
                    <p className="caption text-dune/60">{value.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
