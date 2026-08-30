import {
  isSessionReplayAllowedPath,
  SESSION_REPLAY_ROUTE_BLOCK_EVENT,
} from '@/lib/session-replay'

/**
 * Stop replay before an App Router transition can paint an excluded route.
 * The PrivacyAnalytics component restarts collection only after an allowlisted
 * destination has rendered and the visitor's permission still applies.
 */
export function onRouterTransitionStart(url: string) {
  try {
    const pathname = new URL(url, window.location.href).pathname
    if (isSessionReplayAllowedPath(pathname)) return

    window.dispatchEvent(new CustomEvent(SESSION_REPLAY_ROUTE_BLOCK_EVENT, {
      detail: { pathname },
    }))
  } catch {
    // An unknown destination is treated as sensitive and stopped fail-closed.
    window.dispatchEvent(new Event(SESSION_REPLAY_ROUTE_BLOCK_EVENT))
  }
}
