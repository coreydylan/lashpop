import { RefreshCw, Clock } from 'lucide-react'
import { sql } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin/auth'
import { getDb } from '@/db'
import { teamMembers } from '@/db/schema/team_members'
import { services } from '@/db/schema/services'
import { SyncNowButton } from './SyncNowButton'

export const dynamic = 'force-dynamic'

function timeAgo(value: Date | string | null): string {
  if (!value) return 'never'
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default async function SyncsPage() {
  await requireAdmin()

  const db = getDb()
  const [team] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${teamMembers.isActive})::int`,
      lastSync: sql<Date | null>`max(${teamMembers.lastSyncedAt})`,
    })
    .from(teamMembers)
  const [svc] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${services.isActive})::int`,
      lastSync: sql<Date | null>`max(${services.lastSyncedAt})`,
    })
    .from(services)

  const cards = [
    { label: 'Team members', active: team.active, total: team.total, lastSync: team.lastSync },
    { label: 'Services', active: svc.active, total: svc.total, lastSync: svc.lastSync },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ocean-mist/30 to-ocean-mist/10 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-ocean-mist" />
          </div>
          <div>
            <h1 className="h2 text-dune">Vagaro Sync</h1>
            <p className="text-sm text-dune/60">Team, services & photos sync from Vagaro</p>
          </div>
        </div>
        <SyncNowButton />
      </div>

      <div className="mb-6 p-4 bg-ocean-mist/10 rounded-2xl border border-ocean-mist/20 flex items-center gap-2 text-sm text-dune/70">
        <Clock className="w-4 h-4 text-ocean-mist" />
        Runs automatically every 15 minutes. Use &quot;Sync from Vagaro now&quot; after editing a stylist in Vagaro to push it live immediately.
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-2xl border border-sage/20 p-5">
            <div className="text-sm text-dune/50 uppercase tracking-wider mb-1">{c.label}</div>
            <div className="text-2xl font-serif text-dune">
              {c.active}<span className="text-dune/40 text-lg"> / {c.total} active</span>
            </div>
            <div className="mt-2 text-xs text-dune/50">Last synced: {timeAgo(c.lastSync)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
