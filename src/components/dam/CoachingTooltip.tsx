"use client"

import { useEffect, useState, useRef } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import clsx from 'clsx'

interface CoachingTooltipProps {
  message: string
  targetSelector?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  offset?: number
  showArrow?: boolean
  onDismiss?: () => void
}

export function CoachingTooltip({
  message,
  targetSelector,
  position = 'auto',
  offset = 12,
  showArrow = true,
  onDismiss
}: CoachingTooltipProps) {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null)
  const [actualPosition, setActualPosition] = useState(position)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!targetSelector) return

    const updatePosition = () => {
      const target = document.querySelector(targetSelector)
      if (!target || !tooltipRef.current) return

      const targetRect = target.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let finalPosition = position
      let x = 0
      let y = 0

      // Auto-position logic
      if (position === 'auto') {
        // Try positions in order: bottom, top, right, left
        const spaceBelow = viewportHeight - targetRect.bottom
        const spaceAbove = targetRect.top
        const spaceRight = viewportWidth - targetRect.right
        const spaceLeft = targetRect.left

        if (spaceBelow >= tooltipRect.height + offset) {
          finalPosition = 'bottom'
        } else if (spaceAbove >= tooltipRect.height + offset) {
          finalPosition = 'top'
        } else if (spaceRight >= tooltipRect.width + offset) {
          finalPosition = 'right'
        } else if (spaceLeft >= tooltipRect.width + offset) {
          finalPosition = 'left'
        } else {
          finalPosition = 'bottom' // fallback
        }
      }

      // Calculate coordinates based on position
      switch (finalPosition) {
        case 'bottom':
          x = targetRect.left + targetRect.width / 2
          y = targetRect.bottom + offset
          break
        case 'top':
          x = targetRect.left + targetRect.width / 2
          y = targetRect.top - offset
          break
        case 'right':
          x = targetRect.right + offset
          y = targetRect.top + targetRect.height / 2
          break
        case 'left':
          x = targetRect.left - offset
          y = targetRect.top + targetRect.height / 2
          break
      }

      // Keep tooltip within viewport
      const padding = 16
      if (finalPosition === 'bottom' || finalPosition === 'top') {
        // Horizontal adjustment
        const halfWidth = tooltipRect.width / 2
        if (x - halfWidth < padding) {
          x = halfWidth + padding
        } else if (x + halfWidth > viewportWidth - padding) {
          x = viewportWidth - halfWidth - padding
        }
      } else {
        // Vertical adjustment
        const halfHeight = tooltipRect.height / 2
        if (y - halfHeight < padding) {
          y = halfHeight + padding
        } else if (y + halfHeight > viewportHeight - padding) {
          y = viewportHeight - halfHeight - padding
        }
      }

      setActualPosition(finalPosition)
      setCoords({ x, y })
    }

    // Initial position
    updatePosition()

    // Update on scroll/resize
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    // Watch for target element changes
    const observer = new MutationObserver(updatePosition)
    const target = document.querySelector(targetSelector)
    if (target) {
      observer.observe(target, { attributes: true, attributeFilter: ['style', 'class'] })
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
      observer.disconnect()
    }
  }, [targetSelector, position, offset])

  if (!coords) return null

  return (
    <div
      ref={tooltipRef}
      className={clsx(
        'fixed z-[10003] pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300',
        actualPosition === 'bottom' && '-translate-x-1/2',
        actualPosition === 'top' && '-translate-x-1/2 -translate-y-full',
        actualPosition === 'right' && '-translate-y-1/2',
        actualPosition === 'left' && '-translate-x-full -translate-y-1/2'
      )}
      style={{
        left: `${coords.x}px`,
        top: `${coords.y}px`
      }}
    >
      <div className="relative">
        {/* Arrow pointer */}
        {showArrow && (
          <div
            className={clsx(
              'absolute w-3 h-3 bg-dusty-rose transform rotate-45',
              actualPosition === 'bottom' && 'left-1/2 -translate-x-1/2 -top-1.5',
              actualPosition === 'top' && 'left-1/2 -translate-x-1/2 -bottom-1.5',
              actualPosition === 'right' && 'top-1/2 -translate-y-1/2 -left-1.5',
              actualPosition === 'left' && 'top-1/2 -translate-y-1/2 -right-1.5'
            )}
          />
        )}

        {/* Tooltip content */}
        <div className="bg-dusty-rose text-cream px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap pointer-events-auto">
          <Sparkles className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span className="text-sm font-medium">{message}</span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="ml-2 hover:opacity-80 transition-opacity"
              aria-label="Dismiss"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  )
}