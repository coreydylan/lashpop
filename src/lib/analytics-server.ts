import { track } from '@vercel/analytics/server'
import {
  safeAnalyticsProperties,
  type AnalyticsEventName,
  type AnalyticsProperties,
} from '@/lib/analytics-events'

export async function trackServerEvent(
  event: AnalyticsEventName,
  properties: AnalyticsProperties = {}
): Promise<void> {
  try {
    await track(event, safeAnalyticsProperties(properties))
  } catch (error) {
    console.warn(
      `[Analytics] Could not record ${event}`,
      error instanceof Error ? error.name : 'UnknownError'
    )
  }
}
