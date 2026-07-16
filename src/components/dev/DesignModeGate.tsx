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
 * Activation: development builds only. The old production `?design=1`
 * backdoor was intentionally removed; production feedback belongs in the
 * authenticated admin workflow.
 *
 * Zero impact on production bundle size when not activated.
 */
export function DesignModeGate() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(process.env.NODE_ENV === 'development')
  }, [])

  if (!enabled) return null
  return <DesignMode />
}
