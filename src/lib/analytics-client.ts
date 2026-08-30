'use client'

import { track } from '@vercel/analytics'
import {
  safeAnalyticsProperties,
  type AnalyticsEventName,
  type AnalyticsProperties,
} from '@/lib/analytics-events'
import { INTERACTION_ANALYTICS_PUBLIC_EVENT } from '@/lib/interaction-analytics'

export function trackPublicEvent(
  event: AnalyticsEventName,
  properties: AnalyticsProperties = {}
): void {
  try {
    const safeProperties = safeAnalyticsProperties(properties)
    track(event, safeProperties)
    window.dispatchEvent(new CustomEvent(INTERACTION_ANALYTICS_PUBLIC_EVENT, {
      detail: { event, properties: safeProperties },
    }))
  } catch (error) {
    console.warn(
      `[Analytics] Could not record ${event}`,
      error instanceof Error ? error.name : 'UnknownError'
    )
  }
}
