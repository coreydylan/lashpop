'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'

export function ShopTransition() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 1.1])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0.8])

  return (
    <section ref={containerRef} className="relative h-screen overflow-hidden bg-cream">
      <motion.div
        style={{ scale, opacity }}
        className="relative w-full h-full"
      >
        <Image
          src="/lashpop-images/studio/studio-photos-by-salome.jpg"
          alt="LashPop Studio"
          fill
          className="object-cover"
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cream/20 to-transparent" />
      </motion.div>
    </section>
  )
}
