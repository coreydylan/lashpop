export const ANALYTICS_EVENTS = {
  bookingStarted: 'booking_started',
  bookingCompleted: 'booking_completed',
  quizStarted: 'quiz_started',
  quizCompleted: 'quiz_completed',
  workWithUsSubmitted: 'work_with_us_submitted',
  newsletterSignupCompleted: 'newsletter_signup_completed',
} as const

export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS]
export type AnalyticsPropertyValue = string | number | boolean | null
export type AnalyticsProperties = Record<string, AnalyticsPropertyValue>

const FORBIDDEN_PROPERTY_KEY = /(address|answer|customer|email|instagram|message|name|phone|token|user)/i
const MAX_PROPERTIES = 2

/**
 * Vercel Pro accepts two custom properties per event. Keep the contract small
 * and reject fields that could accidentally carry contact details or quiz
 * answers. Analytics failures must never affect the visitor's main action.
 */
export function safeAnalyticsProperties(properties: AnalyticsProperties = {}): AnalyticsProperties {
  const entries = Object.entries(properties)
  if (entries.length > MAX_PROPERTIES) {
    throw new Error(`Analytics events may include at most ${MAX_PROPERTIES} properties`)
  }

  for (const [key, value] of entries) {
    if (FORBIDDEN_PROPERTY_KEY.test(key)) {
      throw new Error(`Analytics property "${key}" is not allowed`)
    }
    if (typeof value === 'string' && value.length > 255) {
      throw new Error(`Analytics property "${key}" exceeds 255 characters`)
    }
  }

  return Object.fromEntries(entries)
}

export function isMarketingTrackingEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true'
}
