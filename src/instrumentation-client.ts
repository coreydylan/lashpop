import {
  INTERACTION_ANALYTICS_ROUTE_BLOCK_EVENT,
  isInteractionAnalyticsAllowedPath,
} from '@/lib/interaction-analytics'

/** Stop replay before an App Router transition can paint an excluded route. */
export function onRouterTransitionStart(url: string) {
  try {
    const pathname = new URL(url, window.location.href).pathname
    if (isInteractionAnalyticsAllowedPath(pathname)) return
    window.dispatchEvent(new CustomEvent(INTERACTION_ANALYTICS_ROUTE_BLOCK_EVENT, {
      detail: { pathname },
    }))
  } catch {
    window.dispatchEvent(new Event(INTERACTION_ANALYTICS_ROUTE_BLOCK_EVENT))
  }
}
