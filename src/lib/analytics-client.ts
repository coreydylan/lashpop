'use client'

import { track } from '@vercel/analytics'
import {
  safeAnalyticsProperties,
  type AnalyticsEventName,
  type AnalyticsProperties,
} from '@/lib/analytics-events'

export function trackPublicEvent(
  event: AnalyticsEventName,
  properties: AnalyticsProperties = {}
): void {
  try {
    track(event, safeAnalyticsProperties(properties))
  } catch (error) {
    console.warn(
      `[Analytics] Could not record ${event}`,
      error instanceof Error ? error.name : 'UnknownError'
    )
  }
}
