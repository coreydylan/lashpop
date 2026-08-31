import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { describe, it } from 'node:test'
import {
  AUTOCAPTURE_IGNORE_SELECTORS,
  PRIVATE_INTERACTION_SELECTOR,
  isInteractionAnalyticsAllowedPath,
  isPublicAnalyticsUrl,
  keepInteractionAnalyticsEvent,
  redactAnalyticsUrl,
  resolveInteractionAnalyticsConfig,
  scrollMilestones,
  summarizeGesture,
  viewportBucket,
} from './interaction-analytics'

const require = createRequire(import.meta.url)
const { buildNetworkRequestOptions } = require(
  '../../node_modules/posthog-js/lib/src/extensions/replay/external/config.js'
) as {
  buildNetworkRequestOptions: (
    client: Record<string, unknown>,
    remote: Record<string, unknown>
  ) => { recordBody: boolean; recordHeaders: boolean }
}

describe('aggregate interaction analytics contract', () => {
  it('requires a valid explicit configuration', () => {
    assert.equal(resolveInteractionAnalyticsConfig({
      enabled: undefined,
      projectToken: 'phc_abcdefghijklmnop',
      apiHost: 'https://us.i.posthog.com',
    }).enabled, false)
    assert.equal(resolveInteractionAnalyticsConfig({
      enabled: 'true',
      projectToken: 'not-a-project-token',
      apiHost: 'https://us.i.posthog.com',
    }).enabled, false)
    assert.equal(resolveInteractionAnalyticsConfig({
      enabled: 'TRUE',
      projectToken: 'phc_abcdefghijklmnop',
      apiHost: 'https://us.i.posthog.com/',
    }).enabled, true)
  })

  it('covers public pages but excludes sensitive and internal routes', () => {
    for (const path of ['/', '/services', '/services/classic-fill', '/privacy', '/terms', '/work-with-us']) {
      assert.equal(isInteractionAnalyticsAllowedPath(path), true, path)
    }
    for (const path of ['/admin', '/admin/login', '/confirm/token', '/login', '/punchlist', '/staffphoto', '/preview/theatre']) {
      assert.equal(isInteractionAnalyticsAllowedPath(path), false, path)
    }
  })

  it('drops PostHog events after a browser moves from a public page to a private route', () => {
    const event = { event: '$autocapture', properties: { $current_url: 'https://lashpopstudios.com/' } }

    assert.equal(keepInteractionAnalyticsEvent('/', event), event)
    assert.equal(keepInteractionAnalyticsEvent('/admin/login', event), null)
    assert.equal(keepInteractionAnalyticsEvent('/confirm/private-token', event), null)
    assert.equal(keepInteractionAnalyticsEvent('/', null), null)
  })

  it('allows only public same-origin URLs into Vercel Web Analytics', () => {
    assert.equal(isPublicAnalyticsUrl('https://lashpopstudios.com/services/classic-fill?private=value'), true)
    assert.equal(isPublicAnalyticsUrl('/work-with-us', 'https://lashpopstudios.com'), true)
    assert.equal(isPublicAnalyticsUrl('https://lashpopstudios.com/admin/analytics'), false)
    assert.equal(isPublicAnalyticsUrl('https://other.example/services'), false)
    assert.equal(isPublicAnalyticsUrl('not a valid URL', 'not a valid origin'), false)
  })

  it('blocks every form surface from replay and built-in autocapture', () => {
    for (const selector of [
      'form',
      'input',
      'textarea',
      'select',
      '[contenteditable]',
      '[data-session-replay-block]',
    ]) {
      assert.equal(PRIVATE_INTERACTION_SELECTOR.includes(selector), true, selector)
      assert.equal((AUTOCAPTURE_IGNORE_SELECTORS as readonly string[]).includes(selector), true, selector)
    }
    assert.equal(AUTOCAPTURE_IGNORE_SELECTORS.includes('.ph-no-autocapture'), true)
    assert.equal(AUTOCAPTURE_IGNORE_SELECTORS.includes('[data-ph-no-autocapture]'), true)
  })

  it('keeps network bodies and headers disabled when remote replay settings enable them', () => {
    const remote = {
      recordHeaders: true,
      recordBody: true,
      recordPerformance: false,
      payloadHostDenyList: [],
    }
    const hardened = buildNetworkRequestOptions({
      api_host: 'https://us.i.posthog.com',
      capture_performance: false,
      session_recording: {
        recordHeaders: false,
        recordBody: false,
      },
    }, remote)

    assert.deepEqual(
      { recordHeaders: hardened.recordHeaders, recordBody: hardened.recordBody },
      { recordHeaders: false, recordBody: false }
    )
  })

  it('reduces raw pointer coordinates to coarse tap statistics', () => {
    assert.deepEqual(summarizeGesture({
      startX: 100,
      startY: 200,
      endX: 106,
      endY: 208,
      durationMs: 120,
      viewportWidth: 390,
      viewportHeight: 844,
    }), {
      kind: 'tap',
      x_bucket: 2,
      y_bucket: 2,
      duration: 'quick',
    })
  })

  it('reduces a swipe to direction and distance buckets', () => {
    assert.deepEqual(summarizeGesture({
      startX: 200,
      startY: 700,
      endX: 190,
      endY: 300,
      durationMs: 400,
      viewportWidth: 390,
      viewportHeight: 844,
    }), {
      kind: 'swipe',
      x_bucket: 4,
      y_bucket: 3,
      duration: 'deliberate',
      direction: 'up',
      distance: 'long',
    })
  })

  it('emits only newly crossed scroll milestones', () => {
    assert.deepEqual(scrollMilestones(12, 76), [25, 50, 75])
    assert.deepEqual(scrollMilestones(76, 88), [])
    assert.deepEqual(scrollMilestones(88, 100), [90, 100])
  })

  it('uses broad viewport buckets and strips URLs', () => {
    assert.equal(viewportBucket(390), 'phone')
    assert.equal(viewportBucket(768), 'tablet')
    assert.equal(viewportBucket(1440), 'desktop')
    assert.equal(viewportBucket(1800), 'wide')
    assert.equal(
      redactAnalyticsUrl('https://lashpopstudios.com/services?email=hidden#booking'),
      'https://lashpopstudios.com/services'
    )
    assert.equal(
      redactAnalyticsUrl('https://lashpopstudios.com/api/forms/private-token?email=hidden'),
      'https://lashpopstudios.com/private-request'
    )
    assert.equal(
      redactAnalyticsUrl('not a valid URL'),
      'https://lashpopstudios.com/private-request'
    )
  })
})
