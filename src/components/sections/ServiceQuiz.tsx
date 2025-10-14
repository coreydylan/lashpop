'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'

const quizOptions = [
  {
    id: 'lashes',
    title: 'Lashes',
    description: 'Eyelash extensions, lifts & tints',
    image: '/lashpop-images/gallery/lash-102.jpeg',
    link: '#services'
  },
  {
    id: 'everything',
    title: 'Everything Else',
    description: 'Brows, skin care, PMU & more',
    image: '/lashpop-images/services/brow-photo.png',
    link: '#services'
  }
]

export function ServiceQuiz() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  return (
    <section className="py-[var(--space-xl)] bg-ocean-mist/10">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-[var(--space-lg)]"
        >
          <h2 className="h2 text-dune mb-4">
            What are you looking for?
          </h2>
          <p className="body-lg text-dune/70">
            Choose your service category to explore what we offer
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {quizOptions.map((option, index) => (
            <motion.a
              key={option.id}
              href={option.link}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onMouseEnter={() => setSelectedOption(option.id)}
              onMouseLeave={() => setSelectedOption(null)}
              className="group relative overflow-hidden arch-full cursor-pointer"
            >
              {/* Image */}
              <div className="relative aspect-[3/4]">
                <Image
                  src={option.image}
                  alt={option.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-dune/80 via-dune/40 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <motion.div
                  animate={{
                    y: selectedOption === option.id ? -10 : 0
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-3xl font-light mb-2">{option.title}</h3>
                  <p className="caption text-cream/80">{option.description}</p>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{
                      opacity: selectedOption === option.id ? 1 : 0,
                      x: selectedOption === option.id ? 0 : -10
                    }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 flex items-center gap-2"
                  >
                    <span className="text-sm">Explore</span>
                    <span>→</span>
                  </motion.div>
                </motion.div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
