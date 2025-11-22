'use client'

import { ReactNode, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useInView } from 'framer-motion'

interface SectionTransitionProps {
  children: ReactNode
  className?: string
  // Animation variants
  variant?: 'fade' | 'slideUp' | 'scaleIn' | 'parallax'
  // Timing
  delay?: number
  duration?: number
  // Parallax specific
  parallaxOffset?: number
  // Trigger options
  triggerOnce?: boolean
  triggerMargin?: string
}

export function SectionTransition({
  children,
  className = '',
  variant = 'fade',
  delay = 0,
  duration = 0.8,
  parallaxOffset = 50,
  triggerOnce = true,
  triggerMargin = "-20%"
}: SectionTransitionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once: triggerOnce,
    margin: triggerMargin as any
  })

  // Parallax effect
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
    layoutEffect: false
  } as any)

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [parallaxOffset, -parallaxOffset]
  )

  // Animation variants
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 }
    },
    slideUp: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 }
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 }
    },
    parallax: {
      initial: { opacity: 0 },
      animate: { opacity: 1 }
    }
  }

  const selectedVariant = variants[variant]

  // Use parallax wrapper for parallax variant
  if (variant === 'parallax') {
    return (
      <motion.div
        ref={ref}
        style={{ y }}
        className={className}
        initial={selectedVariant.initial}
        animate={isInView ? selectedVariant.animate : selectedVariant.initial}
        transition={{
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1]
        }}
      >
        {children}
      </motion.div>
    )
  }

  // Standard animation wrapper
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={selectedVariant.initial}
      animate={isInView ? selectedVariant.animate : selectedVariant.initial}
      transition={{
        duration,
        delay,
        ease: [0.23, 1, 0.32, 1]
      }}
    >
      {children}
    </motion.div>
  )
}

// Stagger children animations
export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.1,
  triggerOnce = true,
  triggerMargin = "-20%"
}: {
  children: ReactNode
  className?: string
  staggerDelay?: number
  triggerOnce?: boolean
  triggerMargin?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once: triggerOnce,
    margin: triggerMargin as any
  })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  )
}

// Stagger child item
export function StaggerItem({
  children,
  className = ''
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  )
}