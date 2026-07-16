import { openDb } from './db'
import {
  syncAllServices,
  syncAllTeamMembers,
  syncPublicStaff,
  syncStylistServices,
  syncVagaroCategories,
  type CategorySyncStats,
  type PublicStaffStats,
  type StylistServicesStats,
  type SyncStats,
} from './sync'
import { fetchPublicServicesFull, type PublicServicesPayload } from './public-services'
import { vagaroSyncRuns } from './schema'
import { eq } from 'drizzle-orm'
import { VagaroClient, type VagaroEnv } from './vagaro-client'

interface Env extends VagaroEnv {
  DB: D1Database
  VAGARO_PUBLIC_BUSINESS_ID: string // numeric business ID for the public staff endpoint
}

interface Result {
  categories: { success: boolean; stats?: CategorySyncStats; error?: string }
  services: { success: boolean; stats?: SyncStats; error?: string }
  publicStaff: { success: boolean; stats?: PublicStaffStats; error?: string }
  teamMembers: { success: boolean; stats?: SyncStats; error?: string }
  stylistServices: { success: boolean; stats?: StylistServicesStats; error?: string }
}

async function runSync(
  env: Env,
  trigger: 'cron' | 'manual',
): Promise<{ result: Result; allOk: boolean; runId: string }> {
  const db = openDb(env.DB)
  const vagaro = new VagaroClient(env)

  const result: Result = {
    categories: { success: false },
    services: { success: false },
    publicStaff: { success: false },
    teamMembers: { success: false },
    stylistServices: { success: false },
  }

  try {
    await env.DB.prepare('SELECT 1').first()
  } catch (err) {
    throw new Error(`DB warmup failed: ${err instanceof Error ? err.message : String(err)}`)
  }

  const runId = crypto.randomUUID()
  await db.insert(vagaroSyncRuns).values({ id: runId, trigger, status: 'running' })

  let publicPayload: PublicServicesPayload | null = null
  try {
    publicPayload = await fetchPublicServicesFull(env.VAGARO_PUBLIC_BUSINESS_ID)
    result.categories.stats = await syncVagaroCategories(db, publicPayload)
    result.categories.success = true
  } catch (err) {
    result.categories.error = err instanceof Error ? err.message : String(err)
    console.error('category taxonomy sync threw:', err)
  }

  if (publicPayload && result.categories.success) {
    try {
      result.services.stats = await syncAllServices(
        db,
        vagaro,
        env.VAGARO_PUBLIC_BUSINESS_ID,
        publicPayload,
      )
      result.services.success = result.services.stats.failed === 0
      if (!result.services.success) {
        result.services.error = `${result.services.stats.failed} service record(s) failed`
      }
    } catch (err) {
      result.services.error = err instanceof Error ? err.message : String(err)
      console.error('services sync threw:', err)
    }
  } else {
    result.services.error = 'Skipped because the Vagaro category source or mapping stage failed'
  }

  // Public staff mirror (photos, bios, order, list parity) — runs BEFORE the v2
  // team sync so contact-info refreshes don't get overwritten by the older API.
  try {
    result.publicStaff.stats = await syncPublicStaff(db, env.VAGARO_PUBLIC_BUSINESS_ID)
    result.publicStaff.success = result.publicStaff.stats.errors.length === 0
    if (!result.publicStaff.success) {
      result.publicStaff.error = result.publicStaff.stats.errors.join('; ')
    }
  } catch (err) {
    result.publicStaff.error = err instanceof Error ? err.message : String(err)
    console.error('public staff sync threw:', err)
  }

  try {
    result.teamMembers.stats = await syncAllTeamMembers(db, vagaro)
    result.teamMembers.success = result.teamMembers.stats.failed === 0
    if (!result.teamMembers.success) {
      result.teamMembers.error = `${result.teamMembers.stats.failed} team record(s) failed`
    }
  } catch (err) {
    result.teamMembers.error = err instanceof Error ? err.message : String(err)
    console.error('team members sync threw:', err)
  }

  // Per-stylist service mapping (drives the tag chips on the Find Your Stylist
  // section). MUST run after syncPublicStaff (so providerIDs are present) and
  // after syncAllServices (so services rows exist to FK to). Per-stylist
  // failures are tolerated inside syncStylistServices itself — a thrown error
  // here means the whole call broke before per-stylist iteration started.
  try {
    result.stylistServices.stats = await syncStylistServices(db, env.VAGARO_PUBLIC_BUSINESS_ID)
    result.stylistServices.success = result.stylistServices.stats.failed === 0
    if (!result.stylistServices.success) {
      result.stylistServices.error = result.stylistServices.stats.errors.join('; ')
    }
  } catch (err) {
    result.stylistServices.error = err instanceof Error ? err.message : String(err)
    console.error('stylist services sync threw:', err)
  }

  const allOk =
    result.categories.success &&
    result.services.success &&
    result.publicStaff.success &&
    result.teamMembers.success &&
    result.stylistServices.success
  await db
    .update(vagaroSyncRuns)
    .set({
      status: allOk ? 'success' : Object.values(result).some(stage => stage.success) ? 'partial' : 'failed',
      result: result as unknown as Record<string, unknown>,
      error: allOk
        ? null
        : Object.entries(result)
            .filter(([, stage]) => stage.error)
            .map(([name, stage]) => `${name}: ${stage.error}`)
            .join(' | '),
      completedAt: new Date(),
    })
    .where(eq(vagaroSyncRuns.id, runId))

  return { result, allOk, runId }
}

export default {
  // Cron trigger entry point — fires on the schedule in wrangler.jsonc
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`🔄 cron fired at ${new Date(event.scheduledTime).toISOString()} (${event.cron})`)
    ctx.waitUntil(
      runSync(env, 'cron')
        .then(({ result, allOk, runId }) => {
          console.log(`✅ sync complete (run=${runId}, allOk=${allOk}):`, JSON.stringify(result))
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
      const { result, allOk, runId } = await runSync(env, 'manual')
      return Response.json(
        { success: allOk, runId, result, ts: new Date().toISOString() },
        { status: allOk ? 200 : 207 },
      )
    } catch (err) {
      return Response.json(
        { success: false, error: err instanceof Error ? err.message : String(err), ts: new Date().toISOString() },
        { status: 503 }
      )
    }
  },
}
