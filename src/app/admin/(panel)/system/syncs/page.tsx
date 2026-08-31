import { AlertTriangle, CheckCircle2, Clock, Database, RefreshCw, ShieldCheck } from 'lucide-react'
import { desc, isNotNull, sql } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin/auth'
import { getDb } from '@/db'
import { teamMembers } from '@/db/schema/team_members'
import { services } from '@/db/schema/services'
import { vagaroServiceCategories } from '@/db/schema/vagaro_service_categories'
import { teamMemberServicesVagaro } from '@/db/schema/team_member_services_vagaro'
import { vagaroSyncRuns } from '@/db/schema/vagaro_sync_runs'
import { getVagaroBookingStatus } from '@/lib/vagaro-booking-readiness'
import { SyncNowButton } from './SyncNowButton'

export const dynamic = 'force-dynamic'

function timeAgo(value: Date | string | number | null): string {
  if (!value) return 'never'
  const d = value instanceof Date
    ? value
    : new Date(typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value)
  if (Number.isNaN(d.getTime())) return 'unknown'
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

type StageResult = { success?: boolean; stats?: Record<string, unknown>; error?: string }

export default async function SyncsPage() {
  await requireAdmin()

  const db = getDb()
  const [[teamRow], [serviceRow], [categoryRow], [stylistMappingsRow], bookingRows, recentRuns] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`sum(case when ${teamMembers.isActive} = 1 then 1 else 0 end)`,
        lastSync: sql<Date | null>`max(${teamMembers.lastSyncedAt})`,
      })
      .from(teamMembers),
    db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`sum(case when ${services.isActive} = 1 then 1 else 0 end)`,
        lastSync: sql<Date | null>`max(${services.lastSyncedAt})`,
      })
      .from(services),
    db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`sum(case when ${vagaroServiceCategories.isActive} = 1 then 1 else 0 end)`,
        lastSync: sql<Date | null>`max(${vagaroServiceCategories.lastSyncedAt})`,
      })
      .from(vagaroServiceCategories),
    db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(distinct ${teamMemberServicesVagaro.teamMemberId})`,
        lastSync: sql<Date | null>`max(${teamMemberServicesVagaro.syncedAt})`,
      })
      .from(teamMemberServicesVagaro),
    db
      .select({
        id: services.id,
        vagaroServiceId: services.vagaroServiceId,
        name: services.name,
        category: services.mainCategory,
        isActive: services.isActive,
        widgetUrl: services.vagaroWidgetUrl,
      })
      .from(services)
      .where(isNotNull(services.vagaroServiceId)),
    db.select().from(vagaroSyncRuns).orderBy(desc(vagaroSyncRuns.startedAt)).limit(8),
  ])

  // Aggregate queries normally return one row, including for an empty table.
  // Safe fixtures and alternate drivers may return no rows, so keep the status
  // page readable rather than dereferencing an absent aggregate.
  const emptyAggregate = { total: 0, active: 0, lastSync: null }
  const team = teamRow ?? emptyAggregate
  const svc = serviceRow ?? emptyAggregate
  const category = categoryRow ?? emptyAggregate
  const stylistMappings = stylistMappingsRow ?? emptyAggregate

  const bookingServices = bookingRows.map((service) => ({
    ...service,
    status: getVagaroBookingStatus(service),
  }))
  const activeVagaroServices = bookingServices.filter((service) => service.isActive)
  const readyActiveBookings = activeVagaroServices.filter((service) => service.status === 'ready')
  const bookingIssues = activeVagaroServices.filter((service) => service.status !== 'ready')
  const pendingServices = bookingServices.filter(
    (service) => !service.isActive && service.status === 'pending',
  )

  const cards = [
    { label: 'Booking categories', active: category.active, total: category.total, lastSync: category.lastSync, detail: 'categories shown in Vagaro' },
    { label: 'Services', active: svc.active, total: svc.total, lastSync: svc.lastSync, detail: 'active services' },
    { label: 'Ready to book', active: readyActiveBookings.length, total: activeVagaroServices.length, lastSync: svc.lastSync, detail: 'active services with a working booking link' },
    { label: 'Team members', active: team.active, total: team.total, lastSync: team.lastSync },
    { label: 'Stylists with services', active: stylistMappings.active, total: stylistMappings.total, lastSync: stylistMappings.lastSync, detail: 'stylists linked to at least one service' },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 grid gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ocean-mist/30 to-ocean-mist/10 sm:flex">
            <RefreshCw className="w-6 h-6 text-ocean-mist" />
          </div>
          <div className="min-w-0">
            <h1 className="h2 text-dune">Vagaro sync</h1>
            <p className="text-sm text-dune/60">Copies booking categories, services and team assignments from Vagaro.</p>
          </div>
        </div>
        <div className="w-full [&>div]:w-full [&>div]:flex-col [&_button]:w-full sm:w-auto sm:[&>div]:w-auto sm:[&>div]:flex-row sm:[&_button]:w-auto">
          <SyncNowButton />
        </div>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-lg border border-ocean-mist/20 bg-ocean-mist/10 p-4 text-sm text-dune/70">
        <Clock className="w-4 h-4 text-ocean-mist" />
        <div>
          <p className="font-medium text-dune">Runs automatically three times a day</p>
          <p className="mt-0.5 text-dune/60">During daylight saving time, syncs start at 11 p.m., 7 a.m. and 3 p.m. Pacific. During standard time, they start at 10 p.m., 6 a.m. and 2 p.m. Run a sync now after changing Vagaro if you cannot wait for the next one.</p>
        </div>
      </div>

      <dl className="divide-y divide-sage/15 border-y border-sage/20 bg-white sm:hidden" aria-label="Vagaro sync summary">
        {cards.map((c) => (
          <div key={c.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-3 py-3">
            <dt className="min-w-0 text-sm font-semibold text-dune">{c.label}</dt>
            <dd className="font-serif text-lg text-dune">{c.active}<span className="text-sm text-dune/45"> / {c.total}</span></dd>
            <dd className="col-span-2 mt-1 text-xs text-dune/50">Last synced: {timeAgo(c.lastSync)}</dd>
          </div>
        ))}
      </dl>

      <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-2xl border border-sage/20 p-5">
            <div className="text-sm text-dune/50 uppercase tracking-wider mb-1">{c.label}</div>
            <div className="text-2xl font-serif text-dune">
              {c.active}<span className="text-dune/40 text-lg"> / {c.total}</span>
            </div>
            {'detail' in c && c.detail && <div className="mt-1 text-[11px] text-dune/45">{c.detail}</div>}
            <div className="mt-2 text-xs text-dune/50">Last synced: {timeAgo(c.lastSync)}</div>
          </div>
        ))}
      </div>

      <section
        className={`mt-6 rounded-lg border p-4 sm:p-5 ${
          bookingIssues.length || pendingServices.length
            ? 'border-amber-300 bg-amber-50'
            : 'border-emerald-700/20 bg-emerald-50'
        }`}
      >
        <div className="flex items-start gap-3">
          {bookingIssues.length || pendingServices.length ? (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          ) : (
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-xl text-dune">
              {bookingIssues.length || pendingServices.length
                ? `${bookingIssues.length + pendingServices.length} ${bookingIssues.length + pendingServices.length === 1 ? 'service needs' : 'services need'} booking setup`
                : 'All active services have booking links'}
            </h2>
            <p className="mt-1 text-sm leading-6 text-dune/65">
              Vagaro adds services to Admin automatically. New services stay hidden from the website until their booking link is ready.
            </p>
            {(pendingServices.length > 0 || bookingIssues.length > 0) && (
              <p className="mt-2 text-xs leading-5 text-dune/55">
                In Vagaro, check the service name, category and assigned stylists. Then open Launch a service to finish the website setup.
              </p>
            )}

            {(bookingIssues.length > 0 || pendingServices.length > 0) && (
              <ul className="mt-3 grid gap-2 text-sm text-dune/75">
                {[...bookingIssues, ...pendingServices].map((service) => (
                  <li key={service.id} className="rounded-lg border border-amber-300/70 bg-white/65 px-3 py-2">
                    <span className="font-semibold text-dune">{service.name}</span>
                    <span className="text-dune/50"> · {service.category} · {bookingStatusLabel(service.status)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 grid gap-2 text-xs font-semibold sm:flex sm:flex-wrap sm:gap-x-5">
              <a href="/admin/workflows/service-launch" className="inline-flex min-h-11 items-center text-terracotta hover:text-rust">Finish service setup</a>
              <a href="/api/vagaro/catalog" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-terracotta hover:text-rust">View booking catalog</a>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-lg border border-sage/15 bg-white/65 shadow-sm sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-sage/10 px-5 py-4">
          <div>
            <h2 className="font-serif text-xl text-dune">Recent syncs</h2>
            <p className="mt-0.5 text-xs text-dune/50">Shows which parts of each sync finished.</p>
          </div>
          <Database className="h-5 w-5 text-ocean-mist" />
        </div>

        {recentRuns.length === 0 ? (
          <div className="p-8 text-center text-sm text-dune/50">No syncs recorded yet. The next automatic or manual sync will appear here.</div>
        ) : (
          <div className="divide-y divide-sage/10">
            {recentRuns.map((run) => {
              const result = (run.result ?? {}) as Record<string, StageResult>
              const stages = [
                ['categories', 'Categories'],
                ['services', 'Services'],
                ['publicStaff', 'Team members'],
                ['stylistServices', 'Stylist service links'],
              ] as const
              const ok = run.status === 'success'
              return (
                <div key={run.id} className="p-3 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {ok ? <CheckCircle2 className="h-5 w-5 text-ocean-mist" /> : <AlertTriangle className="h-5 w-5 text-golden" />}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-dune">{syncRunStatusLabel(run.status)}</span>
                          <span className="rounded-md bg-sage/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-dune/50">{syncTriggerLabel(run.trigger)}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-dune/45">Started {timeAgo(run.startedAt)}</p>
                      </div>
                    </div>
                    <div className="grid w-full grid-cols-2 gap-1.5 sm:w-auto sm:flex sm:flex-wrap sm:justify-end">
                      {stages.map(([key, label]) => {
                        const stage = result[key]
                        return (
                          <span
                            key={key}
                            title={stage?.success ? `${label} completed` : `${label} did not complete`}
                            className={`rounded-md px-2.5 py-1 text-center text-[10px] font-semibold ${
                              stage?.success
                                ? 'bg-ocean-mist/10 text-ocean-mist'
                                : 'bg-golden/10 text-golden'
                            }`}
                          >
                            {label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  {run.error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">This sync did not finish. Check the Vagaro setup, then run the sync again.</p>}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function bookingStatusLabel(status: string): string {
  if (status === 'pending') return 'Booking link not set up'
  if (status === 'identity-drift') return 'Service name or category changed'
  if (status === 'url-mismatch') return 'Booking link needs updating'
  if (status === 'retired') return 'Retired service'
  return 'Booking link ready'
}

function syncRunStatusLabel(status: string): string {
  if (status === 'success') return 'Completed'
  if (status === 'running') return 'In progress'
  if (status === 'partial') return 'Completed with issues'
  if (status === 'failed' || status === 'error') return 'Failed'
  return status.replace(/[_-]+/g, ' ')
}

function syncTriggerLabel(trigger: string): string {
  if (trigger === 'manual') return 'Run by an Admin user'
  if (trigger === 'scheduled' || trigger === 'cron') return 'Automatic'
  if (trigger === 'webhook') return 'Vagaro update'
  return trigger.replace(/[_-]+/g, ' ')
}
