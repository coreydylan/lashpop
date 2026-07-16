import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock3, History, RefreshCw, ShieldCheck, Users, XCircle } from 'lucide-react'
import { desc, eq, isNotNull, or, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { adminAuditLog } from '@/db/schema/admin_audit_log'
import { user as userSchema } from '@/db/schema/auth_user'
import { vagaroSyncRuns } from '@/db/schema/vagaro_sync_runs'
import { isAdminRole, requireAdmin, type AdminRole } from '@/lib/admin/auth'

export const metadata: Metadata = {
  title: 'Settings — LashPop Admin',
}

export const dynamic = 'force-dynamic'

const ROLE_LABELS: Record<AdminRole, string> = {
  owner: 'Owner',
  publisher: 'Publisher',
  viewer: 'Viewer',
}

const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  owner: 'Full access, including roles and system controls.',
  publisher: 'Can edit and publish website, review, and media content.',
  viewer: 'Read-only access for verification and support.',
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return 'No activity recorded'
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default async function SettingsOverviewPage() {
  const session = await requireAdmin()
  const db = getDb()

  const [latestRuns, adminUsers, [auditSummary]] = await Promise.all([
    db
      .select({
        id: vagaroSyncRuns.id,
        status: vagaroSyncRuns.status,
        trigger: vagaroSyncRuns.trigger,
        startedAt: vagaroSyncRuns.startedAt,
        completedAt: vagaroSyncRuns.completedAt,
        error: vagaroSyncRuns.error,
      })
      .from(vagaroSyncRuns)
      .orderBy(desc(vagaroSyncRuns.startedAt))
      .limit(1),
    db
      .select({
        adminRole: userSchema.adminRole,
        damAccess: userSchema.damAccess,
      })
      .from(userSchema)
      .where(or(isNotNull(userSchema.adminRole), eq(userSchema.damAccess, true))),
    db
      .select({
        total: sql<number>`count(*)`,
        latestAt: sql<Date | null>`max(${adminAuditLog.createdAt})`,
      })
      .from(adminAuditLog),
  ])

  const roleCounts: Record<AdminRole, number> = { owner: 0, publisher: 0, viewer: 0 }
  for (const adminUser of adminUsers) {
    const role = isAdminRole(adminUser.adminRole)
      ? adminUser.adminRole
      : adminUser.damAccess
        ? 'owner'
        : null
    if (role) roleCounts[role] += 1
  }

  const currentRole = session.role ?? 'viewer'
  const latestRun = latestRuns[0]
  const syncState = getSyncState(latestRun?.status)
  const auditCount = Number(auditSummary?.total ?? 0)

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="border-b border-black/10 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">Settings</p>
        <h1 className="mt-2 font-serif text-3xl text-[#292a27] sm:text-4xl">Access and system health</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60">
          See who can operate the admin, whether Vagaro is current, and what persistent changes have been recorded.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1.9fr]" aria-label="Your access and system status">
        <article className="rounded-xl border border-black/10 bg-[#20211f] p-5 text-white sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">Your access</p>
              <h2 className="mt-2 font-serif text-3xl">{ROLE_LABELS[currentRole]}</h2>
            </div>
            <span className="flex size-11 items-center justify-center rounded-xl bg-white/10 text-[#e38a69]">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/65">{ROLE_DESCRIPTIONS[currentRole]}</p>
          <p className="mt-5 truncate border-t border-white/10 pt-4 text-xs text-white/45">
            Signed in as {session.name || session.email || session.phoneNumber || 'admin'}
          </p>
        </article>

        <article className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-black/45">Vagaro connection</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-3xl text-[#292a27]">{syncState.heading}</h2>
                <StatusPill tone={syncState.tone} label={syncState.label} />
              </div>
            </div>
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#557d79]/10 text-[#426b67]">
              <RefreshCw className="size-5" aria-hidden="true" />
            </span>
          </div>
          <dl className="mt-5 grid gap-3 border-t border-black/10 pt-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-black/45">Latest run</dt>
              <dd className="mt-1 font-medium text-[#292a27]">{formatDate(latestRun?.completedAt ?? latestRun?.startedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-black/45">Trigger</dt>
              <dd className="mt-1 font-medium capitalize text-[#292a27]">{latestRun?.trigger ?? 'No runs yet'}</dd>
            </div>
          </dl>
          {latestRun?.error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{latestRun.error}</p>}
          <SettingsLink href="/admin/system/syncs" label="Open Vagaro sync" />
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Administration summaries">
        <article className="flex min-h-64 flex-col rounded-xl border border-black/10 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-black/45">Admin access</p>
              <h2 className="mt-2 font-serif text-3xl text-[#292a27]">
                {adminUsers.length} {adminUsers.length === 1 ? 'person' : 'people'}
              </h2>
            </div>
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#c96f50]/10 text-[#a14f35]">
              <Users className="size-5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {(Object.keys(ROLE_LABELS) as AdminRole[]).map((role) => (
              <div key={role} className="rounded-lg border border-black/10 bg-[#f8f4ee] px-3 py-3">
                <p className="text-xl font-semibold text-[#292a27]">{roleCounts[role]}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-black/45">{ROLE_LABELS[role]}</p>
              </div>
            ))}
          </div>
          <SettingsLink href="/admin/dam-users" label="Manage admin access" />
        </article>

        <article className="flex min-h-64 flex-col rounded-xl border border-black/10 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-black/45">Activity history</p>
              <h2 className="mt-2 font-serif text-3xl text-[#292a27]">
                {auditCount} {auditCount === 1 ? 'recorded change' : 'recorded changes'}
              </h2>
            </div>
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#9a7a42]/10 text-[#765c2f]">
              <History className="size-5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-5 rounded-lg border border-black/10 bg-[#f8f4ee] px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-black/45">
              <Clock3 className="size-4" aria-hidden="true" /> Latest recorded activity
            </div>
            <p className="mt-2 text-sm font-medium text-[#292a27]">{formatDate(auditSummary?.latestAt)}</p>
          </div>
          <p className="mt-4 text-xs leading-5 text-black/50">This count covers the central admin audit log. Detailed DAM interaction history is stored separately.</p>
          <SettingsLink href="/admin/system/audit-log" label="View activity history" />
        </article>
      </section>
    </div>
  )
}

function getSyncState(status: string | undefined): { heading: string; label: string; tone: 'good' | 'warning' | 'bad' | 'neutral' } {
  switch (status) {
    case 'success':
      return { heading: 'Connected', label: 'Latest run succeeded', tone: 'good' }
    case 'running':
      return { heading: 'Syncing now', label: 'Run in progress', tone: 'warning' }
    case 'failed':
    case 'error':
      return { heading: 'Needs attention', label: 'Latest run failed', tone: 'bad' }
    default:
      return { heading: 'Not verified', label: 'No recorded run', tone: 'neutral' }
  }
}

function StatusPill({ tone, label }: { tone: 'good' | 'warning' | 'bad' | 'neutral'; label: string }) {
  const styles = {
    good: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    bad: 'border-red-200 bg-red-50 text-red-800',
    neutral: 'border-black/10 bg-black/[0.03] text-black/55',
  }
  const Icon = tone === 'good' ? CheckCircle2 : tone === 'bad' ? XCircle : Clock3

  return (
    <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold ${styles[tone]}`}>
      <Icon className="size-3.5" aria-hidden="true" /> {label}
    </span>
  )
}

function SettingsLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mt-auto inline-flex min-h-11 items-center gap-2 self-start rounded-lg text-sm font-semibold text-[#9a4932] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]"
    >
      {label} <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  )
}
