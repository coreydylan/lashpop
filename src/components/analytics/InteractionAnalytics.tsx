'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PostHog } from 'posthog-js'
import type { AnalyticsEventName, AnalyticsProperties } from '@/lib/analytics-events'
import {
  AUTOCAPTURE_IGNORE_SELECTORS,
  INTERACTION_ANALYTICS_CAPTURED_EVENT,
  INTERACTION_ANALYTICS_PUBLIC_EVENT,
  INTERACTION_ANALYTICS_ROUTE_BLOCK_EVENT,
  PRIVATE_INTERACTION_SELECTOR,
  isInteractionAnalyticsAllowedPath,
  keepInteractionAnalyticsEvent,
  redactAnalyticsUrl,
  scrollMilestones,
  summarizeGesture,
  viewportBucket,
  type InteractionAnalyticsConfig,
} from '@/lib/interaction-analytics'

type PublicAnalyticsEvent = CustomEvent<{
  event: AnalyticsEventName
  properties: AnalyticsProperties
}>

type PointerStart = {
  x: number
  y: number
  at: number
  target: EventTarget | null
  pointerType: string
}

interface InteractionAnalyticsProps {
  config: InteractionAnalyticsConfig
}

function safeLabel(value: string | null | undefined, fallback: string): string {
  const normalized = value?.trim().toLowerCase()
  return normalized && /^[a-z0-9_-]{1,48}$/.test(normalized) ? normalized : fallback
}

function describeTarget(target: EventTarget | null): { section: string; target: string } {
  if (!(target instanceof Element)) return { section: 'page', target: 'surface' }

  const section = safeLabel(
    target.closest('[data-section-id]')?.getAttribute('data-section-id'),
    target.closest('[role="dialog"]') ? 'dialog' : 'page'
  )
  const analyticsId = target.closest('[data-analytics-id]')?.getAttribute('data-analytics-id')
  if (analyticsId) return { section, target: safeLabel(analyticsId, 'control') }

  const interactive = target.closest('button, a, input, select, textarea, summary, [role="button"], [role="link"]')
  if (interactive instanceof HTMLAnchorElement) {
    const destination = new URL(interactive.href, window.location.href)
    return {
      section,
      target: destination.origin === window.location.origin ? 'link_internal' : 'link_external',
    }
  }
  if (interactive instanceof HTMLButtonElement) return { section, target: 'button' }
  if (interactive instanceof HTMLInputElement || interactive instanceof HTMLSelectElement || interactive instanceof HTMLTextAreaElement) {
    return { section, target: 'form_control' }
  }
  if (interactive) return { section, target: 'control' }
  if (target.closest('img, picture')) return { section, target: 'image' }
  return { section, target: 'surface' }
}

function scrollState(target: EventTarget | null) {
  const element = target === document
    ? document.scrollingElement
    : target instanceof Element
      ? target
      : document.scrollingElement
  if (!element) return null

  const maximum = element.scrollHeight - element.clientHeight
  const depth = maximum <= 0 ? 100 : Math.round((element.scrollTop / maximum) * 100)
  const section = safeLabel(element.closest?.('[data-section-id]')?.getAttribute('data-section-id'), 'page')
  return { element, depth: Math.max(0, Math.min(100, depth)), section }
}

function observeReplayStart(posthog: PostHog): () => void {
  const deadline = Date.now() + 10_000
  const check = () => {
    if (posthog.sessionRecordingStarted()) {
      document.documentElement.dataset.sessionReplay = 'active'
      return true
    }
    return Date.now() >= deadline
  }

  if (check()) {
    return () => {
      delete document.documentElement.dataset.sessionReplay
    }
  }
  const interval = window.setInterval(() => {
    if (check()) window.clearInterval(interval)
  }, 50)

  return () => {
    window.clearInterval(interval)
    delete document.documentElement.dataset.sessionReplay
  }
}

