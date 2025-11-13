"use client"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lightbulb } from 'lucide-react'

export interface TutorialTooltipProps {
  show: boolean
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  targetElement?: HTMLElement | null
  onComplete: () => void
  onDismiss: () => void
}

export function TutorialTooltip({
  show,
  title,
  description,
  position = 'bottom',
  targetElement,
  onComplete,
  onDismiss,
}: TutorialTooltipProps) {
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const [arrowPosition, setArrowPosition] = useState<'top' | 'bottom' | 'left' | 'right'>(position)

  useEffect(() => {
    if (!show || !targetElement) return

    const updatePosition = () => {
      const rect = targetElement.getBoundingClientRect()
      const tooltipWidth = 320
      const tooltipHeight = 160
      const padding = 16
      const arrowSize = 12

      let top = 0
      let left = 0
      let finalPosition = position

      switch (position) {
        case 'bottom':
          top = rect.bottom + arrowSize + padding
          left = rect.left + rect.width / 2 - tooltipWidth / 2
          // Check if tooltip goes off screen
          if (top + tooltipHeight > window.innerHeight) {
            // Flip to top
            top = rect.top - tooltipHeight - arrowSize - padding
            finalPosition = 'top'
          }
          break
        case 'top':
          top = rect.top - tooltipHeight - arrowSize - padding
          left = rect.left + rect.width / 2 - tooltipWidth / 2
          // Check if tooltip goes off screen
          if (top < 0) {
            // Flip to bottom
            top = rect.bottom + arrowSize + padding
            finalPosition = 'bottom'
          }
          break
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2
          left = rect.left - tooltipWidth - arrowSize - padding
          if (left < 0) {
            // Flip to right
            left = rect.right + arrowSize + padding
            finalPosition = 'right'
          }
          break
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2
          left = rect.right + arrowSize + padding
          if (left + tooltipWidth > window.innerWidth) {
            // Flip to left
            left = rect.left - tooltipWidth - arrowSize - padding
            finalPosition = 'left'
          }
          break
      }

      // Ensure tooltip stays within viewport horizontally
      if (left < padding) left = padding
      if (left + tooltipWidth > window.innerWidth - padding) {
        left = window.innerWidth - tooltipWidth - padding
      }

      // Ensure tooltip stays within viewport vertically
      if (top < padding) top = padding
      if (top + tooltipHeight > window.innerHeight - padding) {
        top = window.innerHeight - tooltipHeight - padding
      }

      setCoords({ top, left })
      setArrowPosition(finalPosition)
    }

    updatePosition()

    // Update on scroll and resize
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [show, targetElement, position])

  if (!show) return null

  const arrowStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-transparent border-b-cream',
    bottom: 'top-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-transparent border-t-cream',
    left: 'right-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-transparent border-r-cream',
    right: 'left-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-transparent border-l-cream',
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[2px]"
            onClick={onDismiss}
          />
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed z-[9999] w-80"
            style={{ top: coords.top, left: coords.left }}
          >
            {/* Arrow */}
            <div className={`absolute w-0 h-0 ${arrowStyles[arrowPosition]}`} />

            {/* Tooltip content */}
            <div className="bg-cream rounded-2xl shadow-2xl border border-sage/20 p-5 relative">
              {/* Close button */}
              <button
                onClick={onDismiss}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-sage/10 transition-colors"
                aria-label="Dismiss tutorial"
              >
                <X className="w-4 h-4 text-sage" />
              </button>

              {/* Icon */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-dusty-rose/20 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-4 h-4 text-dusty-rose" />
                </div>
                <h3 className="text-lg font-semibold text-dune pr-6">{title}</h3>
              </div>

              {/* Description */}
              <p className="text-sm text-dune/70 leading-relaxed mb-4">{description}</p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={onComplete}
                  className="flex-1 px-4 py-2 rounded-full bg-dusty-rose text-cream text-sm font-medium hover:bg-terracotta transition-colors"
                >
                  Got it!
                </button>
                <button
                  onClick={onDismiss}
                  className="px-4 py-2 rounded-full border border-sage/30 text-sage text-sm font-medium hover:bg-sage/10 transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
