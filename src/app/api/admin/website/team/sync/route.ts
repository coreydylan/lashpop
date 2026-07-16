import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'

export const runtime = 'nodejs'
export const maxDuration = 120
export const dynamic = 'force-dynamic'

const SYNC_STAGES = ['categories', 'services', 'publicStaff', 'teamMembers', 'stylistServices'] as const

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function summarizeStats(value: unknown): Record<string, number | boolean> | null {
  const stats = asRecord(value)
  if (!stats) return null

  const summary: Record<string, number | boolean> = {}
  for (const [key, item] of Object.entries(stats)) {
    if (typeof item === 'number' && Number.isFinite(item)) summary[key] = item
    if (typeof item === 'boolean') summary[key] = item
    if (Array.isArray(item)) summary[`${key}Count`] = item.length
  }
  return summary
}

function summarizeSyncResult(value: unknown) {
  const payload = asRecord(value)
  const stages = asRecord(payload?.result)
  return {
    success: typeof payload?.success === 'boolean' ? payload.success : null,
    runId: typeof payload?.runId === 'string' ? payload.runId : null,
    stages: Object.fromEntries(SYNC_STAGES.map((name) => {
      const stage = asRecord(stages?.[name])
      return [name, {
        success: typeof stage?.success === 'boolean' ? stage.success : null,
        hasError: typeof stage?.error === 'string' && stage.error.length > 0,
        stats: summarizeStats(stage?.stats),
      }]
    })),
  }
}

// POST - Admin-triggered, on-demand Vagaro sync. Calls the lashpop-vagaro-sync
// Cloudflare worker's /sync endpoint (the same one the 15-minute cron hits), so
// taxonomy/service/staff changes made in Vagaro show up on the site immediately
// instead of waiting for the next scheduled run.
export async function POST() {
  const auth = await requireAdminApi(['owner', 'publisher'])
  if (auth instanceof NextResponse) return auth

  const startedAt = Date.now()
  const requested = {
    trigger: 'manual',
    scope: 'full',
    stages: [...SYNC_STAGES],
  }
  await recordAdminAction({
    action: 'vagaro.sync.requested',
    surface: 'admin',
    targetType: 'vagaro_sync',
    targetId: 'full',
    actorUserId: auth.userId,
    diff: { requested },
  })

  const base = process.env.VAGARO_SYNC_URL
  const token = process.env.VAGARO_SYNC_TOKEN
  if (!base) {
    await recordAdminAction({
      action: 'vagaro.sync.failed',
      surface: 'admin',
      targetType: 'vagaro_sync',
      targetId: 'full',
      actorUserId: auth.userId,
      diff: {
        requested,
        outcome: { status: 'failed', reason: 'not_configured', durationMs: Date.now() - startedAt },
      },
    })
    return NextResponse.json(
      { error: 'VAGARO_SYNC_URL is not configured' },
      { status: 500 }
    )
  }

  try {
    // VAGARO_SYNC_URL may or may not already include the /sync path.
    const url = new URL(base)
    if (!url.pathname.endsWith('/sync')) {
      url.pathname = url.pathname.replace(/\/$/, '') + '/sync'
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: token ? { authorization: `Bearer ${token}` } : {},
      // The full sync (taxonomy + services + staff + photos + mappings) can take ~30s.
      signal: AbortSignal.timeout(110_000),
    })

    const data = await res.json().catch(() => ({}))
    const summary = summarizeSyncResult(data)
    if (!res.ok || summary.success === false) {
      await recordAdminAction({
        action: 'vagaro.sync.failed',
        surface: 'admin',
        targetType: 'vagaro_sync',
        targetId: summary.runId ?? 'full',
        actorUserId: auth.userId,
        diff: {
          requested,
          outcome: {
            status: 'failed',
            httpStatus: res.status,
            durationMs: Date.now() - startedAt,
            worker: summary,
          },
        },
      })
      return NextResponse.json(
        { error: 'Sync failed', status: res.status, result: data },
        { status: 502 }
      )
    }

    await recordAdminAction({
      action: 'vagaro.sync.completed',
      surface: 'admin',
      targetType: 'vagaro_sync',
      targetId: summary.runId ?? 'full',
      actorUserId: auth.userId,
      diff: {
        requested,
        outcome: {
          status: 'completed',
          httpStatus: res.status,
          durationMs: Date.now() - startedAt,
          worker: summary,
        },
      },
    })

    return NextResponse.json({ success: true, result: data })
  } catch (error) {
    console.error('Manual Vagaro sync failed:', error)
    const message = error instanceof Error ? error.message : String(error)
    await recordAdminAction({
      action: 'vagaro.sync.failed',
      surface: 'admin',
      targetType: 'vagaro_sync',
      targetId: 'full',
      actorUserId: auth.userId,
      diff: {
        requested,
        outcome: {
          status: 'failed',
          reason: 'worker_unreachable',
          errorType: error instanceof Error ? error.name : 'unknown',
          durationMs: Date.now() - startedAt,
        },
      },
    })
    return NextResponse.json(
      { error: 'Failed to reach sync worker', detail: message },
      { status: 502 }
    )
  }
}
