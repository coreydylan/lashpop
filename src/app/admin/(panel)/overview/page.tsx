import Link from 'next/link'
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, Inbox, RefreshCw, Star } from 'lucide-react'
import { getDb } from '@/db'
import { adminAuditLog } from '@/db/schema/admin_audit_log'
import { homepageReviews, websiteSettings } from '@/db/schema/website_settings'
import { newsletterSubscriptions } from '@/db/schema/newsletter_subscriptions'
import { reviews } from '@/db/schema/reviews'
import { vagaroSyncRuns } from '@/db/schema/vagaro_sync_runs'
import { workWithUsSubmissions } from '@/db/schema/work_with_us_submissions'
import { user as userSchema } from '@/db/schema/auth_user'
import { requireAdmin } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

const EXPECTED_SETTINGS = [
  'founder_letter',
  'hero_content',
  'hero_archway',
  'hero_slideshow_assignments',
  'hero_slideshow_presets',
  'homepage_services',
  'instagram_carousel',
  'review_pipeline',
  'seo_metadata',
  'studio',
  'work_with_us_content',
] as const

export default async function TodayPage() {
  const session = await requireAdmin()
  const db = getDb()
  const [
    [unscored],
    [pinned],
    [subscribers],
    [applications],
    latestRuns,
    configuredRows,
    activity,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(reviews).where(and(isNull(reviews.qualityScore), eq(reviews.showOnWebsite, true))),
    db.select({ count: sql<number>`count(*)` }).from(homepageReviews).where(eq(homepageReviews.isPinned, true)),
    db.select({ count: sql<number>`count(*)` }).from(newsletterSubscriptions),
    db.select({ count: sql<number>`count(*)` }).from(workWithUsSubmissions),
    db.select().from(vagaroSyncRuns).orderBy(desc(vagaroSyncRuns.startedAt)).limit(1),
    db.select({ section: websiteSettings.section }).from(websiteSettings).where(inArray(websiteSettings.section, [...EXPECTED_SETTINGS])),
    db
      .select({
        id: adminAuditLog.id,
        action: adminAuditLog.action,
        targetType: adminAuditLog.targetType,
        targetId: adminAuditLog.targetId,
        createdAt: adminAuditLog.createdAt,
        actorName: userSchema.name,
        actorEmail: userSchema.email,
      })
      .from(adminAuditLog)
      .leftJoin(userSchema, eq(adminAuditLog.actorUserId, userSchema.id))
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(8),
  ])

  const latestRun = latestRuns[0]
  const syncAge = latestRun ? Date.now() - new Date(latestRun.startedAt).getTime() : Number.POSITIVE_INFINITY
  const syncHealthy = latestRun?.status === 'success' && syncAge < 45 * 60 * 1000
  const configured = new Set(configuredRows.map((row) => row.section))
  const defaultOnly = EXPECTED_SETTINGS.filter((section) => !configured.has(section))
  const tasks = [
    unscored.count > 0 ? { label: `Score ${unscored.count} public ${unscored.count === 1 ? 'review' : 'reviews'}`, detail: 'Fresh reviews need the reputation pipeline or a manual pass.', href: '/admin/website/reviews', tone: 'attention' as const } : null,
    !syncHealthy ? { label: 'Check the Vagaro sync', detail: latestRun ? `Latest run is ${latestRun.status} from ${formatWhen(latestRun.startedAt)}.` : 'No sync run has been recorded.', href: '/admin/system/syncs', tone: 'attention' as const } : null,
    defaultOnly.length > 0 ? { label: `Confirm ${defaultOnly.length} default-backed website ${defaultOnly.length === 1 ? 'section' : 'sections'}`, detail: 'They work today, but no admin-confirmed row has been saved yet.', href: '/admin/website', tone: 'normal' as const } : null,
    { label: 'Verify Fine Line Tattoos end to end', detail: 'Confirm booking order, copy, imagery, and Evie + Kelly Richter’s profile chips.', href: '/admin/workflows/service-launch?category=fine-line-tattoos', tone: 'normal' as const },
  ].filter(Boolean) as Array<{ label: string; detail: string; href: string; tone: 'attention' | 'normal' }>

  return (
    <div className="space-y-8">
      <header className="grid gap-5 border-b border-black/10 pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9f4c33]">Today</p>
          <h1 className="mt-2 font-serif text-4xl">Good {dayPart()}, {firstName(session.name)}.</h1>
          <p className="mt-2 text-sm text-black/55">Start with anything that can change what clients see or book.</p>
        </div>
        <div className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-semibold ${syncHealthy ? 'border-emerald-700/20 bg-emerald-50 text-emerald-800' : 'border-amber-700/20 bg-amber-50 text-amber-900'}`}>
          {syncHealthy ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
          Vagaro {syncHealthy ? 'current' : 'needs attention'}
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Operational summary">
        <Metric icon={Star} label="Reviews to score" value={unscored.count} href="/admin/website/reviews" />
        <Metric icon={ClipboardCheck} label="Homepage pins" value={pinned.count} href="/admin/website/reviews" />
        <Metric icon={Inbox} label="Applications" value={applications.count} href="/admin/inbox/work-with-us" />
        <Metric icon={RefreshCw} label="Subscribers" value={subscribers.count} href="/admin/inbox/newsletter" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div><h2 className="font-serif text-2xl">Work queue</h2><p className="mt-1 text-xs text-black/50">Ordered by public impact.</p></div>
            <span className="text-xs font-semibold text-black/40">{tasks.length} items</span>
          </div>
          <ol className="overflow-hidden rounded-xl border border-black/10 bg-white divide-y divide-black/10">
            {tasks.map((task, index) => (
              <li key={task.label}>
                <Link href={task.href} className="group grid gap-3 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center hover:bg-black/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c96f50]">
                  <span className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold ${task.tone === 'attention' ? 'bg-amber-100 text-amber-800' : 'bg-black/[0.05] text-black/55'}`}>{index + 1}</span>
                  <span><span className="block text-sm font-semibold">{task.label}</span><span className="mt-1 block text-xs leading-5 text-black/50">{task.detail}</span></span>
                  <ArrowRight className="size-4 text-black/30 transition-transform group-hover:translate-x-0.5 group-hover:text-[#9f4c33]" />
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <div className="mb-3"><h2 className="font-serif text-2xl">Recent changes</h2><p className="mt-1 text-xs text-black/50">The central log is expanding as editors move to the new foundation.</p></div>
          <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
            {activity.length === 0 ? <p className="p-6 text-sm text-black/50">No persistent changes recorded yet.</p> : (
              <ul className="divide-y divide-black/10">
                {activity.map((entry) => (
                  <li key={entry.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="truncate font-mono text-xs text-[#9f4c33]">{entry.action}</p><p className="mt-1 truncate text-xs text-black/45">{entry.actorName || entry.actorEmail || 'system'}{entry.targetType ? ` · ${entry.targetType}` : ''}{entry.targetId ? `:${entry.targetId}` : ''}</p></div>
                      <time className="shrink-0 text-[10px] text-black/35">{formatWhen(entry.createdAt)}</time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/system/audit-log" className="flex min-h-11 items-center justify-center gap-2 border-t border-black/10 text-xs font-semibold text-black/55 hover:text-[#9f4c33]">View activity history <ArrowRight className="size-3.5" /></Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function Metric({ icon: Icon, label, value, href }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; href: string }) {
  return <Link href={href} className="rounded-xl border border-black/10 bg-white p-5 hover:border-[#c96f50]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]"><div className="flex items-center justify-between"><Icon className="size-4 text-[#9f4c33]" /><ArrowRight className="size-3.5 text-black/25" /></div><p className="mt-5 font-serif text-3xl">{value}</p><p className="mt-1 text-xs text-black/50">{label}</p></Link>
}

function firstName(name: string | null): string {
  return name?.trim().split(/\s+/)[0] || 'there'
}

function dayPart(): string {
  const hour = new Date().getHours()
  return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
}

function formatWhen(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date)
}
