export const SESSION_REPLAY_CONSENT_STORAGE_KEY = 'lashpop_session_replay_consent_v1'
export const SESSION_REPLAY_CONSENT_EVENT = 'lashpop:session-replay-consent'
export const SESSION_REPLAY_OPEN_CHOICES_EVENT = 'lashpop:open-privacy-choices'
export const SESSION_REPLAY_PUBLIC_EVENT = 'lashpop:public-analytics-event'
export const SESSION_REPLAY_ROUTE_BLOCK_EVENT = 'lashpop:block-session-replay-route'

export type SessionReplayConsent = 'granted' | 'denied' | 'unset'

export interface SessionReplayConfig {
  enabled: boolean
  projectToken: string
  apiHost: string
}

const POSTHOG_PROJECT_TOKEN_RE = /^phc_[A-Za-z0-9_-]{12,}$/
const POSTHOG_API_HOSTS = new Set([
  'https://us.i.posthog.com',
  'https://eu.i.posthog.com',
])

const REPLAYABLE_PUBLIC_PATH_RE = /^\/$|^\/services(?:\/[^/]+)?\/?$/

export function isExplicitlyEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true'
}

export function resolveSessionReplayConfig({
  enabled,
  projectToken,
  apiHost,
}: {
  enabled: string | undefined
  projectToken: string | undefined
  apiHost: string | undefined
}): SessionReplayConfig {
  const normalizedToken = projectToken?.trim() ?? ''
  const normalizedHost = (apiHost?.trim() || 'https://us.i.posthog.com').replace(/\/$/, '')

  return {
    enabled:
      isExplicitlyEnabled(enabled)
      && POSTHOG_PROJECT_TOKEN_RE.test(normalizedToken)
      && POSTHOG_API_HOSTS.has(normalizedHost),
    projectToken: normalizedToken,
    apiHost: normalizedHost,
  }
}

/**
 * Session replay is deliberately allowlisted to public discovery pages.
 * Admin, authentication, application, confirmation, and token-bearing routes
 * stay out even if a future route is added without replay-specific review.
 */
export function isSessionReplayAllowedPath(pathname: string): boolean {
  return REPLAYABLE_PUBLIC_PATH_RE.test(pathname)
}

export function parseSessionReplayConsent(rawValue: string | null): SessionReplayConsent {
  if (!rawValue) return 'unset'

  try {
    const parsed = JSON.parse(rawValue) as { status?: unknown }
    return parsed.status === 'granted' || parsed.status === 'denied'
      ? parsed.status
      : 'unset'
  } catch {
    return 'unset'
  }
}

export function serializeSessionReplayConsent(status: Exclude<SessionReplayConsent, 'unset'>): string {
  return JSON.stringify({
    status,
    updatedAt: new Date().toISOString(),
  })
}

/**
 * Remove query strings and fragments before a URL reaches replay storage.
 * These can contain service filters, campaign identifiers, or one-time tokens.
 */
export function redactSessionReplayUrl(value: string): string {
  try {
    const url = new URL(value, 'https://lashpopstudios.com')
    return `${url.origin}${url.pathname}`
  } catch {
    return value.split(/[?#]/, 1)[0]
  }
}
