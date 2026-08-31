'use client'

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { isPublicAnalyticsUrl } from '@/lib/interaction-analytics'

function keepPublicEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  return isPublicAnalyticsUrl(event.url, window.location.origin) ? event : null
}

export function PublicWebAnalytics() {
  return (
    <>
      <Analytics beforeSend={keepPublicEvent} />
      <SpeedInsights
        beforeSend={(event) => (
          isPublicAnalyticsUrl(event.url, window.location.origin) ? event : null
        )}
      />
    </>
  )
}
