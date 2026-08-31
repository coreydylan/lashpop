import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const routeSource = readFileSync(
  new URL('../app/api/admin/analytics/route.ts', import.meta.url),
  'utf8'
)
const proxySource = readFileSync(new URL('../proxy.ts', import.meta.url), 'utf8')
const authSource = readFileSync(new URL('./admin/auth.ts', import.meta.url), 'utf8')
const boardSource = readFileSync(
  new URL('../components/admin-analytics/AnalyticsBoard.tsx', import.meta.url),
  'utf8'
)
const rootLayoutSource = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8')
const publicAnalyticsSource = readFileSync(
  new URL('../components/analytics/PublicWebAnalytics.tsx', import.meta.url),
  'utf8'
)
const interactionAnalyticsSource = readFileSync(
  new URL('../components/analytics/InteractionAnalytics.tsx', import.meta.url),
  'utf8'
)
const marketingAnalyticsSource = readFileSync(
  new URL('../components/analytics/MarketingAnalytics.tsx', import.meta.url),
  'utf8'
)

describe('admin analytics route boundary', () => {
  it('authorizes before reading analytics and fails closed on credentials and fixtures', () => {
    const authIndex = routeSource.indexOf('requireAdminApi()')
    const providerIndex = routeSource.indexOf('getAdminAnalytics({')

    assert.ok(authIndex >= 0)
    assert.ok(providerIndex > authIndex)
    assert.match(routeSource, /token:\s*process\.env\.VERCEL_ANALYTICS_ACCESS_TOKEN/)
    assert.doesNotMatch(routeSource, /process\.env\.VERCEL_TOKEN/)
    assert.doesNotMatch(routeSource, /process\.env\.VERCEL_ACCESS_TOKEN/)
    assert.match(routeSource, /VERCEL_ENV === 'development'/)
    assert.match(routeSource, /VERCEL_ENV === 'preview'/)
  })

  it('keeps every auth and analytics response private and non-cacheable', () => {
    for (const source of [routeSource, proxySource, authSource]) {
      assert.match(source, /private, no-store, max-age=0/)
      assert.match(source, /X-Content-Type-Options/)
    }
    assert.match(proxySource, /pathname\.startsWith\("\/api\/admin"\)/)
    assert.match(routeSource, /if \(auth instanceof NextResponse\)/)
  })

  it('keeps provider credentials and raw session fields outside the client board', () => {
    assert.doesNotMatch(boardSource, /VERCEL_/)
    assert.doesNotMatch(boardSource, /Authorization/)
    assert.doesNotMatch(boardSource, /sessionToken/)
    assert.doesNotMatch(boardSource, /eventData/)
  })

  it('drops private routes before Vercel records them', () => {
    assert.match(rootLayoutSource, /PublicWebAnalytics/)
    assert.doesNotMatch(rootLayoutSource, /@vercel\/analytics\/react/)
    assert.match(publicAnalyticsSource, /@vercel\/analytics\/next/)
    assert.match(publicAnalyticsSource, /@vercel\/speed-insights\/next/)
    assert.match(publicAnalyticsSource, /beforeSend=\{keepPublicEvent\}/)
    assert.match(publicAnalyticsSource, /<SpeedInsights/)
    assert.match(publicAnalyticsSource, /isPublicAnalyticsUrl/)
  })

  it('blocks form content and network bodies from replay and autocapture', () => {
    assert.match(interactionAnalyticsSource, /PRIVATE_INTERACTION_SELECTOR/)
    assert.match(interactionAnalyticsSource, /AUTOCAPTURE_IGNORE_SELECTORS/)
    assert.match(interactionAnalyticsSource, /recordBody:\s*false/)
    assert.match(interactionAnalyticsSource, /recordHeaders:\s*false/)
    assert.match(interactionAnalyticsSource, /before_send/)
    assert.match(interactionAnalyticsSource, /keepInteractionAnalyticsEvent\(window\.location\.pathname, event\)/)
  })

  it('keeps dormant marketing trackers off private routes', () => {
    assert.match(marketingAnalyticsSource, /isInteractionAnalyticsAllowedPath\(pathname\)/)
    assert.match(marketingAnalyticsSource, /if \(!allowedPath\) return/)
    assert.match(marketingAnalyticsSource, /allowedPath && marketingTrackingEnabled/)
  })
})
