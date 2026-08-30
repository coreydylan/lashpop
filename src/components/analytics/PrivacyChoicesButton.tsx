'use client'

import { useEffect, useState } from 'react'
import { SESSION_REPLAY_OPEN_CHOICES_EVENT } from '@/lib/session-replay'

export function PrivacyChoicesButton() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(document.documentElement.dataset.sessionReplayEnabled === 'true')
  }, [])

  if (!enabled) return null

  return (
    <button
      type="button"
      className="caption min-h-0 min-w-0 bg-transparent p-0 text-charcoal transition-colors hover:text-terracotta"
      onClick={() => window.dispatchEvent(new Event(SESSION_REPLAY_OPEN_CHOICES_EVENT))}
    >
      Privacy Choices
    </button>
  )
}
