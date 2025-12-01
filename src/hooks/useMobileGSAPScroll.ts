'use client'

import { useEffect, useRef, useCallback } from 'react'
import { gsap, ScrollTrigger, initGSAP, isGSAPInitialized, initGSAPSync } from '@/lib/gsap'

// Event name for FAQ interaction changes
const FAQ_INTERACTION_EVENT = 'faq-interaction-change'

// Per-section snap configuration
export interface SectionSnapConfig {
  threshold: number      // 0-1, how sensitive (higher = more likely to snap)
  anchorOffset: number   // Pixels from top of viewport where section anchors (0 = top, negative = higher up)
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
  const headerHeight = 44 // Mobile header height

  return {
    // Hero: snap to top of section (no offset needed)
    'hero': { threshold: 0.7, anchorOffset: 0 },

    // Welcome: position content comfortably in view
    'welcome': { threshold: 0.7, anchorOffset: vh * 0.12 },

    // Founder letter: position for comfortable reading
    'founder': { threshold: 0.7, anchorOffset: vh * 0.10 },

    // Team, Instagram, Reviews: position with header visible
    'team': { threshold: 0.7, anchorOffset: headerHeight + 10 },
    'instagram': { threshold: 0.7, anchorOffset: headerHeight + 10 },
    'reviews': { threshold: 0.7, anchorOffset: headerHeight + 10 },

    // FAQ: snap so tag selector docks right below mobile header (44px)
    'faq': { threshold: 0.7, anchorOffset: headerHeight },

    // Map: snap to top so full viewport map + card is visible
    'map': { threshold: 0.7, anchorOffset: 0 },

    // Footer: snap to show footer content
    'footer': { threshold: 0.6, anchorOffset: 0 },
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
  const scrollTriggersRef = useRef<ScrollTrigger[]>([])
  const containerRef = useRef<HTMLElement | null>(null)
  const faqInteractingRef = useRef(false)

  // Listen for FAQ interaction state changes
  useEffect(() => {
    const handleFAQInteraction = (e: Event) => {
      const customEvent = e as CustomEvent<{ isInteracting: boolean }>
      faqInteractingRef.current = customEvent.detail?.isInteracting ?? false
    }

    window.addEventListener(FAQ_INTERACTION_EVENT, handleFAQInteraction)
    return () => window.removeEventListener(FAQ_INTERACTION_EVENT, handleFAQInteraction)
  }, [])

  // Merge default configs with custom configs
  const mergedConfigs = { ...getDefaultSectionConfigs(), ...sectionConfigs }

  // Get config for a section
  const getConfigForSection = useCallback((section: HTMLElement) => {
    const sectionId = section.getAttribute('data-section-id') || ''
    const config = mergedConfigs[sectionId]
    return {
      threshold: config?.threshold ?? snapThreshold,
      anchorOffset: config?.anchorOffset ?? 0
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

    // Create ScrollTrigger for each section to track which is active
    sections.forEach((section, index) => {
      const st = ScrollTrigger.create({
        trigger: section,
        scroller: container,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => {
          if (!isSnappingRef.current) {
            currentSectionRef.current = index
            const sectionId = section.getAttribute('data-section-id') || ''
            onSectionChange?.(sectionId, index)
          }
        },
        onEnterBack: () => {
          if (!isSnappingRef.current) {
            currentSectionRef.current = index
            const sectionId = section.getAttribute('data-section-id') || ''
            onSectionChange?.(sectionId, index)
          }
        }
      })
      scrollTriggersRef.current.push(st)
    })

    // Debounced snap check - only snap when user stops scrolling
    let scrollEndTimer: NodeJS.Timeout | null = null
    let lastScrollY = container.scrollTop
    let scrollVelocity = 0
    let lastScrollTime = Date.now()

    const checkForSnap = () => {
      if (isSnappingRef.current) return

      const scrollTop = container.scrollTop
      const viewportHeight = window.innerHeight

      // Find which section we're closest to (considering anchor offsets)
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

      const targetSectionId = targetSection.getAttribute('data-section-id') || ''

      // Skip snapping for FAQ section when user is interacting with it
      if (targetSectionId === 'faq' && faqInteractingRef.current) {
        // Still update section tracking, just don't auto-snap
        currentSectionRef.current = closestIndex
        return
      }

      const config = getConfigForSection(targetSection)
      const idealScrollPos = targetSection.offsetTop - config.anchorOffset

      // Calculate how far we are from the snap point
      const distanceFromSnapPoint = Math.abs(scrollTop - idealScrollPos)
      const thresholdPx = viewportHeight * config.threshold

      // Only snap if we're within the threshold AND scroll velocity is low
      if (distanceFromSnapPoint < thresholdPx && distanceFromSnapPoint > 5 && Math.abs(scrollVelocity) < 2) {
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

      // Clear existing timer
      if (scrollEndTimer) {
        clearTimeout(scrollEndTimer)
      }

      // Check for snap after scrolling stops - reduced delay for more responsive snapping
      scrollEndTimer = setTimeout(checkForSnap, 100)
    }

    // Handle touch end for more responsive snapping on mobile
    const handleTouchEnd = () => {
      // Reduced delay for more responsive snapping after touch
      if (scrollEndTimer) {
        clearTimeout(scrollEndTimer)
      }
      scrollEndTimer = setTimeout(checkForSnap, 120)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    // Initial section detection
    setTimeout(() => {
      const scrollTop = container.scrollTop
      sections.forEach((section, index) => {
        const sectionTop = section.offsetTop
        const sectionBottom = sectionTop + section.offsetHeight
        if (scrollTop >= sectionTop && scrollTop < sectionBottom) {
          currentSectionRef.current = index
          const sectionId = section.getAttribute('data-section-id') || ''
          onSectionChange?.(sectionId, index)
        }
      })
    }, 100)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      container.removeEventListener('touchend', handleTouchEnd)
      if (scrollEndTimer) {
        clearTimeout(scrollEndTimer)
      }
      scrollTriggersRef.current.forEach(st => st.kill())
      scrollTriggersRef.current = []
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
