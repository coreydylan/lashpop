'use client'

import { motion } from 'framer-motion'

interface SlideshowIndicatorsProps {
  count: number
  currentIndex: number
  position: 'bottom' | 'bottomLeft' | 'bottomRight' | 'side' | 'hidden'
  style: 'dots' | 'lines' | 'numbers'
  onSelect: (index: number) => void
}

export function SlideshowIndicators({
  count,
  currentIndex,
  position,
  style,
  onSelect
}: SlideshowIndicatorsProps) {
  if (position === 'hidden' || count <= 1) return null

  // Position classes
  const positionClasses: Record<string, string> = {
    bottom: 'absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2',
    bottomLeft: 'absolute bottom-4 left-4 flex gap-2',
    bottomRight: 'absolute bottom-4 right-4 flex gap-2',
    side: 'absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2'
  }

  const containerClass = positionClasses[position] || positionClasses.bottom

  if (style === 'dots') {
    return (
      <div className={containerClass} style={{ zIndex: 10 }}>
        {Array.from({ length: count }).map((_, index) => (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className="group relative p-1"
            aria-label={`Go to slide ${index + 1}`}
          >
            <div
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white scale-125'
                  : 'bg-white/50 group-hover:bg-white/80'
              }`}
            />
            {index === currentIndex && (
              <motion.div
                layoutId="indicator-ring"
                className="absolute inset-0 rounded-full border border-white/80"
                transition={{ duration: 0.2 }}
              />
            )}
          </button>
        ))}
      </div>
    )
  }

  if (style === 'lines') {
    return (
      <div className={containerClass} style={{ zIndex: 10 }}>
        {Array.from({ length: count }).map((_, index) => (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className="group relative"
            aria-label={`Go to slide ${index + 1}`}
          >
            <div
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-4 bg-white/50 group-hover:bg-white/80 group-hover:w-6'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  if (style === 'numbers') {
    return (
      <div className={containerClass} style={{ zIndex: 10 }}>
        <div className="px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm">
          <span className="text-white text-sm font-medium">
            {currentIndex + 1} / {count}
          </span>
        </div>
      </div>
    )
  }

  return null
}
