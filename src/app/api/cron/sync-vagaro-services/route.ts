import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * Legacy Vercel cron compatibility route.
 *
 * There is no Vercel schedule attached to this route anymore. If an external
 * scheduler still calls it, forward exactly one run to the cost-controlled
 * Cloudflare Worker instead of starting a second authenticated Vagaro sync in
 * this process.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const base = process.env.VAGARO_SYNC_URL
  if (!base) {
    return NextResponse.json(
      { error: 'VAGARO_SYNC_URL is not configured; refusing an unmetered legacy sync' },
      { status: 503 },
    )
  }

  try {
    const url = new URL(base)
    if (!url.pathname.endsWith('/sync')) {
      url.pathname = url.pathname.replace(/\/$/, '') + '/sync'
    }

    const token = process.env.VAGARO_SYNC_TOKEN
    const response = await fetch(url, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
      signal: AbortSignal.timeout(110_000),
    })
    const payload = await response.json().catch(() => ({}))
    return NextResponse.json(payload, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reach the canonical Vagaro sync Worker' },
      { status: 502 },
    )
  }
}
