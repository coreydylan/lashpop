'use client'

import { useEffect, useRef, useState } from 'react'
import { usePanelStack } from '@/contexts/PanelStackContext'

export function ScrollServicesTrigger() {
  const triggerRef = useRef<HTMLDivElement>(null)
  const { actions: panelActions, state } = usePanelStack()
  const [hasTriggered, setHasTriggered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Use refs to avoid re-running effects when state changes
  const stateRef = useRef(state)
  const hasTriggeredRef = useRef(hasTriggered)
  
  useEffect(() => {
    stateRef.current = state
  }, [state])
  
  useEffect(() => {
    hasTriggeredRef.current = hasTriggered
  }, [hasTriggered])

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Mobile: Listen for section-locked events on the founder section
  useEffect(() => {
    if (!isMobile) return

    const handleSectionLocked = (event: Event) => {
      const target = event.target as HTMLElement
      const sectionId = target.getAttribute('data-section-id')

      // Trigger when we land on the founder section (which comes after welcome)
      if (sectionId === 'founder' && !hasTriggeredRef.current) {
        const currentState = stateRef.current
        const isPanelOpen = currentState.panels.some(p => p.type === 'category-picker' && p.state !== 'closed')

        if (!isPanelOpen) {
          panelActions.openPanel(
            'category-picker',
            { entryPoint: 'scroll-trigger-mobile' },
            { scrollToTop: false }
          )
          setHasTriggered(true)
        }
      }
    }

    // Listen for section-locked events on all sections (supports both old and new class names)
    const sections = document.querySelectorAll('.mobile-section, .mobile-snap-section')
    sections.forEach(section => {
      section.addEventListener('section-locked', handleSectionLocked)
    })

    return () => {
      sections.forEach(section => {
        section.removeEventListener('section-locked', handleSectionLocked)
      })
    }
  }, [isMobile, panelActions]) // Removed hasTriggered and state.panels - use refs instead

  // Desktop: Use IntersectionObserver
  useEffect(() => {
    if (isMobile || !triggerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // When the trigger point comes into view and we haven't triggered yet
          if (entry.isIntersecting && !hasTriggeredRef.current) {
            const currentState = stateRef.current
            // Check if panel is not already open
            const isPanelOpen = currentState.panels.some(p => p.type === 'category-picker' && p.state !== 'closed')

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
  }, [isMobile, panelActions]) // Removed hasTriggered and state.panels - use refs instead

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