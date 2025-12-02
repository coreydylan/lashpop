'use client'

import { useEffect, useRef, useCallback } from 'react'
import { gsap, initGSAPSync } from '@/lib/gsap'

// Per-section snap configuration
export interface SectionSnapConfig {
  threshold: number      // 0-1, how sensitive (higher = more likely to snap)
  anchorOffset: number   // Pixels from top of viewport where section anchors (0 = top, negative = higher up)
  disableSnap?: boolean  // If true, section is excluded from global snap system entirely
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
// More sensitive thresholds (0.7+) = more likely to snap
const getDefaultSectionConfigs = (): Record<string, SectionSnapConfig> => {
  // targetY = section.offsetTop - anchorOffset
  // Higher anchorOffset = scroll LESS = section top appears LOWER on viewport
  // Lower anchorOffset = scroll MORE = section top goes UP/off screen
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  // Get mobile header height from CSS variable (with fallback)
  const headerHeight = typeof window !== 'undefined'
    ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mobile-header-height') || '44')
    : 44

  return {
    // Hero: snap to top of section (no offset needed)
    'hero': { threshold: 0.7, anchorOffset: 0 },

    // Hero-buttons: soft snap when scrolling past initial hero
    // Positions the "welcome to LashPop" title near top, buttons centered
    'hero-buttons': { threshold: 0.3, anchorOffset: vh * 0.35, disableSnap: true },

    // Welcome: strong snap to lock LP logo + cards centered in viewport
    // Higher offset pulls content down into center view
    'welcome': { threshold: 0.7, anchorOffset: vh * 0.15 },

    // Founder letter: position for comfortable reading
    'founder': { threshold: 0.7, anchorOffset: vh * 0.10 },

    // Team: higher threshold, moderate offset for card visibility
    'team': { threshold: 0.7, anchorOffset: vh * 0.12 },

    // Instagram: gallery section - position header and "Follow" button visible
    'instagram': { threshold: 0.65, anchorOffset: vh * 0.08 },

    // Reviews: position so review stats and first card are clearly visible
    'reviews': { threshold: 0.65, anchorOffset: vh * 0.10 },

    // FAQ: disabled from global snap - uses its own IntersectionObserver entry snap
    'faq': { threshold: 0.5, anchorOffset: headerHeight, disableSnap: true },

    // Map: snap with small offset so map + card visible
    'map': { threshold: 0.7, anchorOffset: vh * 0.05 },

    // Footer: add config so it can snap
    'footer': { threshold: 0.5, anchorOffset: 0 },
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
  const isSnappingRef = useRef(false)
  const containerRef = useRef<HTMLElement | null>(null)
  const snapCooldownRef = useRef(false) // Prevent immediate re-snap after a snap completes
  const heroAwardExpandedRef = useRef(false) // Track if hero award badge is expanded

  // Merge default configs with custom configs
  const mergedConfigs = { ...getDefaultSectionConfigs(), ...sectionConfigs }

  // Get config for a section
  const getConfigForSection = useCallback((section: HTMLElement) => {
    const sectionId = section.getAttribute('data-section-id') || ''
    const config = mergedConfigs[sectionId]
    let anchorOffset = config?.anchorOffset ?? 0

    // Dynamic offset for hero-buttons when award badge is expanded
    // Scroll up more (larger offset) to show the full badge
    if (sectionId === 'hero-buttons' && heroAwardExpandedRef.current) {
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800
      anchorOffset = vh * 0.18 // Less offset = scroll more = content higher on screen
    }

    return {
      threshold: config?.threshold ?? snapThreshold,
      anchorOffset,
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
    const container = containerRef.current
    if (!section || !container) return

    isSnappingRef.current = true
    currentSectionRef.current = index

    const sectionId = section.getAttribute('data-section-id') || ''
    const config = getConfigForSection(section)

    onSectionChange?.(sectionId, index)

    // Calculate absolute position relative to scroll container
    const sectionRect = section.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const absoluteTop = container.scrollTop + (sectionRect.top - containerRect.top)

    // Calculate target scroll position with anchor offset
    // Positive anchorOffset = don't scroll as far = section appears lower on screen (higher up from bottom)
    const targetY = absoluteTop - config.anchorOffset

    // Use GSAP for buttery smooth scrolling
    gsap.to(container, {
      scrollTo: {
        y: Math.max(0, targetY), // Don't scroll to negative
        autoKill: false
      },
      duration: snapDuration,
      ease: 'power2.out',
      onComplete: () => {
        isSnappingRef.current = false
        dispatchSectionLocked(section)

        // Start cooldown period to prevent immediate re-snap
        // This gives user time to continue scrolling without fighting the snap
        snapCooldownRef.current = true
        setTimeout(() => {
          snapCooldownRef.current = false
        }, 700) // 700ms cooldown after snap completes - longer to prevent bounce-back
      }
    })
  }, [snapDuration, onSectionChange, dispatchSectionLocked, getConfigForSection])

  useEffect(() => {
    if (!enabled) return

    const container = document.querySelector(containerSelector) as HTMLElement
    const sections = Array.from(document.querySelectorAll(sectionSelector)) as HTMLElement[]

    if (!container || sections.length === 0) return

    containerRef.current = container

    // Initialize GSAP (use sync here since this is user-initiated scroll tracking)
    // and we need it ready immediately
    initGSAPSync()

    // Track current section based on scroll position
    // Use getBoundingClientRect for accurate viewport-relative positions
    let lastReportedSection = ''

    const updateCurrentSection = () => {
      if (isSnappingRef.current) return

      const viewportHeight = window.innerHeight
      const viewportCenter = viewportHeight / 2

      // Find which section contains the viewport center
      let activeIndex = 0
      let activeSection = sections[0]

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i]
        const rect = section.getBoundingClientRect()

        // If viewport center is within this section, it's the active one
        if (rect.top <= viewportCenter && rect.bottom > viewportCenter) {
          activeIndex = i
          activeSection = section
          break
        }

        // If section top is above viewport center, it's a candidate
        if (rect.top <= viewportCenter) {
          activeIndex = i
          activeSection = section
        }
      }

      const sectionId = activeSection?.getAttribute('data-section-id') || ''

      // Only fire callback if section actually changed (prevents flashing)
      if (sectionId !== lastReportedSection) {
        lastReportedSection = sectionId
        currentSectionRef.current = activeIndex
        onSectionChange?.(sectionId, activeIndex)
      }
    }

    // Debounced snap check - only snap when user stops scrolling
    let scrollEndTimer: NodeJS.Timeout | null = null
    let lastScrollY = container.scrollTop
    let scrollVelocity = 0
    let lastScrollTime = Date.now()

    // Helper to get absolute scroll position for a section (relative to scroll container)
    const getAbsoluteTop = (section: HTMLElement): number => {
      const rect = section.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      return container.scrollTop + (rect.top - containerRect.top)
    }

    const checkForSnap = () => {
      // Don't snap if already snapping or in cooldown period
      if (isSnappingRef.current || snapCooldownRef.current) return

      const scrollTop = container.scrollTop
      const viewportHeight = window.innerHeight

      // First, check if user is currently scrolled within a disableSnap section
      // If so, don't do any snapping - let that section handle itself
      for (const section of sections) {
        const config = getConfigForSection(section)
        if (config.disableSnap) {
          const rect = section.getBoundingClientRect()
          // User is within this disableSnap section (section visible in viewport)
          if (rect.top < viewportHeight * 0.6 && rect.bottom > viewportHeight * 0.4) {
            return
          }
        }
      }

      // Find which section we're closest to (considering anchor offsets)
      // SKIP sections with disableSnap - they handle their own snap logic
      let closestIndex = -1
      let closestDistance = Infinity

      sections.forEach((section, index) => {
        const config = getConfigForSection(section)

        // Skip sections that handle their own snapping (e.g., FAQ)
        if (config.disableSnap) return

        const sectionTop = getAbsoluteTop(section)

        // The "ideal" scroll position for this section (where it would be anchored)
        const idealScrollPos = sectionTop - config.anchorOffset

        // Distance from current scroll to ideal position
        const distance = Math.abs(scrollTop - idealScrollPos)

        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      // No valid snap target found
      if (closestIndex === -1) return

      const targetSection = sections[closestIndex]
      if (!targetSection) return

      const config = getConfigForSection(targetSection)
      const idealScrollPos = getAbsoluteTop(targetSection) - config.anchorOffset

      // Calculate how far we are from the snap point
      const distanceFromSnapPoint = Math.abs(scrollTop - idealScrollPos)
      const thresholdPx = viewportHeight * config.threshold

      // Only snap if we're within the threshold AND scroll velocity is low
      // Lower velocity threshold = only snap when scroll has nearly stopped
      // This prevents the "fighting" sensation when trying to scroll past a section
      if (distanceFromSnapPoint < thresholdPx && distanceFromSnapPoint > 5 && Math.abs(scrollVelocity) < 0.4) {
        snapToSection(closestIndex, sections)
      } else if (distanceFromSnapPoint <= 5) {
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

      // Update current section indicator (throttled by the callback itself)
      updateCurrentSection()

      // Clear existing timer
      if (scrollEndTimer) {
        clearTimeout(scrollEndTimer)
      }

      // Check for snap after scrolling stops
      // 180ms delay gives user time to continue scrolling without interruption
      // but still feels responsive when they actually stop
      scrollEndTimer = setTimeout(checkForSnap, 180)
    }

    // Handle touch end for more responsive snapping on mobile
    const handleTouchEnd = () => {
      // Slightly longer delay after touch to let momentum settle
      if (scrollEndTimer) {
        clearTimeout(scrollEndTimer)
      }
      scrollEndTimer = setTimeout(checkForSnap, 200)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    // Listen for hero award badge toggle
    const handleAwardToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ expanded: boolean }>
      heroAwardExpandedRef.current = customEvent.detail.expanded
    }
    window.addEventListener('hero-award-toggle', handleAwardToggle)

    // Initial section detection
    setTimeout(() => {
      updateCurrentSection()
    }, 100)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      container.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('hero-award-toggle', handleAwardToggle)
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
