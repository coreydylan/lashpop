import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'

export const runtime = 'nodejs'
export const maxDuration = 120
export const dynamic = 'force-dynamic'

// POST - Admin-triggered, on-demand Vagaro sync. Calls the lashpop-vagaro-sync
// Cloudflare worker's /sync endpoint (the same one the 3x/day cron hits), so a
// photo/bio/service change made in Vagaro shows up on the site immediately
// instead of waiting for the next scheduled run.
export async function POST() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  const base = process.env.VAGARO_SYNC_URL
  const token = process.env.VAGARO_SYNC_TOKEN
  if (!base) {
    return NextResponse.json(
      { error: 'VAGARO_SYNC_URL is not configured' },
      { status: 500 }
    )
  }

  // VAGARO_SYNC_URL may or may not already include the /sync path.
  const url = new URL(base)
  if (!url.pathname.endsWith('/sync')) {
    url.pathname = url.pathname.replace(/\/$/, '') + '/sync'
  }

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: token ? { authorization: `Bearer ${token}` } : {},
      // The full sync (services + staff + photos + mappings) can take ~30s.
      signal: AbortSignal.timeout(110_000),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok || (data as any)?.success === false) {
      return NextResponse.json(
        { error: 'Sync failed', status: res.status, result: data },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, result: data })
  } catch (error) {
    console.error('Manual Vagaro sync failed:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Failed to reach sync worker', detail: message },
      { status: 502 }
    )
  }
}
