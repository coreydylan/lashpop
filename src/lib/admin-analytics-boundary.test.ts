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
})
