'use client'

import { track } from '@vercel/analytics'
import {
  safeAnalyticsProperties,
  type AnalyticsEventName,
  type AnalyticsProperties,
} from '@/lib/analytics-events'
import { SESSION_REPLAY_PUBLIC_EVENT } from '@/lib/session-replay'

export function trackPublicEvent(
  event: AnalyticsEventName,
  properties: AnalyticsProperties = {}
): void {
  try {
    const safeProperties = safeAnalyticsProperties(properties)
    track(event, safeProperties)

    // The replay integration listens only after the visitor has opted in.
    // Dispatching a local browser event keeps PostHog out of the critical
    // path and preserves this module's existing no-PII event contract.
    window.dispatchEvent(new CustomEvent(SESSION_REPLAY_PUBLIC_EVENT, {
      detail: { event, properties: safeProperties },
    }))
  } catch (error) {
    console.warn(
      `[Analytics] Could not record ${event}`,
      error instanceof Error ? error.name : 'UnknownError'
    )
  }
}
