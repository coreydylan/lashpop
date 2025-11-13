/**
 * ArchwayTransition - Grid stays fixed underneath, hero dissolves away
 *
 * The grid is always there. The hero (with archway cut out) sits on top
 * and fades away as you scroll, revealing the grid that was underneath.
 */

'use client'

import { motion, MotionValue, useTransform } from 'framer-motion'
import { ReactNode } from 'react'

interface ArchwayTransitionProps {
  scrollYProgress: MotionValue<number>
  children: ReactNode
}

export function ArchwayTransition({ scrollYProgress, children }: ArchwayTransitionProps) {
  // Grid stays completely fixed - no animation on the grid itself
  // The hero surface above it will fade away

  return (
    <div className="fixed inset-0 w-full h-screen" style={{ zIndex: 1 }}>
      {children}
    </div>
  )
}
