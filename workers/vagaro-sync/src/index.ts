import { openDb } from './db'
import {
  syncAllServices,
  syncPublicStaff,
  syncStylistServices,
  syncVagaroCategories,
  type CategorySyncStats,
  type PublicStaffStats,
  type StylistServicesStats,
  type SyncStats,
} from './sync'
import { serviceSyncHealthError } from './booking-health'
import { reconcileRoster, type RosterReconciliation } from './reconcile'
import { fetchPublicServicesFull, type PublicServicesPayload } from './public-services'
import { vagaroSyncRuns } from './schema'
import { eq } from 'drizzle-orm'
import { VagaroClient, type VagaroEnv, type VagaroMeteredUsage } from './vagaro-client'
import { createVagaroImageIngestor } from './cloudflare-images'

interface Env extends VagaroEnv {
  DB: D1Database
  VAGARO_PUBLIC_BUSINESS_ID: string // numeric business ID for the public staff endpoint
  CLOUDFLARE_ACCOUNT_ID: string
  CLOUDFLARE_IMAGES_ACCOUNT_HASH: string
  CLOUDFLARE_IMAGES_API_TOKEN?: string
}

interface Result {
  categories: { success: boolean; stats?: CategorySyncStats; error?: string }
  services: { success: boolean; stats?: SyncStats; error?: string }
  publicStaff: { success: boolean; stats?: PublicStaffStats; error?: string }
  stylistServices: { success: boolean; stats?: StylistServicesStats; error?: string }
  /** Cross-layer roster check run after the staff sync. */
  reconciliation?: RosterReconciliation
}

interface RecordedResult extends Result {
  meteredUsage: VagaroMeteredUsage & { projected30DayCallsAtCurrentSchedule: number }
}

const SCHEDULED_RUNS_PER_30_DAYS = 3 * 30

async function runSync(
  env: Env,
  trigger: 'cron' | 'manual',
): Promise<{ result: RecordedResult; allOk: boolean; runId: string }> {
  const db = openDb(env.DB)
  const vagaro = new VagaroClient(env)
  const imageIngestor = createVagaroImageIngestor(env)

  const result: Result = {
    categories: { success: false },
    services: { success: false },
    publicStaff: { success: false },
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
        imageIngestor,
      )
      const serviceHealthError = serviceSyncHealthError(result.services.stats)
      result.services.success = serviceHealthError === null
      if (serviceHealthError) result.services.error = serviceHealthError
    } catch (err) {
      result.services.error = err instanceof Error ? err.message : String(err)
      console.error('services sync threw:', err)
    }
  } else {
    result.services.error = 'Skipped because the Vagaro category source or mapping stage failed'
  }

  // Public staff is the canonical team source: it already provides names,
  // contact fields, photos, bios, order, and active-list parity. The former
  // v2 pass refetched every employee individually after this stage, adding 15
  // metered calls per run without supplying any field the website consumes.
  try {
    result.publicStaff.stats = await syncPublicStaff(db, env.VAGARO_PUBLIC_BUSINESS_ID, imageIngestor)
    result.publicStaff.success = result.publicStaff.stats.errors.length === 0
    if (!result.publicStaff.success) {
      result.publicStaff.error = result.publicStaff.stats.errors.join('; ')
    }
  } catch (err) {
    result.publicStaff.error = err instanceof Error ? err.message : String(err)
    console.error('public staff sync threw:', err)
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

  // Reconciliation: compare Vagaro, the source flags, and the publication
  // flags after the writes have landed. This is the check that would have
  // caught two published artists sitting hidden.
  try {
    result.reconciliation = await reconcileRoster(db, result.publicStaff.stats?.providerIdentities ?? [])
    for (const alert of result.reconciliation.alerts) {
      console.error(`[ROSTER-ALERT] ${alert}`)
    }
    for (const warning of result.reconciliation.warnings) {
      console.warn(`[ROSTER-WARN] ${warning}`)
    }
    for (const ambiguous of result.publicStaff.stats?.ambiguousNameMatches ?? []) {
      console.error(`[ROSTER-ALERT] ambiguous name match — ${ambiguous}`)
    }
    console.log(
      `[ROSTER] ${result.reconciliation.counts.activePublished} published, ` +
        `${result.reconciliation.counts.activeHiddenAcknowledged} hidden with a reason, ` +
        `${result.reconciliation.counts.activeHiddenUnexplained} hidden with no reason, ` +
        `${result.reconciliation.counts.inactivePublished} inactive rows still flagged for publication`,
    )
  } catch (err) {
    console.error('roster reconciliation threw:', err)
  }

  const allOk =
    result.categories.success &&
    result.services.success &&
    result.publicStaff.success &&
    result.stylistServices.success
  const usage = vagaro.getMeteredUsage()
  const meteredUsage: RecordedResult['meteredUsage'] = {
    ...usage,
    projected30DayCallsAtCurrentSchedule:
      usage.totalCalls * SCHEDULED_RUNS_PER_30_DAYS,
  }
  const recordedResult: RecordedResult = { ...result, meteredUsage }
  await db
    .update(vagaroSyncRuns)
    .set({
      status: allOk ? 'success' : Object.values(result).some(stage => stage.success) ? 'partial' : 'failed',
      result: recordedResult as unknown as Record<string, unknown>,
      error: allOk
        ? null
        : Object.entries(result)
            .filter(([, stage]) => stage.error)
            .map(([name, stage]) => `${name}: ${stage.error}`)
            .join(' | '),
      completedAt: new Date(),
    })
    .where(eq(vagaroSyncRuns.id, runId))

  console.log('Vagaro metered usage:', JSON.stringify(meteredUsage))
  return { result: recordedResult, allOk, runId }
}

const vagaroSyncWorker = {
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
    if (url.pathname === '/reconcile') {
      // Read-only: report the current cross-layer state without syncing.
      if (env.SYNC_TRIGGER_TOKEN) {
        const token = url.searchParams.get('token') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
        if (token !== env.SYNC_TRIGGER_TOKEN) {
          return new Response('unauthorized', { status: 401 })
        }
      }
      const reconciliation = await reconcileRoster(openDb(env.DB), [])
      return Response.json(reconciliation, { status: reconciliation.ok ? 200 : 207 })
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

export default vagaroSyncWorker
