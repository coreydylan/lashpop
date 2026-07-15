import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { getDb, closeDb } from '@/db'
import { syncAllServices, syncAllTeamMembers } from '@/lib/vagaro-sync'

export const runtime = 'nodejs'
export const maxDuration = 300

// Extract diagnostic fields from any error, including the wrapped postgres
// error that Drizzle hides behind a generic "Failed query" message.
function describeError(err: unknown): Record<string, unknown> {
  if (!(err instanceof Error)) return { raw: String(err) }
  const cause = (err as any).cause
  const pg = cause && typeof cause === 'object' ? cause : err
  return {
    message: err.message,
    name: err.name,
    code: (pg as any).code,
    severity: (pg as any).severity_local || (pg as any).severity,
    detail: (pg as any).detail,
    routine: (pg as any).routine,
    where: (pg as any).where,
    causeMessage: cause instanceof Error ? cause.message : undefined,
    stack: err.stack?.split('\n').slice(0, 5).join('\n'),
  }
}

// Connection-class errors that warrant a retry with a fresh pool.
function isConnectionError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const code = (err as any).code || ((err as any).cause as any)?.code
  if (typeof code === 'string') {
    // postgres.js / pg / pgBouncer codes that indicate a broken connection
    if (['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'CONNECTION_ENDED', 'CONNECTION_CLOSED', 'CONNECTION_DESTROYED', '08006', '08003', '08000', '57P01', '57P02', '57P03'].includes(code)) {
      return true
    }
  }
  const msg = err.message?.toLowerCase() ?? ''
  return (
    msg.includes('connection') ||
    msg.includes('sasl') ||
    msg.includes('eof') ||
    msg.includes('terminated') ||
    msg.includes('prepared statement')
  )
}

async function warmupDb(maxAttempts = 3): Promise<{ ok: true } | { ok: false; error: Record<string, unknown>; attempts: number }> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const db = getDb()
      await db.run(sql`SELECT 1`)
      if (attempt > 1) console.log(`  ✓ DB warm-up succeeded on attempt ${attempt}`)
      return { ok: true }
    } catch (err) {
      const info = describeError(err)
      console.error(`  ⚠️ DB warm-up attempt ${attempt}/${maxAttempts} failed:`, info)
      // If the connection is broken, drop the pool so the next attempt opens a fresh one.
      if (isConnectionError(err)) {
        try { await closeDb() } catch {}
      }
      if (attempt === maxAttempts) {
        return { ok: false, error: info, attempts: attempt }
      }
      await new Promise(r => setTimeout(r, 500 * attempt))
    }
  }
  return { ok: false, error: { message: 'unreachable' }, attempts: maxAttempts }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('🔄 Starting Vagaro services + team sync...')

  const warmup = await warmupDb()
  if (!warmup.ok) {
    console.error('❌ Aborting sync — DB unreachable after warmup retries')
    return NextResponse.json({
      success: false,
      stage: 'warmup',
      attempts: warmup.attempts,
      error: warmup.error,
      timestamp: new Date().toISOString(),
    }, { status: 503 })
  }

  const results: {
    services: { success: boolean; stats?: { synced: number; failed: number; total: number }; error: Record<string, unknown> | null }
    teamMembers: { success: boolean; stats?: { synced: number; failed: number; total: number }; error: Record<string, unknown> | null }
  } = {
    services: { success: false, error: null },
    teamMembers: { success: false, error: null }
  }

  try {
    results.services.stats = await syncAllServices()
    results.services.success = true
  } catch (error) {
    const info = describeError(error)
    console.error('❌ Service sync failed:', info)
    results.services.error = info
  }

  try {
    results.teamMembers.stats = await syncAllTeamMembers()
    results.teamMembers.success = true
  } catch (error) {
    const info = describeError(error)
    console.error('❌ Team member sync failed:', info)
    results.teamMembers.error = info
  }

  const allSucceeded = results.services.success && results.teamMembers.success

  return NextResponse.json({
    success: allSucceeded,
    timestamp: new Date().toISOString(),
    results
  }, { status: allSucceeded ? 200 : 207 })
}
