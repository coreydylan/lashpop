'use client'

import { useEffect, useRef, useCallback } from 'react'
import { gsap, initGSAPSync } from '@/lib/gsap'

// Event name for FAQ interaction changes
const FAQ_INTERACTION_EVENT = 'faq-interaction-change'

// Event name to signal programmatic scroll (should not trigger snap)
export const PROGRAMMATIC_SCROLL_EVENT = 'programmatic-scroll'

// Per-section snap configuration
export interface SectionSnapConfig {
  threshold: number      // 0-1, how sensitive (higher = more likely to snap)
  anchorOffset: number   // Pixels from top of viewport where section anchors (0 = top, negative = higher up)
  disableSnap?: boolean  // If true, don't auto-snap to this section
}

interface UseMobileGSAPScrollOptions {
  enabled: boolean
  sectionSelector: string
  containerSelector: string
  snapThreshold?: number       // Default threshold for sections without custom config
  snapDuration?: number        // Duration of snap animation
  sectionConfigs?: Record<string, SectionSnapConfig>  // Per-section overrides by data-section-id
  onSectionChange?: (sectionId: string, index: number) => void
}

// Get default config for ALL sections (computed at runtime to avoid SSR issues)
const getDefaultSectionConfigs = (): Record<string, SectionSnapConfig> => {
  // targetY = section.offsetTop - anchorOffset
  // Higher anchorOffset = scroll LESS = section top appears LOWER on viewport
  // Lower anchorOffset = scroll MORE = section top goes UP/off screen
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const headerHeight = 44 // Mobile header height

  return {
    // Hero: snap to top of section (no offset needed)
    'hero': { threshold: 0.5, anchorOffset: 0 },

    // Welcome: position content comfortably in view
    'welcome': { threshold: 0.5, anchorOffset: vh * 0.12 },

    // Founder letter: position for comfortable reading
    'founder': { threshold: 0.5, anchorOffset: vh * 0.10 },

    // Team, Instagram, Reviews: position with header visible
    'team': { threshold: 0.5, anchorOffset: headerHeight + 10 },
    'instagram': { threshold: 0.5, anchorOffset: headerHeight + 10 },
    'reviews': { threshold: 0.5, anchorOffset: headerHeight + 10 },

    // FAQ: DISABLE auto-snap - let user scroll freely within FAQ content
    // Section tracking still works, just no forced snap
    'faq': { threshold: 0.3, anchorOffset: 12, disableSnap: true },

    // Map: snap to top so full viewport map + card is visible
    'map': { threshold: 0.5, anchorOffset: 0 },

    // Footer: snap to show footer content
    'footer': { threshold: 0.4, anchorOffset: 0 },
  }
}

