'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'
import { ArchShape } from '../icons/DesertIcons'

const galleryImages = [
  { id: 1, src: '/lashpop-images/gallery/gallery-img-3961.jpeg', category: 'classic' },
  { id: 2, src: '/lashpop-images/gallery/gallery-img-3962.jpeg', category: 'hybrid' },
  { id: 3, src: '/lashpop-images/gallery/gallery-img-3973.jpeg', category: 'volume' },
  { id: 4, src: '/lashpop-images/gallery/lash-92.jpeg', category: 'classic' },
  { id: 5, src: '/lashpop-images/gallery/lash-102.jpeg', category: 'hybrid' },
  { id: 6, src: '/lashpop-images/gallery/gallery-lash-40.jpeg', category: 'lift' }
]

export function GallerySection() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  
  return (
    <section className="py-[var(--space-xl)] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full">
        <ArchShape className="w-full h-32 text-sage" fill="rgba(161,151,129,0.05)" />
      </div>
      
      <div className="container relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-[var(--space-lg)]"
        >
          <span className="caption text-golden">Gallery</span>
          <h2 className="h2 text-dune mt-2">
            Transformations in harmony
          </h2>
        </motion.div>
        
        {/* Minimal Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {galleryImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedImage(image.id)}
              className="group cursor-pointer"
            >
              <div className={`
                relative overflow-hidden
                ${index === 0 ? 'aspect-[3/4] md:row-span-2' : 'aspect-square'}
                ${index === 2 ? 'rounded-[100px_100px_0_0]' : ''}
                ${index === 4 ? 'rounded-[0_0_100px_100px]' : ''}
                ${index % 2 === 0 ? 'arch-full' : ''}
              `}>
                <Image
                  src={image.src}
                  alt={`Lash transformation ${image.id}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dune/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Instagram CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mt-[var(--space-lg)]"
        >
          <p className="body-lg text-dune/70 mb-6">
            Follow our journey
          </p>
          <button className="btn btn-secondary">
            @lashpopstudios
          </button>
        </motion.div>
      </div>
      
      {/* Lightbox */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-dune/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="relative max-w-4xl w-full arch-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[4/3]">
              <Image
                src={galleryImages.find(img => img.id === selectedImage)?.src || ''}
                alt="Lash detail"
                fill
                className="object-cover"
              />
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-cream/80 flex items-center justify-center"
            >
              ✕
            </button>
          </motion.div>
        </motion.div>
      )}
    </section>
  )
}