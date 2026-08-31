import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { ANALYTICS_EVENTS } from './analytics-events'
import {
  AdminAnalyticsError,
  buildAdminAnalyticsFixture,
  getAdminAnalytics,
  parseAdminAnalyticsRange,
  type AdminAnalyticsConfig,
} from './admin-analytics'

const NOW = new Date('2026-08-29T18:42:11.000Z')
const TOKEN = 'vercel-secret-token-for-tests'
const CONFIG: AdminAnalyticsConfig = {
  token: TOKEN,
  projectId: 'prj_lashpop',
  teamId: 'team_experial',
}

const VISIT_FILTER =
  "environment eq 'production' and " +
  "not startswith(requestPath, '/admin') and " +
  "not startswith(requestPath, '/api') and " +
  "not startswith(requestPath, '/_next') and " +
  "not startswith(requestPath, '/preview') and " +
  "not startswith(requestPath, '/punchlist') and " +
  "not startswith(requestPath, '/confirm') and " +
  "not startswith(requestPath, '/login') and " +
  "not startswith(requestPath, '/seoguide') and " +
  "not startswith(requestPath, '/staffphoto') and " +
  "not startswith(requestPath, '/dam')"

const EVENT_FILTER =
  "environment eq 'production' and " +
  "eventName in ('booking_started','booking_completed','quiz_started','quiz_completed','work_with_us_submitted','newsletter_signup_completed')"

interface CapturedCall {
  url: URL
  init: RequestInit & { next?: { revalidate?: number } }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function successfulProvider(): {
  calls: CapturedCall[]
  fetch: typeof globalThis.fetch
} {
  const calls: CapturedCall[] = []

  const fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input.toString())
    calls.push({
      url,
      init: (init ?? {}) as CapturedCall['init'],
    })

    const by = url.searchParams.getAll('by').join(',')
    const since = url.searchParams.get('since')

    if (url.pathname.endsWith('/visits/count')) {
      return jsonResponse({
        version: 1,
        data:
          since === '2026-08-22'
            ? {
                visitors: 12,
                pageviews: 30,
                visitorId: 'period-private-id',
                token: TOKEN,
              }
            : {
                visitors: 8,
                pageviews: 20,
                customerEmail: 'private@example.com',
              },
      })
    }

    if (url.pathname.endsWith('/visits/aggregate') && by === 'day') {
      return jsonResponse({
        version: 1,
        query: { internal: 'not projected' },
        data:
          since === '2026-08-22'
            ? [
                {
                  timestamp: '2026-08-22T00:00:00.000Z',
                  visitors: '5',
                  pageviews: 10,
                  visitorId: 'visitor-private-id',
                  requestResolvedIp: '203.0.113.10',
                },
                {
                  timestamp: '2026-08-28T00:00:00.000Z',
                  visitors: 10,
                  pageviews: 20,
                  email: 'operator@example.com',
                },
                {
                  timestamp: 'not-a-date',
                  visitors: 999,
                  pageviews: 999,
                },
              ]
            : [
                {
                  timestamp: '2026-08-15T00:00:00.000Z',
                  visitors: 4,
                  pageviews: 8,
                },
                {
                  timestamp: '2026-08-21T00:00:00.000Z',
                  visitors: 6,
                  pageviews: 12,
                },
              ],
      })
    }

    if (url.pathname.endsWith('/visits/aggregate') && by === 'referrerHostname') {
      return jsonResponse({
        data: [
          {
            referrerHostname: 'https://www.Google.com/search?email=private@example.com',
            visitors: 10,
            pageviews: 17,
            referrerUrl: 'https://google.com/private/customer/path',
          },
          { referrerHostname: '', visitors: 3, pageviews: 8 },
          { referrerHostname: 'person@example.com', visitors: 2, pageviews: 5 },
        ],
      })
    }

    if (url.pathname.endsWith('/visits/aggregate') && by === 'deviceType') {
      return jsonResponse({
        data: [
          { deviceType: 'mobile', visitors: 9, pageviews: 18 },
          { deviceType: 'desktop', visitors: 5, pageviews: 10 },
          { deviceType: 'smart-fridge-with-private-id', visitors: 1, pageviews: 2 },
        ],
      })
    }

    if (url.pathname.endsWith('/visits/aggregate') && by === 'route') {
      return jsonResponse({
        data: [
          {
            route: '/services',
            visitors: 7,
            pageviews: 14,
            customerName: 'Private Customer',
          },
          {
            route: '/services/[slug]',
            requestPath: '/services/V1StGbhUoJ-vc3OSnoCTbHflC6rg3zmlt',
            visitors: 4,
            pageviews: 9,
          },
          { route: '/confirm/[token]', requestPath: '/confirm/619-555-0114', visitors: 100, pageviews: 100 },
          { route: '/customers/[name]', requestPath: '/customers/alice-smith', visitors: 2, pageviews: 4 },
          { route: '/empty', visitors: -4, pageviews: 'not-a-number' },
        ],
      })
    }

