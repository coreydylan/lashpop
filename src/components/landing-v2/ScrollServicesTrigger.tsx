'use client'

import { useEffect, useRef, useState } from 'react'
import { usePanelStack } from '@/contexts/PanelStackContext'

export function ScrollServicesTrigger() {
  const triggerRef = useRef<HTMLDivElement>(null)
  const { actions: panelActions, state } = usePanelStack()
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    if (!triggerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // When the trigger point comes into view and we haven't triggered yet
          if (entry.isIntersecting && !hasTriggered) {
            // Check if panel is not already open
            const isPanelOpen = state.panels.some(p => p.type === 'category-picker' && p.state !== 'closed')

            if (!isPanelOpen) {
              // Open the category-picker panel without scrolling to top
              // openPanel(type, data, options)
              panelActions.openPanel(
                'category-picker',
                { entryPoint: 'scroll-trigger' }, // data
                { scrollToTop: false } // options
              )
              setHasTriggered(true)
            }
          }
        })
      },
      {
        threshold: 0.5, // Trigger when 50% visible
        rootMargin: '-100px 0px' // Offset to trigger slightly before fully in view
      }
    )

    observer.observe(triggerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [hasTriggered, panelActions, state.panels])

  // Reset trigger when all panels are closed
  useEffect(() => {
    const allClosed = state.panels.every(p => p.state === 'closed')
    if (allClosed && hasTriggered) {
      // Allow re-triggering if user closes all panels
      setTimeout(() => setHasTriggered(false), 2000)
    }
  }, [state.panels, hasTriggered])

  return (
    <div
      ref={triggerRef}
      id="services-scroll-trigger"
      className="h-1 w-full"
      aria-hidden="true"
    />
  )
}