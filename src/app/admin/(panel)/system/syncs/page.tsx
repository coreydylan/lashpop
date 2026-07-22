import { AlertTriangle, CheckCircle2, Clock, Database, RefreshCw } from 'lucide-react'
import { desc, sql } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin/auth'
import { getDb } from '@/db'
import { teamMembers } from '@/db/schema/team_members'
import { services } from '@/db/schema/services'
import { vagaroServiceCategories } from '@/db/schema/vagaro_service_categories'
import { teamMemberServicesVagaro } from '@/db/schema/team_member_services_vagaro'
import { vagaroSyncRuns } from '@/db/schema/vagaro_sync_runs'
import { SyncNowButton } from './SyncNowButton'

export const dynamic = 'force-dynamic'

function timeAgo(value: Date | string | null): string {
  if (!value) return 'never'
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

type StageResult = { success?: boolean; stats?: Record<string, unknown>; error?: string }

export default async function SyncsPage() {
  await requireAdmin()

  const db = getDb()
  const [[team], [svc], [category], [stylistMappings], recentRuns] = await Promise.all([
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
    db.select().from(vagaroSyncRuns).orderBy(desc(vagaroSyncRuns.startedAt)).limit(8),
  ])

  const cards = [
    { label: 'Booking categories', active: category.active, total: category.total, lastSync: category.lastSync, detail: 'active categories' },
    { label: 'Services', active: svc.active, total: svc.total, lastSync: svc.lastSync, detail: 'active services' },
    { label: 'Team members', active: team.active, total: team.total, lastSync: team.lastSync },
    { label: 'Stylist mappings', active: stylistMappings.active, total: stylistMappings.total, lastSync: stylistMappings.lastSync, detail: 'stylists / service links' },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ocean-mist/30 to-ocean-mist/10 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-ocean-mist" />
          </div>
          <div>
            <h1 className="h2 text-dune">Vagaro Sync</h1>
            <p className="text-sm text-dune/60">Category → service → public staff → stylist mapping pipeline</p>
          </div>
        </div>
        <SyncNowButton />
      </div>

      <div className="mb-6 p-4 bg-ocean-mist/10 rounded-2xl border border-ocean-mist/20 flex items-start gap-3 text-sm text-dune/70">
        <Clock className="w-4 h-4 text-ocean-mist" />
        <div>
          <p className="font-medium text-dune">Automatic three times daily</p>
          <p className="mt-0.5 text-dune/60">Runs start at 6:00, 14:00, and 22:00 UTC. Use the manual trigger after a Vagaro edit when you do not want to wait.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <section className="mt-8 overflow-hidden rounded-3xl border border-sage/15 bg-white/65 shadow-sm">
        <div className="flex items-center justify-between border-b border-sage/10 px-5 py-4">
          <div>
            <h2 className="font-serif text-xl text-dune">Recent runs</h2>
            <p className="mt-0.5 text-xs text-dune/50">Every stage is recorded so partial syncs are visible.</p>
          </div>
          <Database className="h-5 w-5 text-ocean-mist" />
        </div>

        {recentRuns.length === 0 ? (
          <div className="p-8 text-center text-sm text-dune/50">No recorded runs yet. The next manual or scheduled sync will appear here.</div>
        ) : (
          <div className="divide-y divide-sage/10">
            {recentRuns.map((run) => {
              const result = (run.result ?? {}) as Record<string, StageResult>
              const stages = [
                ['categories', 'Categories'],
                ['services', 'Services'],
                ['publicStaff', 'Public staff'],
                ['stylistServices', 'Stylist services'],
              ] as const
              const ok = run.status === 'success'
              return (
                <div key={run.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {ok ? <CheckCircle2 className="h-5 w-5 text-ocean-mist" /> : <AlertTriangle className="h-5 w-5 text-golden" />}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize text-dune">{run.status}</span>
                          <span className="rounded-full bg-sage/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-dune/50">{run.trigger}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-dune/45">{timeAgo(run.startedAt)} · run {run.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {stages.map(([key, label]) => {
                        const stage = result[key]
                        return (
                          <span
                            key={key}
                            title={stage?.error || label}
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
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
                  {run.error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{run.error}</p>}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
