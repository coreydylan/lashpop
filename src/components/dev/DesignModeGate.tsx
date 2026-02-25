'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const DesignMode = dynamic(
  () => import('./DesignMode').then(m => ({ default: m.DesignMode })),
  { ssr: false }
)

/**
 * Lazy-loads DesignMode only when activated.
 *
 * Activation:
 *   - Always available in development mode
 *   - In production, add ?design=1 to any page URL
 *   - Once activated, persists via localStorage until cleared with ?design=0
 *
 * Zero impact on production bundle size when not activated.
 */
export function DesignModeGate() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const designParam = params.get('design')

    // Explicit disable
    if (designParam === '0') {
      localStorage.removeItem('lashpop-design-mode')
      return
    }

    // Enable in dev mode, or via URL param, or if previously activated
    if (
      process.env.NODE_ENV === 'development' ||
      designParam === '1' ||
      localStorage.getItem('lashpop-design-mode') === '1'
    ) {
      setEnabled(true)
      // Persist activation so they don't need the URL param every time
      if (designParam === '1') {
        localStorage.setItem('lashpop-design-mode', '1')
      }
    }
  }, [])

  if (!enabled) return null
  return <DesignMode />
}
