'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

let initialized = false
let initPromise: Promise<void> | null = null

/**
 * Initialize GSAP plugins once, deferred to avoid blocking initial render.
 * Returns a promise that resolves when initialization is complete.
 */
export function initGSAP(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }

  if (initialized) {
    return Promise.resolve()
  }

  if (initPromise) {
    return initPromise
  }

  initPromise = new Promise((resolve) => {
    // Use requestIdleCallback if available, otherwise setTimeout
    const deferInit = window.requestIdleCallback || ((cb) => setTimeout(cb, 1))

    deferInit(() => {
      if (!initialized) {
        gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)
        initialized = true
      }
      resolve()
    }, { timeout: 100 })
  })

  return initPromise
}

/**
 * Synchronous initialization for cases where GSAP must be ready immediately.
 * Use sparingly - prefer initGSAP() for better performance.
 */
export function initGSAPSync(): void {
  if (typeof window === 'undefined') return
  if (initialized) return

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)
  initialized = true
}

/**
 * Check if GSAP has been initialized
 */
export function isGSAPInitialized(): boolean {
  return initialized
}

export { gsap, ScrollTrigger, ScrollToPlugin }
