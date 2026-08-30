export const INTERACTION_ANALYTICS_PUBLIC_EVENT = 'lashpop:public-analytics-event'
export const INTERACTION_ANALYTICS_CAPTURED_EVENT = 'lashpop:interaction-stat-captured'
export const INTERACTION_ANALYTICS_ROUTE_BLOCK_EVENT = 'lashpop:block-experience-analytics-route'

export interface InteractionAnalyticsConfig {
  enabled: boolean
  projectToken: string
  apiHost: string
}

export type GestureSummary = {
  kind: 'tap' | 'swipe'
  x_bucket: number
  y_bucket: number
  duration: 'quick' | 'deliberate' | 'hold'
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: 'short' | 'medium' | 'long'
}

const POSTHOG_PROJECT_TOKEN_RE = /^phc_[A-Za-z0-9_-]{12,}$/
const POSTHOG_API_HOSTS = new Set([
  'https://us.i.posthog.com',
  'https://eu.i.posthog.com',
])

const PUBLIC_PATH_RE = /^\/$|^\/(?:privacy|terms|work-with-us)\/?$|^\/services(?:\/[^/]+)?\/?$/

function isExplicitlyEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true'
}

export function resolveInteractionAnalyticsConfig({
  enabled,
  projectToken,
  apiHost,
}: {
  enabled: string | undefined
  projectToken: string | undefined
  apiHost: string | undefined
}): InteractionAnalyticsConfig {
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

export function isInteractionAnalyticsAllowedPath(pathname: string): boolean {
  return PUBLIC_PATH_RE.test(pathname)
}

export function viewportBucket(width: number): 'phone' | 'tablet' | 'desktop' | 'wide' {
  if (width < 600) return 'phone'
  if (width < 1024) return 'tablet'
  if (width < 1600) return 'desktop'
  return 'wide'
}

function coordinateBucket(value: number, size: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(size) || size <= 0) return 0
  return Math.max(0, Math.min(9, Math.floor((value / size) * 10)))
}

function durationBucket(durationMs: number): GestureSummary['duration'] {
  if (durationMs < 250) return 'quick'
  if (durationMs < 750) return 'deliberate'
  return 'hold'
}

export function summarizeGesture({
  startX,
  startY,
  endX,
  endY,
  durationMs,
  viewportWidth,
  viewportHeight,
}: {
  startX: number
  startY: number
  endX: number
  endY: number
  durationMs: number
  viewportWidth: number
  viewportHeight: number
}): GestureSummary {
  const deltaX = endX - startX
  const deltaY = endY - startY
  const distance = Math.hypot(deltaX, deltaY)
  const base = {
    x_bucket: coordinateBucket(endX, viewportWidth),
    y_bucket: coordinateBucket(endY, viewportHeight),
    duration: durationBucket(durationMs),
  }

  if (distance < 24) return { kind: 'tap', ...base }

  const normalizedDistance = distance / Math.max(1, Math.min(viewportWidth, viewportHeight))
  const distanceLabel = normalizedDistance < 0.15
    ? 'short'
    : normalizedDistance < 0.4
      ? 'medium'
      : 'long'
  const direction = Math.abs(deltaX) > Math.abs(deltaY)
    ? deltaX > 0 ? 'right' : 'left'
    : deltaY > 0 ? 'down' : 'up'

  return {
    kind: 'swipe',
    ...base,
    direction,
    distance: distanceLabel,
  }
}

export function scrollMilestones(previousDepth: number, nextDepth: number): number[] {
  return [25, 50, 75, 90, 100].filter(
    (milestone) => previousDepth < milestone && nextDepth >= milestone
  )
}

export function redactAnalyticsUrl(value: string): string {
  try {
    const url = new URL(value, 'https://lashpopstudios.com')
    return `${url.origin}${url.pathname}`
  } catch {
    return value.split(/[?#]/, 1)[0]
  }
}
