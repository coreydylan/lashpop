'use client'

import { motion } from 'framer-motion'

interface SectionRuleProps {
  className?: string
}

export function SectionRule({ className = '' }: SectionRuleProps) {
  return (
    <motion.div
      aria-hidden
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      style={{ transformOrigin: 'center' }}
      className={`w-24 h-px bg-terracotta/30 mx-auto ${className}`}
    />
  )
}