export function useMobileGSAPScroll({
  enabled,
  sectionSelector,
  containerSelector,
  snapThreshold = 0.4,
  snapDuration = 0.4,
  sectionConfigs = {},
  onSectionChange
}: UseMobileGSAPScrollOptions) {
  const currentSectionRef = useRef<number>(0)
  const currentSectionIdRef = useRef<string>('')
  const isSnappingRef = useRef(false)
  const containerRef = useRef<HTMLElement | null>(null)
  const faqInteractingRef = useRef(false)
  const programmaticScrollRef = useRef(false)
  const programmaticScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Listen for FAQ interaction state changes
  useEffect(() => {
    const handleFAQInteraction = (e: Event) => {
      const customEvent = e as CustomEvent<{ isInteracting: boolean }>
      faqInteractingRef.current = customEvent.detail?.isInteracting ?? false
    }

    window.addEventListener(FAQ_INTERACTION_EVENT, handleFAQInteraction)
    return () => window.removeEventListener(FAQ_INTERACTION_EVENT, handleFAQInteraction)
  }, [])

  // Listen for programmatic scroll signals (from FAQ, etc.)
  useEffect(() => {
    const handleProgrammaticScroll = () => {
      programmaticScrollRef.current = true
      // Clear any existing timeout
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current)
      }
      // Reset after 500ms - enough time for smooth scroll to complete
      programmaticScrollTimeoutRef.current = setTimeout(() => {
        programmaticScrollRef.current = false
      }, 500)
    }

    window.addEventListener(PROGRAMMATIC_SCROLL_EVENT, handleProgrammaticScroll)
    return () => {
      window.removeEventListener(PROGRAMMATIC_SCROLL_EVENT, handleProgrammaticScroll)
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current)
      }
    }
  }, [])

  // Merge default configs with custom configs
  const mergedConfigs = { ...getDefaultSectionConfigs(), ...sectionConfigs }

  // Get config for a section
  const getConfigForSection = useCallback((section: HTMLElement) => {
    const sectionId = section.getAttribute('data-section-id') || ''
    const config = mergedConfigs[sectionId]
    return {
      threshold: config?.threshold ?? snapThreshold,
      anchorOffset: config?.anchorOffset ?? 0,
      disableSnap: config?.disableSnap ?? false
    }
  }, [mergedConfigs, snapThreshold])

  // Dispatch section-locked event for backwards compatibility
  const dispatchSectionLocked = useCallback((section: HTMLElement) => {
    section.dispatchEvent(new CustomEvent('section-locked', {
      bubbles: true,
      detail: { sectionId: section.getAttribute('data-section-id') }
    }))
  }, [])

  // Smooth snap to a section with custom anchor offset
  const snapToSection = useCallback((index: number, sections: HTMLElement[]) => {
    if (index < 0 || index >= sections.length || isSnappingRef.current) return

    const section = sections[index]
    if (!section || !containerRef.current) return

    isSnappingRef.current = true
    currentSectionRef.current = index

    const sectionId = section.getAttribute('data-section-id') || ''
    const config = getConfigForSection(section)

    onSectionChange?.(sectionId, index)

    // Calculate target scroll position with anchor offset
    // Positive anchorOffset = don't scroll as far = section appears lower on screen (higher up from bottom)
    const targetY = section.offsetTop - config.anchorOffset

    // Use GSAP for buttery smooth scrolling
    gsap.to(containerRef.current, {
      scrollTo: {
        y: Math.max(0, targetY), // Don't scroll to negative
        autoKill: false
      },
      duration: snapDuration,
      ease: 'power2.out',
      onComplete: () => {
        isSnappingRef.current = false
        dispatchSectionLocked(section)
      }
    })
  }, [snapDuration, onSectionChange, dispatchSectionLocked, getConfigForSection])

  useEffect(() => {
    if (!enabled) return

    const container = document.querySelector(containerSelector) as HTMLElement
    const sections = Array.from(document.querySelectorAll(sectionSelector)) as HTMLElement[]

    if (!container || sections.length === 0) return

    containerRef.current = container

    // Clear any existing ScrollTriggers from previous renders
    scrollTriggersRef.current.forEach(st => st.kill())
    scrollTriggersRef.current = []

    // Initialize GSAP (use sync here since this is user-initiated scroll tracking)
    // and we need it ready immediately
    initGSAPSync()

    // Helper function to detect current section based on scroll position
    const detectCurrentSection = () => {
      const scrollTop = container.scrollTop
      const viewportCenter = scrollTop + window.innerHeight / 2

      // Find which section the viewport center is in
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        const sectionTop = section.offsetTop
        if (viewportCenter >= sectionTop) {
          const sectionId = section.getAttribute('data-section-id') || ''
          if (currentSectionIdRef.current !== sectionId) {
            currentSectionIdRef.current = sectionId
            currentSectionRef.current = i
            onSectionChange?.(sectionId, i)
          }
          return
        }
      }
    }

    // Debounced snap check - only snap when user stops scrolling
    let scrollEndTimer: NodeJS.Timeout | null = null
    let lastScrollY = container.scrollTop
    let scrollVelocity = 0
    let lastScrollTime = Date.now()

    const checkForSnap = () => {
      // Skip if currently snapping or during programmatic scroll
      if (isSnappingRef.current || programmaticScrollRef.current) return

      // Skip all snapping when user is interacting with FAQ
      if (faqInteractingRef.current) return

      const scrollTop = container.scrollTop
      const viewportHeight = window.innerHeight

      // Find which section we're closest to for potential snapping
      let closestIndex = 0
      let closestDistance = Infinity

      sections.forEach((section, index) => {
        const config = getConfigForSection(section)
        const sectionTop = section.offsetTop

        // The "ideal" scroll position for this section (where it would be anchored)
        const idealScrollPos = sectionTop - config.anchorOffset

        // Distance from current scroll to ideal position
        const distance = Math.abs(scrollTop - idealScrollPos)

        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      const targetSection = sections[closestIndex]
      if (!targetSection) return

      const config = getConfigForSection(targetSection)

      // Skip snapping if this section has snap disabled
      if (config.disableSnap) return

      const idealScrollPos = targetSection.offsetTop - config.anchorOffset

      // Calculate how far we are from the snap point
      const distanceFromSnapPoint = Math.abs(scrollTop - idealScrollPos)
      const thresholdPx = viewportHeight * config.threshold

      // Only snap if we're within the threshold AND scroll velocity is low
      // Use higher velocity threshold to only snap when truly stopped
      if (distanceFromSnapPoint < thresholdPx && distanceFromSnapPoint > 10 && Math.abs(scrollVelocity) < 0.5) {
        snapToSection(closestIndex, sections)
      } else if (distanceFromSnapPoint <= 10) {
        // Already at snap point, just dispatch event
        currentSectionRef.current = closestIndex
        dispatchSectionLocked(targetSection)
      }
    }

    const handleScroll = () => {
      const now = Date.now()
      const currentScrollY = container.scrollTop
      const timeDelta = now - lastScrollTime

      // Calculate scroll velocity (pixels per ms)
      if (timeDelta > 0) {
        scrollVelocity = (currentScrollY - lastScrollY) / timeDelta
      }

      lastScrollY = currentScrollY
      lastScrollTime = now

      // Update section tracking on every scroll (throttled by ref check in detectCurrentSection)
      detectCurrentSection()

      // Clear existing timer
      if (scrollEndTimer) {
        clearTimeout(scrollEndTimer)
      }

      // Check for snap after scrolling stops
      // Use longer delay to avoid snap during continuous scrolling
      scrollEndTimer = setTimeout(checkForSnap, 200)
    }

    // Handle touch end for snapping on mobile
    const handleTouchEnd = () => {
      if (scrollEndTimer) {
        clearTimeout(scrollEndTimer)
      }
      // Use longer delay after touch to let momentum scrolling settle
      scrollEndTimer = setTimeout(checkForSnap, 250)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    // Initial section detection
    setTimeout(detectCurrentSection, 100)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      container.removeEventListener('touchend', handleTouchEnd)
      if (scrollEndTimer) {
        clearTimeout(scrollEndTimer)
      }
    }
  }, [enabled, sectionSelector, containerSelector, snapThreshold, snapToSection, onSectionChange, dispatchSectionLocked, getConfigForSection])

  return {
    currentSection: currentSectionRef.current,
    snapToSection: (index: number) => {
      const sections = Array.from(document.querySelectorAll(sectionSelector)) as HTMLElement[]
      snapToSection(index, sections)
    }
  }
}