    if (url.pathname.endsWith('/events/aggregate') && by === 'day,eventName') {
      return jsonResponse({
        data:
          since === '2026-08-22'
            ? [
                event('2026-08-22', ANALYTICS_EVENTS.bookingStarted, 10),
                event('2026-08-28', ANALYTICS_EVENTS.bookingStarted, 10),
                event('2026-08-22', ANALYTICS_EVENTS.bookingCompleted, 4),
                event('2026-08-28', ANALYTICS_EVENTS.bookingCompleted, 6),
                event('2026-08-22', ANALYTICS_EVENTS.quizStarted, 8),
                event('2026-08-22', ANALYTICS_EVENTS.quizCompleted, 6),
                event('2026-08-22', ANALYTICS_EVENTS.workWithUsSubmitted, 2),
                event('2026-08-22', ANALYTICS_EVENTS.newsletterSignupCompleted, 3),
                event('2026-08-22', 'unknown_private_event', 900),
              ]
            : [
                event('2026-08-15', ANALYTICS_EVENTS.bookingStarted, 10),
                event('2026-08-15', ANALYTICS_EVENTS.bookingCompleted, 2),
                event('2026-08-15', ANALYTICS_EVENTS.quizStarted, 4),
                event('2026-08-15', ANALYTICS_EVENTS.quizCompleted, 2),
                event('2026-08-15', ANALYTICS_EVENTS.workWithUsSubmitted, 1),
                event('2026-08-15', ANALYTICS_EVENTS.newsletterSignupCompleted, 1),
              ],
      })
    }

    return jsonResponse({ data: [] })
  }) as typeof globalThis.fetch

  return { calls, fetch }
}

function event(date: string, eventName: string, count: number): Record<string, unknown> {
  return {
    timestamp: `${date}T00:00:00.000Z`,
    eventName,
    count,
    visitors: Math.max(1, count - 1),
    eventData: {
      email: 'private@example.com',
      answer: 'private answer',
    },
    token: TOKEN,
  }
}

describe('admin analytics range contract', () => {
  it('accepts only the three explicit ranges', () => {
    assert.equal(parseAdminAnalyticsRange('7d'), '7d')
    assert.equal(parseAdminAnalyticsRange('30d'), '30d')
    assert.equal(parseAdminAnalyticsRange('90d'), '90d')

    for (const invalid of ['1d', '365d', '', '7D', undefined, null, 30]) {
      assert.throws(
        () => parseAdminAnalyticsRange(invalid),
        (error: unknown) =>
          error instanceof AdminAnalyticsError && error.code === 'INVALID_RANGE'
      )
    }
  })
})

