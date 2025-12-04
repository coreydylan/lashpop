'use client'

import { motion } from 'framer-motion'

interface PriceDisplayProps {
  priceStarting: number
  duration?: number
  showStartingFrom?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PriceDisplay({
  priceStarting,
  duration,
  showStartingFrom = true,
  size = 'md',
  className = ''
}: PriceDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  }

  return (
    <div className={`flex items-baseline gap-1 ${className}`}>
      {showStartingFrom && (
        <span className="text-xs text-dune/60">from</span>
      )}
      <span className={`font-semibold text-dune ${sizeClasses[size]}`}>
        ${priceStarting}
      </span>
      {duration && (
        <span className="text-xs text-dune/50">
          / {duration}min
        </span>
      )}
    </div>
  )
}
