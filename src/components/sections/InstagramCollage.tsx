'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useRef } from 'react'

const instagramPosts = [
  { id: 1, image: '/lashpop-images/gallery/gallery-img-3405.jpeg' },
  { id: 2, image: '/lashpop-images/gallery/gallery-img-3961.jpeg' },
  { id: 3, image: '/lashpop-images/gallery/gallery-img-3962.jpeg' },
  { id: 4, image: '/lashpop-images/gallery/gallery-img-3973.jpeg' },
  { id: 5, image: '/lashpop-images/gallery/gallery-img-3974.jpeg' },
  { id: 6, image: '/lashpop-images/gallery/gallery-lash-40.jpeg' },
  { id: 7, image: '/lashpop-images/gallery/lash-102.jpeg' },
  { id: 8, image: '/lashpop-images/gallery/lash-136.jpeg' },
]

export function InstagramCollage() {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <section className="py-[var(--space-lg)] bg-gradient-to-b from-warm-sand/10 to-cream overflow-hidden">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <span className="caption text-terracotta">Follow Us</span>
          <h2 className="h2 text-dune mt-2 mb-4">
            @lashpopstudios
          </h2>
          <p className="body text-dune/70">
            See our latest work and behind-the-scenes moments
          </p>
        </motion.div>

        {/* Horizontal Scrolling Gallery */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {instagramPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="flex-shrink-0 snap-center"
            >
              <a
                href="https://instagram.com/lashpopstudios"
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="relative w-[300px] h-[300px] rounded-2xl overflow-hidden">
                  <Image
                    src={post.image}
                    alt={`Instagram post ${post.id}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-dune/0 group-hover:bg-dune/20 transition-colors duration-300" />
                </div>
              </a>
            </motion.div>
          ))}
        </div>

        {/* Follow CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mt-12"
        >
          <a
            href="https://instagram.com/lashpopstudios"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            Follow on Instagram
          </a>
        </motion.div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}