describe('Vercel Web Analytics adapter', () => {
  it('builds exact scoped, cached upstream queries and keeps authorization upstream-only', async () => {
    const provider = successfulProvider()
    const dto = await getAdminAnalytics({
      range: '7d',
      config: CONFIG,
      fetch: provider.fetch,
      now: () => NOW,
    })

    assert.equal(provider.calls.length, 8)
    for (const call of provider.calls) {
      assert.equal(call.url.origin, 'https://api.vercel.com')
      assert.equal(call.url.searchParams.get('projectId'), 'prj_lashpop')
      assert.equal(call.url.searchParams.get('teamId'), 'team_experial')
      assert.equal(call.url.searchParams.has('slug'), false)
      assert.equal(call.url.searchParams.get('until') === '2026-08-28' || call.url.searchParams.get('until') === '2026-08-21', true)
      assert.equal(call.url.toString().includes(TOKEN), false)
      assert.equal(call.init.method, 'GET')
      assert.equal(new Headers(call.init.headers).get('Authorization'), `Bearer ${TOKEN}`)
      assert.equal(new Headers(call.init.headers).get('Accept'), 'application/json')
      assert.equal(call.init.next?.revalidate, 300)
      assert.ok(call.init.signal instanceof AbortSignal)
    }

    const countCalls = provider.calls.filter((call) =>
      call.url.pathname.endsWith('/visits/count')
    )
    assert.equal(countCalls.length, 2)
    assert.equal(countCalls.every((call) => call.url.searchParams.get('filter') === VISIT_FILTER), true)
    assert.equal(countCalls.every((call) => call.url.searchParams.has('by') === false), true)
    assert.equal(countCalls.every((call) => call.url.searchParams.has('limit') === false), true)
    assert.deepEqual(
      countCalls.map((call) => ({
        since: call.url.searchParams.get('since'),
        until: call.url.searchParams.get('until'),
      })),
      [
        { since: '2026-08-22', until: '2026-08-28' },
        { since: '2026-08-15', until: '2026-08-21' },
      ]
    )

    const visitCalls = provider.calls.filter((call) =>
      call.url.pathname.endsWith('/visits/aggregate')
    )
    assert.equal(visitCalls.length, 4)
    assert.equal(visitCalls.every((call) => call.url.searchParams.get('filter') === VISIT_FILTER), true)
    assert.deepEqual(
      visitCalls.map((call) => call.url.searchParams.getAll('by')),
      [['day'], ['referrerHostname'], ['deviceType'], ['route']]
    )

    const eventCalls = provider.calls.filter((call) =>
      call.url.pathname.endsWith('/events/aggregate')
    )
    assert.equal(eventCalls.length, 2)
    assert.equal(eventCalls.every((call) => call.url.searchParams.get('filter') === EVENT_FILTER), true)
    assert.equal(eventCalls.every((call) => call.url.searchParams.get('filter')?.includes('eventData') === false), true)
    assert.equal(eventCalls.every((call) => call.url.searchParams.get('limit') === '6'), true)
    assert.equal(eventCalls.every((call) => call.url.searchParams.getAll('by').join(',') === 'day,eventName'), true)

    const serialized = JSON.stringify(dto)
    assert.equal(serialized.includes(TOKEN), false)
    assert.equal(serialized.includes('Authorization'), false)
    assert.equal(serialized.includes('projectId'), false)
    assert.equal(serialized.includes('teamId'), false)
  })

  it('projects only aggregate non-PII fields and maps comparisons and signal ratios', async () => {
    const provider = successfulProvider()
    const dto = await getAdminAnalytics({
      range: '7d',
      config: CONFIG,
      fetch: provider.fetch,
      now: () => NOW,
    })

    assert.deepEqual(dto.range, {
      value: '7d',
      days: 7,
      current: { since: '2026-08-22', until: '2026-08-28' },
      previous: { since: '2026-08-15', until: '2026-08-21' },
    })
    assert.deepEqual(dto.overview.visitors, {
      current: 12,
      previous: 8,
      change: 4,
      changePercent: 50,
    })
    assert.deepEqual(dto.overview.pageviews, {
      current: 30,
      previous: 20,
      change: 10,
      changePercent: 50,
    })
    assert.deepEqual(dto.overview.bookingStarts, {
      current: 20,
      previous: 10,
      change: 10,
      changePercent: 100,
    })
    assert.deepEqual(dto.overview.bookingCompletions, {
      current: 10,
      previous: 2,
      change: 8,
      changePercent: 400,
    })
    assert.deepEqual(dto.conversion.bookingCompletionRate, {
      currentPercent: 50,
      previousPercent: 20,
      changePercentagePoints: 30,
    })
    assert.deepEqual(dto.conversion.quizCompletionRate, {
      currentPercent: 75,
      previousPercent: 50,
      changePercentagePoints: 25,
    })

    assert.equal(dto.dailyTraffic.length, 7)
    assert.deepEqual(dto.dailyTraffic[0], {
      date: '2026-08-22',
      visitors: 5,
      pageviews: 10,
    })
    assert.deepEqual(dto.dailyTraffic[1], {
      date: '2026-08-23',
      visitors: 0,
      pageviews: 0,
    })

    assert.deepEqual(dto.acquisition.sources[0], {
      source: 'google.com',
      visitors: 10,
      pageviews: 17,
      sharePercent: 66.7,
    })
    assert.equal(dto.acquisition.sources[1]?.source, 'Direct or not provided')
    assert.equal(dto.acquisition.sources.some((source) => source.source.includes('@')), false)
    assert.deepEqual(dto.acquisition.devices.map((row) => row.device), [
      'Mobile',
      'Desktop',
      'Other',
    ])

    assert.equal(dto.content.pages.some((page) => page.path === '/services'), true)
    assert.equal(dto.content.pages.some((page) => page.path === '/services/[slug]'), true)
    assert.equal(dto.content.pages.some((page) => page.path.includes('confirm')), false)
    assert.equal(dto.content.pages.some((page) => page.path.includes('customer')), false)

    assert.deepEqual(
      dto.conversion.events.map((row) => row.name),
      Object.values(ANALYTICS_EVENTS)
    )
    const bookingStarted = dto.conversion.events.find(
      (row) => row.name === ANALYTICS_EVENTS.bookingStarted
    )
    assert.equal(bookingStarted?.current, 20)
    assert.equal(bookingStarted?.previous, 10)
    assert.equal(bookingStarted?.daily.length, 7)
    assert.deepEqual(bookingStarted?.daily[0], { date: '2026-08-22', count: 10 })

    const serialized = JSON.stringify(dto)
    for (const privateValue of [
      'visitor-private-id',
      'period-private-id',
      '203.0.113.10',
      'operator@example.com',
      'private@example.com',
      'private answer',
      'Private Customer',
      'unknown_private_event',
      'private-token',
      'V1StGbhUoJ-vc3OSnoCTbHflC6rg3zmlt',
      '619-555-0114',
      'alice-smith',
      'referrerUrl',
      'eventData',
      'customerName',
    ]) {
      assert.equal(serialized.includes(privateValue), false, privateValue)
    }
  })

  it('accepts a team slug as the sole optional authorization scope', async () => {
    const provider = successfulProvider()
    await getAdminAnalytics({
      range: '7d',
      config: {
        token: TOKEN,
        projectId: 'prj_lashpop',
        slug: 'experial',
      },
      fetch: provider.fetch,
      now: () => NOW,
    })

    assert.equal(provider.calls.every((call) => call.url.searchParams.get('slug') === 'experial'), true)
    assert.equal(provider.calls.every((call) => call.url.searchParams.has('teamId') === false), true)
  })

  it('sanitizes config, network, HTTP, and provider-shape failures', async () => {
    await assert.rejects(
      () =>
        getAdminAnalytics({
          range: '7d',
          config: { ...CONFIG, token: undefined },
          now: () => NOW,
        }),
      (error: unknown) =>
        error instanceof AdminAnalyticsError &&
        error.code === 'INVALID_CONFIG' &&
        !error.message.includes('prj_lashpop')
    )

    await assert.rejects(
      () =>
        getAdminAnalytics({
          range: '7d',
          config: { ...CONFIG, slug: 'also-set' },
          now: () => NOW,
        }),
      (error: unknown) =>
        error instanceof AdminAnalyticsError && error.code === 'INVALID_CONFIG'
    )

    const networkFetch = (async () => {
      throw new Error(`network failure contained ${TOKEN}`)
    }) as typeof globalThis.fetch
    await assert.rejects(
      () =>
        getAdminAnalytics({
          range: '7d',
          config: CONFIG,
          fetch: networkFetch,
          now: () => NOW,
        }),
      (error: unknown) =>
        error instanceof AdminAnalyticsError &&
        error.code === 'UPSTREAM_REQUEST_FAILED' &&
        !error.message.includes(TOKEN)
    )

    const httpFetch = (async () =>
      jsonResponse(
        {
          error: `provider rejected ${TOKEN}`,
          customer: 'private@example.com',
        },
        401
      )) as typeof globalThis.fetch
    await assert.rejects(
      () =>
        getAdminAnalytics({
          range: '7d',
          config: CONFIG,
          fetch: httpFetch,
          now: () => NOW,
        }),
      (error: unknown) =>
        error instanceof AdminAnalyticsError &&
        error.code === 'UPSTREAM_REQUEST_FAILED' &&
        !error.message.includes(TOKEN) &&
        !error.message.includes('private@example.com')
    )

    const invalidShapeFetch = (async () =>
      jsonResponse({ data: { token: TOKEN } })) as typeof globalThis.fetch
    await assert.rejects(
      () =>
        getAdminAnalytics({
          range: '7d',
          config: CONFIG,
          fetch: invalidShapeFetch,
          now: () => NOW,
        }),
      (error: unknown) =>
        error instanceof AdminAnalyticsError &&
        error.code === 'UPSTREAM_RESPONSE_INVALID' &&
        !error.message.includes(TOKEN)
    )
  })
})

describe('safe analytics fixture', () => {
  it('is deterministic and includes useful views plus all six conversion events', () => {
    const first = buildAdminAnalyticsFixture('7d', NOW)
    const second = buildAdminAnalyticsFixture('7d', NOW)

    assert.deepEqual(first, second)
    assert.equal(first.source, 'fixture')
    assert.equal(first.generatedAt, NOW.toISOString())
    assert.equal(first.dailyTraffic.length, 7)
    assert.equal(first.dailyTraffic.every((point) => point.visitors > 0 && point.pageviews > 0), true)
    assert.equal(first.acquisition.sources.length >= 4, true)
    assert.equal(first.acquisition.devices.length >= 3, true)
    assert.equal(first.content.pages.length >= 5, true)
    assert.deepEqual(
      first.conversion.events.map((row) => row.name),
      Object.values(ANALYTICS_EVENTS)
    )
    assert.equal(first.conversion.events.every((row) => row.current > 0), true)
    assert.equal(first.conversion.events.every((row) => row.daily.length === 7), true)
  })
})
