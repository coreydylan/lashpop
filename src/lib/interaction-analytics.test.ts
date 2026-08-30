import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  isInteractionAnalyticsAllowedPath,
  redactAnalyticsUrl,
  resolveInteractionAnalyticsConfig,
  scrollMilestones,
  summarizeGesture,
  viewportBucket,
} from './interaction-analytics'

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
  })
})
