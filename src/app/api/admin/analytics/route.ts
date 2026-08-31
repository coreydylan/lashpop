import { NextRequest, NextResponse } from 'next/server'
import {
  AdminAnalyticsError,
  buildAdminAnalyticsFixture,
  getAdminAnalytics,
  parseAdminAnalyticsRange,
  type AdminAnalyticsErrorCode,
} from '@/lib/admin-analytics'
import { requireAdminApi } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
}

const SAFE_ERROR_COPY: Partial<Record<AdminAnalyticsErrorCode, string>> = {
  INVALID_CONFIG: 'Website analytics is not connected.',
  INVALID_RANGE: 'Choose 7, 30 or 90 days.',
  UPSTREAM_REQUEST_FAILED: 'Website data could not be loaded. Try again.',
  UPSTREAM_RESPONSE_INVALID: 'Website data could not be read. Try again.',
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) {
    for (const [name, value] of Object.entries(PRIVATE_HEADERS)) {
      auth.headers.set(name, value)
    }
    return auth
  }

  let range
  try {
    range = parseAdminAnalyticsRange(request.nextUrl.searchParams.get('range'))
  } catch {
    return privateJson(
      { error: { code: 'invalid_range', message: 'Choose 7, 30 or 90 days.' } },
      400
    )
  }

  try {
    const useFixture = process.env.LASHPOP_ANALYTICS_FIXTURE === '1'
      && (process.env.VERCEL_ENV === 'development' || process.env.VERCEL_ENV === 'preview')

    const data = useFixture
      ? buildAdminAnalyticsFixture(range)
      : await getAdminAnalytics({
          range,
          config: {
            // Do not fall back to the general Vercel CLI/owner token. This
            // route must be enabled intentionally with a dedicated secret.
            token: process.env.VERCEL_ANALYTICS_ACCESS_TOKEN,
            projectId: process.env.VERCEL_ANALYTICS_PROJECT_ID
              || process.env.VERCEL_PROJECT_ID
              || '',
            teamId: process.env.VERCEL_ANALYTICS_TEAM_ID
              || process.env.VERCEL_TEAM_ID,
          },
        })

    return privateJson({ data }, 200)
  } catch (error) {
    if (error instanceof AdminAnalyticsError) {
      const message = SAFE_ERROR_COPY[error.code]
        || 'Website data is temporarily unavailable.'
      const status = error.code === 'INVALID_RANGE'
        ? 400
        : error.code === 'INVALID_CONFIG'
          ? 503
          : 502
      return privateJson({ error: { code: publicErrorCode(error.code), message } }, status)
    }

    console.error('[Admin analytics] Unexpected read failure')
    return privateJson(
      { error: { code: 'unexpected_error', message: 'Website data is temporarily unavailable.' } },
      500
    )
  }
}

function privateJson(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: PRIVATE_HEADERS })
}

function publicErrorCode(code: AdminAnalyticsErrorCode) {
  if (code === 'INVALID_RANGE') return 'invalid_range'
  if (code === 'INVALID_CONFIG') return 'configuration_required'
  if (code === 'UPSTREAM_RESPONSE_INVALID') return 'invalid_response'
  return 'provider_unavailable'
}
