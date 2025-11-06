'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'

export function PhotoTransition() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], [100, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0.6])

  return (
    <section ref={containerRef} className="relative h-[60vh] overflow-hidden bg-dune">
      <motion.div
        style={{ y, opacity }}
        className="relative w-full h-full"
      >
        <Image
          src="/lashpop-images/98F821AD-E77C-49E9-A73E-C95EC2622413_1_105_c.jpeg"
          alt="LashPop Work"
          fill
          className="object-cover"
          quality={90}
        />
        <div className="absolute inset-0 bg-dune/20" />
      </motion.div>
    </section>
  )
}
