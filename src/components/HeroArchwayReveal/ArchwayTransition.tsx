/**
 * ArchwayTransition - Handles the archway expansion animation
 *
 * Creates a mask that starts as an archway shape and expands to full screen
 * as the user scrolls, revealing the photo grid underneath.
 */

'use client'

import { motion, MotionValue, useTransform } from 'framer-motion'
import { ReactNode } from 'react'

interface ArchwayTransitionProps {
  scrollYProgress: MotionValue<number>
  children: ReactNode
}

export function ArchwayTransition({ scrollYProgress, children }: ArchwayTransitionProps) {
  // Archway starts rounded at top, expands to full screen
  const borderTopLeftRadius = useTransform(
    scrollYProgress,
    [0.2, 0.4],
    ['200px', '0px']
  )

  const borderTopRightRadius = useTransform(
    scrollYProgress,
    [0.2, 0.4],
    ['200px', '0px']
  )

  // Scale from archway size to full screen
  const scale = useTransform(
    scrollYProgress,
    [0.2, 0.4],
    [0.85, 1.0]
  )

  // Position adjustment as it expands
  const y = useTransform(
    scrollYProgress,
    [0.2, 0.4],
    ['10vh', '0vh']
  )

  return (
    <motion.div
      className="fixed inset-0 w-full h-screen overflow-hidden"
      style={{
        borderTopLeftRadius,
        borderTopRightRadius,
        scale,
        y,
        zIndex: 1,
      }}
    >
      {children}
    </motion.div>
  )
}
