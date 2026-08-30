import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  ANALYTICS_EVENTS,
  isMarketingTrackingEnabled,
  safeAnalyticsProperties,
} from './analytics-events'

describe('public analytics contract', () => {
  it('uses stable object-action event names', () => {
    assert.deepEqual(Object.values(ANALYTICS_EVENTS), [
      'booking_started',
      'booking_completed',
      'quiz_started',
      'quiz_completed',
      'work_with_us_submitted',
      'newsletter_signup_completed',
    ])
  })

  it('accepts at most two non-PII scalar properties', () => {
    assert.deepEqual(
      safeAnalyticsProperties({ service_slug: 'classic-fill', source: 'service_browser' }),
      { service_slug: 'classic-fill', source: 'service_browser' }
    )
    assert.throws(
      () => safeAnalyticsProperties({ one: 1, two: 2, three: 3 }),
      /at most 2 properties/
    )
    assert.throws(
      () => safeAnalyticsProperties({ email: 'visitor@example.com' }),
      /not allowed/
    )
    assert.throws(
      () => safeAnalyticsProperties({ quiz_answer: 'anything' }),
      /not allowed/
    )
  })

  it('requires an explicit true flag before loading advertising trackers', () => {
    assert.equal(isMarketingTrackingEnabled(undefined), false)
    assert.equal(isMarketingTrackingEnabled('false'), false)
    assert.equal(isMarketingTrackingEnabled('TRUE'), true)
  })

  it('records quiz completion from both live result transitions', () => {
    const quizSource = readFileSync(
      new URL('../components/find-your-look/FindYourLookModal.tsx', import.meta.url),
      'utf8'
    )

    assert.equal(
      quizSource.match(/trackPublicEvent\(ANALYTICS_EVENTS\.quizCompleted/g)?.length,
      2
    )
  })
})
