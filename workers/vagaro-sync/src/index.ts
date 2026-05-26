import { sql } from 'drizzle-orm'
import { closeDb, openDb } from './db'
import {
  syncAllServices,
  syncAllTeamMembers,
  syncPublicStaff,
  type PublicStaffStats,
  type SyncStats,
} from './sync'
import { VagaroClient, type VagaroEnv } from './vagaro-client'

interface Env extends VagaroEnv {
  DATABASE_URL: string
  VAGARO_PUBLIC_BUSINESS_ID: string // numeric business ID for the public staff endpoint
}

interface Result {
  services: { success: boolean; stats?: SyncStats; error?: string }
  publicStaff: { success: boolean; stats?: PublicStaffStats; error?: string }
  teamMembers: { success: boolean; stats?: SyncStats; error?: string }
}

async function runSync(env: Env): Promise<{ result: Result; allOk: boolean }> {
  const { db, client } = openDb(env.DATABASE_URL)
  const vagaro = new VagaroClient(env)

  const result: Result = {
    services: { success: false },
    publicStaff: { success: false },
    teamMembers: { success: false },
  }

  try {
    await db.execute(sql`SELECT 1`)
  } catch (err) {
    await closeDb(client)
    throw new Error(`DB warmup failed: ${err instanceof Error ? err.message : String(err)}`)
  }

  try {
    result.services.stats = await syncAllServices(db, vagaro, env.VAGARO_PUBLIC_BUSINESS_ID)
    result.services.success = true
  } catch (err) {
    result.services.error = err instanceof Error ? err.message : String(err)
    console.error('services sync threw:', err)
  }

  // Public staff mirror (photos, bios, order, list parity) — runs BEFORE the v2
  // team sync so contact-info refreshes don't get overwritten by the older API.
  try {
    result.publicStaff.stats = await syncPublicStaff(db, env.VAGARO_PUBLIC_BUSINESS_ID)
    result.publicStaff.success = true
  } catch (err) {
    result.publicStaff.error = err instanceof Error ? err.message : String(err)
    console.error('public staff sync threw:', err)
  }

  try {
    result.teamMembers.stats = await syncAllTeamMembers(db, vagaro)
    result.teamMembers.success = true
  } catch (err) {
    result.teamMembers.error = err instanceof Error ? err.message : String(err)
    console.error('team members sync threw:', err)
  }

  await closeDb(client)

  const allOk = result.services.success && result.publicStaff.success && result.teamMembers.success
  return { result, allOk }
}

export default {
  // Cron trigger entry point — fires on the schedule in wrangler.jsonc
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`🔄 cron fired at ${new Date(event.scheduledTime).toISOString()} (${event.cron})`)
    ctx.waitUntil(
      runSync(env)
        .then(({ result, allOk }) => {
          console.log(`✅ sync complete (allOk=${allOk}):`, JSON.stringify(result))
        })
        .catch((err) => {
          console.error('❌ sync failed:', err)
          throw err
        })
    )
  },

  // HTTP entry point for manual triggers / debugging.
  // Auth via `?token=<SYNC_TRIGGER_TOKEN>` if the secret is set, otherwise open.
  async fetch(req: Request, env: Env & { SYNC_TRIGGER_TOKEN?: string }): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname === '/health') {
      return Response.json({ ok: true, ts: new Date().toISOString() })
    }
    if (url.pathname !== '/sync') {
      return new Response('not found', { status: 404 })
    }
    if (env.SYNC_TRIGGER_TOKEN) {
      const token = url.searchParams.get('token') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
      if (token !== env.SYNC_TRIGGER_TOKEN) {
        return new Response('unauthorized', { status: 401 })
      }
    }
    try {
      const { result, allOk } = await runSync(env)
      return Response.json({ success: allOk, result, ts: new Date().toISOString() }, { status: allOk ? 200 : 207 })
    } catch (err) {
      return Response.json(
        { success: false, error: err instanceof Error ? err.message : String(err), ts: new Date().toISOString() },
        { status: 503 }
      )
    }
  },
}
