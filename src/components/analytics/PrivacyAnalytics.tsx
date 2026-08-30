'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PostHog } from 'posthog-js'
import type { AnalyticsEventName, AnalyticsProperties } from '@/lib/analytics-events'
import {
  isSessionReplayAllowedPath,
  parseSessionReplayConsent,
  redactSessionReplayUrl,
  serializeSessionReplayConsent,
  SESSION_REPLAY_CONSENT_EVENT,
  SESSION_REPLAY_CONSENT_STORAGE_KEY,
  SESSION_REPLAY_OPEN_CHOICES_EVENT,
  SESSION_REPLAY_PUBLIC_EVENT,
  SESSION_REPLAY_ROUTE_BLOCK_EVENT,
  type SessionReplayConfig,
  type SessionReplayConsent,
} from '@/lib/session-replay'

declare global {
  interface Navigator {
    globalPrivacyControl?: boolean
  }
}

type PublicAnalyticsEvent = CustomEvent<{
  event: AnalyticsEventName
  properties: AnalyticsProperties
}>

interface PrivacyAnalyticsProps {
  config: SessionReplayConfig
}

export function PrivacyAnalytics({ config }: PrivacyAnalyticsProps) {
  const pathname = usePathname()
  const posthogRef = useRef<PostHog | null>(null)
  const capturedPathRef = useRef<string | null>(null)
  const [consent, setConsent] = useState<SessionReplayConsent>('unset')
  const [hasGlobalPrivacyControl, setHasGlobalPrivacyControl] = useState(false)
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false)
  const [showChoices, setShowChoices] = useState(false)

  const replayAllowedOnPage = isSessionReplayAllowedPath(pathname)
  const mayCapture =
    config.enabled
    && hasLoadedPreference
    && consent === 'granted'
    && !hasGlobalPrivacyControl
    && replayAllowedOnPage

  const disablePostHog = useCallback(() => {
    const posthog = posthogRef.current
    if (!posthog) return

    posthog.stopSessionRecording()
    posthog.opt_out_capturing()
  }, [])

  useEffect(() => {
    if (!config.enabled) return

    const gpcEnabled = navigator.globalPrivacyControl === true
    const storedConsent = parseSessionReplayConsent(
      window.localStorage.getItem(SESSION_REPLAY_CONSENT_STORAGE_KEY)
    )

    setHasGlobalPrivacyControl(gpcEnabled)
    setConsent(storedConsent)
    setHasLoadedPreference(true)
    setShowChoices(storedConsent === 'unset' && !gpcEnabled)
  }, [config.enabled])

  useEffect(() => {
    if (!config.enabled) return

    const openChoices = () => setShowChoices(true)
    const blockExcludedRoute = () => {
      disablePostHog()
      capturedPathRef.current = null
    }
    window.addEventListener(SESSION_REPLAY_OPEN_CHOICES_EVENT, openChoices)
    window.addEventListener(SESSION_REPLAY_ROUTE_BLOCK_EVENT, blockExcludedRoute)
    return () => {
      window.removeEventListener(SESSION_REPLAY_OPEN_CHOICES_EVENT, openChoices)
      window.removeEventListener(SESSION_REPLAY_ROUTE_BLOCK_EVENT, blockExcludedRoute)
    }
  }, [config.enabled, disablePostHog])

  useEffect(() => {
    if (!config.enabled || !hasLoadedPreference) return

    if (!mayCapture) {
      disablePostHog()
      capturedPathRef.current = null
      return
    }

    let cancelled = false

    async function startReplay() {
      const { default: posthog } = await import('posthog-js')
      if (cancelled) return

      if (!posthogRef.current) {
        posthog.init(config.projectToken, {
          api_host: config.apiHost,
          defaults: '2026-05-30',
          autocapture: true,
          capture_pageview: false,
          capture_pageleave: true,
          cross_subdomain_cookie: false,
          person_profiles: 'never',
          persistence: 'localStorage+cookie',
          respect_dnt: true,
          secure_cookie: true,
          session_recording: {
            blockSelector: '[data-session-replay-block]',
            maskAllInputs: true,
            maskCapturedNetworkRequestFn: (request) => {
              if (request.name) request.name = redactSessionReplayUrl(request.name)
              return request
            },
            recordCrossOriginIframes: false,
          },
        })
        posthogRef.current = posthog
      }

      posthog.opt_in_capturing()
      posthog.startSessionRecording()

      if (capturedPathRef.current !== pathname) {
        const currentUrl = redactSessionReplayUrl(window.location.href)
        posthog.capture('$pageview', {
          $current_url: currentUrl,
          $pathname: pathname,
        })
        capturedPathRef.current = pathname
      }
    }

    void startReplay().catch((error) => {
      console.warn(
        '[SessionReplay] Could not initialize experience analytics',
        error instanceof Error ? error.name : 'UnknownError'
      )
    })

    return () => {
      cancelled = true
    }
  }, [
    config.apiHost,
    config.enabled,
    config.projectToken,
    disablePostHog,
    hasLoadedPreference,
    mayCapture,
    pathname,
  ])

  useEffect(() => {
    if (!config.enabled) return

    const capturePublicEvent = (browserEvent: Event) => {
      if (!mayCapture || !posthogRef.current) return
      const { event, properties } = (browserEvent as PublicAnalyticsEvent).detail
      posthogRef.current.capture(event, properties)
    }

    window.addEventListener(SESSION_REPLAY_PUBLIC_EVENT, capturePublicEvent)
    return () => window.removeEventListener(SESSION_REPLAY_PUBLIC_EVENT, capturePublicEvent)
  }, [config.enabled, mayCapture])

  const saveConsent = (nextConsent: Exclude<SessionReplayConsent, 'unset'>) => {
    window.localStorage.setItem(
      SESSION_REPLAY_CONSENT_STORAGE_KEY,
      serializeSessionReplayConsent(nextConsent)
    )
    setConsent(nextConsent)
    setShowChoices(false)

    if (nextConsent === 'denied') disablePostHog()

    window.dispatchEvent(new CustomEvent(SESSION_REPLAY_CONSENT_EVENT, {
      detail: { status: nextConsent },
    }))
  }

  if (!config.enabled || !hasLoadedPreference || !showChoices) return null

  const hasExistingChoice = consent !== 'unset'

  return (
    <aside
      aria-label="Experience analytics choices"
      role="region"
      className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-[calc(1rem+var(--safe-area-inset-bottom))]"
      data-session-replay-block
    >
      <div className="mx-auto max-w-4xl rounded-3xl border border-dusty-rose/60 bg-ivory p-5 shadow-xl md:flex md:items-center md:gap-8 md:p-6">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-medium text-charcoal">
            {hasExistingChoice ? 'Your privacy choices' : 'Help us improve the site'}
          </h2>
          {hasGlobalPrivacyControl ? (
            <p className="mt-2 text-sm leading-6 text-charcoal/80">
              Your browser&apos;s Global Privacy Control is on, so experience analytics remain off.
            </p>
          ) : (
            <p className="mt-2 text-sm leading-6 text-charcoal/80">
              With your permission, we&apos;ll create a privacy-masked replay of taps, scrolling,
              and page movement to find confusing moments. We don&apos;t record what you type or
              activity inside the Vagaro booking form. Read our{' '}
              <Link href="/privacy" className="font-medium text-terracotta underline underline-offset-4">
                Privacy Policy
              </Link>.
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row md:mt-0 md:flex-shrink-0">
          {hasGlobalPrivacyControl ? (
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-terracotta px-5 py-2 text-sm font-medium text-terracotta transition-colors hover:bg-terracotta hover:text-ivory"
              onClick={() => setShowChoices(false)}
            >
              Close
            </button>
          ) : (
            <>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-terracotta px-5 py-2 text-sm font-medium text-terracotta transition-colors hover:bg-terracotta hover:text-ivory"
                onClick={() => saveConsent('denied')}
              >
                {consent === 'granted' ? 'Turn off' : 'No thanks'}
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-terracotta px-5 py-2 text-sm font-medium text-ivory transition-colors hover:bg-terracotta-ink"
                onClick={() => saveConsent('granted')}
              >
                {consent === 'granted' ? 'Keep enabled' : 'Allow experience analytics'}
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
