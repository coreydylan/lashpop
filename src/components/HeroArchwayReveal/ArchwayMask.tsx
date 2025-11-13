/**
 * ArchwayMask - SVG mask that morphs from archway shape to full screen
 */

'use client'

import { motion, MotionValue, useTransform } from 'framer-motion'
import { ARCHWAY_ANIMATION } from './animations'

interface ArchwayMaskProps {
  scrollYProgress: MotionValue<number>
  children: React.ReactNode
}

export function ArchwayMask({ scrollYProgress, children }: ArchwayMaskProps) {
  // Map scroll progress to border radius (archway -> rectangle)
  const borderRadius = useTransform(
    scrollYProgress,
    [0.2, 0.4], // Archway expansion phase
    ['200px 200px 0 0', '0px 0px 0 0']
  )

  // Map scroll progress to scale (expand to fill screen)
  const scale = useTransform(
    scrollYProgress,
    [0.2, 0.4],
    [ARCHWAY_ANIMATION.scale.from, ARCHWAY_ANIMATION.scale.to]
  )

  // Map scroll progress to opacity (fade out hero)
  const opacity = useTransform(
    scrollYProgress,
    [0.0, 0.2, 0.4],
    [1, 1, 0] // Fully visible until 20%, then fade during expansion
  )

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{
        borderRadius,
        scale,
        opacity,
      }}
    >
      {children}
    </motion.div>
  )
}