export function InteractionAnalytics({ config }: InteractionAnalyticsProps) {
  const pathname = usePathname()
  const posthogRef = useRef<PostHog | null>(null)
  const pointerStarts = useRef(new Map<number, PointerStart>())
  const scrollDepths = useRef(new WeakMap<Element, number>())
  const pageStartedAt = useRef(performance.now())
  const maximumPageDepth = useRef(0)
  const [ready, setReady] = useState(false)
  const allowedPath = isInteractionAnalyticsAllowedPath(pathname)

  const capture = useCallback((event: string, properties: Record<string, unknown> = {}) => {
    const posthog = posthogRef.current
    if (!posthog || !isInteractionAnalyticsAllowedPath(window.location.pathname)) return

    posthog.capture(event, {
      page: window.location.pathname,
      viewport: viewportBucket(window.innerWidth),
      ...properties,
    })
    window.dispatchEvent(new CustomEvent(INTERACTION_ANALYTICS_CAPTURED_EVENT, {
      detail: { event },
    }))
  }, [])

  useEffect(() => {
    if (!config.enabled || !allowedPath) return

    if (posthogRef.current) {
      posthogRef.current.startSessionRecording()
      const stopReplayProbe = observeReplayStart(posthogRef.current)
      document.documentElement.dataset.interactionAnalytics = 'active'
      setReady(true)
      return () => {
        stopReplayProbe()
        delete document.documentElement.dataset.interactionAnalytics
      }
    }

    let cancelled = false
    let stopReplayProbe: (() => void) | undefined

    async function initialize() {
      const { default: posthog } = await import('posthog-js')
      if (cancelled) return

      posthog.init(config.projectToken, {
        api_host: config.apiHost,
        defaults: '2026-05-30',
        autocapture: {
          css_selector_ignorelist: [...AUTOCAPTURE_IGNORE_SELECTORS],
        },
        capture_pageview: false,
        capture_pageleave: false,
        capture_heatmaps: true,
        capture_dead_clicks: true,
        capture_exceptions: false,
        capture_performance: false,
        cross_subdomain_cookie: false,
        disable_persistence: false,
        disable_session_recording: false,
        disable_surveys: true,
        disable_web_experiments: true,
        advanced_disable_feature_flags: true,
        advanced_disable_feature_flags_on_first_load: true,
        internal_or_test_user_hostname: null,
        person_profiles: 'never',
        persistence: 'memory',
        respect_dnt: false,
        secure_cookie: true,
        session_recording: {
          blockSelector: PRIVATE_INTERACTION_SELECTOR,
          maskAllInputs: true,
          recordBody: false,
          recordHeaders: false,
          maskCapturedNetworkRequestFn: (request) => {
            if (request.name) request.name = redactAnalyticsUrl(request.name)
            return request
          },
          recordCrossOriginIframes: false,
        },
        rate_limiting: {
          events_per_second: 6,
          events_burst_limit: 60,
        },
        property_denylist: [
          '$current_url',
          '$referrer',
          '$referring_domain',
          '$initial_referrer',
          '$initial_referring_domain',
          '$search_engine',
          '$utm_source',
          '$utm_medium',
          '$utm_campaign',
          '$utm_content',
          '$utm_term',
        ],
        before_send: (event) => {
          const publicEvent = keepInteractionAnalyticsEvent(window.location.pathname, event)
          if (!publicEvent) return null
          if (publicEvent.properties?.$current_url) {
            publicEvent.properties.$current_url = redactAnalyticsUrl(String(publicEvent.properties.$current_url))
          }
          return publicEvent
        },
      })

      posthogRef.current = posthog
      posthog.startSessionRecording()
      stopReplayProbe = observeReplayStart(posthog)
      document.documentElement.dataset.interactionAnalytics = 'active'
      setReady(true)
    }

    void initialize().catch((error) => {
      console.warn(
        '[InteractionAnalytics] Could not initialize aggregate telemetry',
        error instanceof Error ? error.name : 'UnknownError'
      )
    })

    return () => {
      cancelled = true
      stopReplayProbe?.()
      delete document.documentElement.dataset.interactionAnalytics
    }
  }, [allowedPath, config.apiHost, config.enabled, config.projectToken])

  useEffect(() => {
    if (!config.enabled) return

    const blockExcludedRoute = () => {
      posthogRef.current?.stopSessionRecording()
      delete document.documentElement.dataset.interactionAnalytics
      delete document.documentElement.dataset.sessionReplay
    }
    window.addEventListener(INTERACTION_ANALYTICS_ROUTE_BLOCK_EVENT, blockExcludedRoute)
    return () => window.removeEventListener(INTERACTION_ANALYTICS_ROUTE_BLOCK_EVENT, blockExcludedRoute)
  }, [config.enabled])

  useEffect(() => {
    if (!ready || !allowedPath) return
    pageStartedAt.current = performance.now()
    maximumPageDepth.current = 0
    capture('ux_page_view')
  }, [allowedPath, capture, pathname, ready])

  useEffect(() => {
    if (!ready || !allowedPath) return
    const activePointerStarts = pointerStarts.current

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary) return
      activePointerStarts.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        at: performance.now(),
        target: event.target,
        pointerType: safeLabel(event.pointerType, 'unknown'),
      })
    }

    const onPointerUp = (event: PointerEvent) => {
      const start = activePointerStarts.get(event.pointerId)
      activePointerStarts.delete(event.pointerId)
      if (!start) return

      const gesture = summarizeGesture({
        startX: start.x,
        startY: start.y,
        endX: event.clientX,
        endY: event.clientY,
        durationMs: performance.now() - start.at,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      })
      const target = describeTarget(start.target)

      capture(gesture.kind === 'tap' ? 'ux_tap' : 'ux_swipe', {
        ...target,
        pointer: start.pointerType,
        ...gesture,
      })
    }

    const onPointerCancel = (event: PointerEvent) => {
      activePointerStarts.delete(event.pointerId)
    }

    const onScroll = (event: Event) => {
      const state = scrollState(event.target)
      if (!state) return
      const previousDepth = scrollDepths.current.get(state.element) ?? 0
      if (state.depth <= previousDepth) return

      scrollDepths.current.set(state.element, state.depth)
      maximumPageDepth.current = Math.max(maximumPageDepth.current, state.depth)
      for (const milestone of scrollMilestones(previousDepth, state.depth)) {
        capture('ux_scroll_depth', {
          section: state.section,
          depth: milestone,
        })
      }
    }

    const onPageHide = () => {
      const activeSeconds = Math.max(0, (performance.now() - pageStartedAt.current) / 1000)
      const duration = activeSeconds < 10
        ? 'under_10s'
        : activeSeconds < 30
          ? '10_30s'
          : activeSeconds < 120
            ? '30_120s'
            : 'over_120s'
      capture('ux_page_exit', {
        duration,
        max_depth: maximumPageDepth.current,
      })
    }

    document.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true })
    document.addEventListener('pointerup', onPointerUp, { capture: true, passive: true })
    document.addEventListener('pointercancel', onPointerCancel, { capture: true, passive: true })
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    window.addEventListener('pagehide', onPageHide)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, { capture: true })
      document.removeEventListener('pointerup', onPointerUp, { capture: true })
      document.removeEventListener('pointercancel', onPointerCancel, { capture: true })
      document.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('pagehide', onPageHide)
      activePointerStarts.clear()
    }
  }, [allowedPath, capture, ready])

  useEffect(() => {
    if (!ready || !allowedPath) return

    const capturePublicEvent = (browserEvent: Event) => {
      const { event, properties } = (browserEvent as PublicAnalyticsEvent).detail
      capture(event, properties)
    }

    window.addEventListener(INTERACTION_ANALYTICS_PUBLIC_EVENT, capturePublicEvent)
    return () => window.removeEventListener(INTERACTION_ANALYTICS_PUBLIC_EVENT, capturePublicEvent)
  }, [allowedPath, capture, ready])

  return null
}
