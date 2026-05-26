import { Metadata } from 'next'
import Link from 'next/link'
import { desc, eq, isNull, sql, and, or } from 'drizzle-orm'
import { Activity, Star, Inbox, Building2, FileText, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react'
import { getDb } from '@/db'
import { adminAuditLog } from '@/db/schema/admin_audit_log'
import { reviews } from '@/db/schema/reviews'
import { homepageReviews, websiteSettings } from '@/db/schema/website_settings'
import { user as userSchema } from '@/db/schema/auth_user'
import { STUDIO_SETTINGS_SECTION } from '@/types/studio'
import { FOUNDER_LETTER_SECTION } from '@/types/founder-letter'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Overview — LashPop Admin',
}

interface RecentAction {
  id: string
  action: string
  targetType: string | null
  targetId: string | null
  createdAt: Date
  actorName: string | null
  actorEmail: string | null
  actorPhone: string | null
}

async function loadDashboardData() {
  const db = getDb()

  const [recentActions, pendingScore, pinnedCount, studioConfigured, founderConfigured] = await Promise.all([
    db
      .select({
        id: adminAuditLog.id,
        action: adminAuditLog.action,
        targetType: adminAuditLog.targetType,
        targetId: adminAuditLog.targetId,
        createdAt: adminAuditLog.createdAt,
        actorName: userSchema.name,
        actorEmail: userSchema.email,
        actorPhone: userSchema.phoneNumber,
      })
      .from(adminAuditLog)
      .leftJoin(userSchema, eq(adminAuditLog.actorUserId, userSchema.id))
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(10),

    // Reviews that haven't been scored AND aren't already hidden
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviews)
      .where(and(isNull(reviews.qualityScore), eq(reviews.showOnWebsite, true))),

    // Pinned reviews currently rendering
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(homepageReviews)
      .where(eq(homepageReviews.isPinned, true)),

    // Whether studio_settings + founder_letter rows exist (else we're
    // showing the seeded defaults — flag for the editor)
    db
      .select({ id: websiteSettings.id })
      .from(websiteSettings)
      .where(eq(websiteSettings.section, STUDIO_SETTINGS_SECTION))
      .limit(1),

    db
      .select({ id: websiteSettings.id })
      .from(websiteSettings)
      .where(eq(websiteSettings.section, FOUNDER_LETTER_SECTION))
      .limit(1),
  ])

  return {
    recentActions: recentActions as RecentAction[],
    unscoredReviewCount: pendingScore[0]?.count ?? 0,
    pinnedReviewCount: pinnedCount[0]?.count ?? 0,
    studioConfigured: studioConfigured.length > 0,
    founderConfigured: founderConfigured.length > 0,
  }
}

export default async function OverviewPage() {
  const data = await loadDashboardData()

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dusty-rose to-terracotta flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-cream" />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-dune font-semibold">Welcome back</h1>
            <p className="text-sm text-dune/60">Quick look at what&apos;s happening across the studio panel.</p>
          </div>
        </div>
      </header>

      {/* Setup nudges */}
      {(!data.studioConfigured || !data.founderConfigured) && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="font-medium text-amber-900 mb-1">Finish first-time setup</h2>
              <p className="text-sm text-amber-900/80 mb-3">
                These sections are still showing the seeded defaults. Open them once
                to confirm everything looks right.
              </p>
              <div className="flex flex-wrap gap-2">
                {!data.studioConfigured && (
                  <SetupLink href="/admin/content/studio-info" label="Studio Info" />
                )}
                {!data.founderConfigured && (
                  <SetupLink href="/admin/content/founder-letter" label="Founder Letter" />
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stat cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Star}
          label="Reviews needing a score"
          value={data.unscoredReviewCount}
          href="/admin/website/reviews"
          tone={data.unscoredReviewCount > 0 ? 'attention' : 'calm'}
        />
        <StatCard
          icon={Inbox}
          label="Pinned reviews on homepage"
          value={data.pinnedReviewCount}
          href="/admin/website/reviews"
          tone="calm"
        />
        <StatCard
          icon={Activity}
          label="Admin actions logged"
          value={data.recentActions.length}
          href="#recent-activity"
          tone="calm"
          suffix={data.recentActions.length >= 10 ? '+' : ''}
        />
      </section>

      {/* Quick links */}
      <section>
        <h2 className="text-xs font-medium text-dune/60 uppercase tracking-wider mb-3">Quick edits</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickLink href="/admin/content/studio-info" icon={Building2} title="Studio info" description="Name, address, phone, hours, social URLs" />
          <QuickLink href="/admin/content/founder-letter" icon={FileText} title="Founder letter" description="Emily's message on the homepage" />
          <QuickLink href="/admin/website/hero" icon={Sparkles} title="Hero slideshow" description="Above-the-fold arch images" />
          <QuickLink href="/admin/website/team" icon={Inbox} title="Team" description="Members, visibility, photos" />
        </div>
      </section>

      {/* Recent activity */}
      <section id="recent-activity">
        <h2 className="text-xs font-medium text-dune/60 uppercase tracking-wider mb-3">
          Recent activity
        </h2>
        {data.recentActions.length === 0 ? (
          <div className="bg-white/60 border border-sage/15 rounded-2xl p-8 text-center">
            <Activity className="w-8 h-8 text-dune/30 mx-auto mb-2" />
            <p className="text-sm text-dune/60">
              No admin actions logged yet. As soon as someone saves a change, it&apos;ll show up here.
            </p>
          </div>
        ) : (
          <div className="bg-white/60 border border-sage/15 rounded-2xl divide-y divide-sage/10 overflow-hidden">
            {data.recentActions.map(action => (
              <ActionRow key={action.id} action={action} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function SetupLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-medium transition-colors"
    >
      Confirm {label}
      <ArrowRight className="w-3 h-3" />
    </Link>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  tone,
  suffix = '',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  href: string
  tone: 'calm' | 'attention'
  suffix?: string
}) {
  return (
    <Link
      href={href}
      className={`block bg-white/60 border rounded-2xl p-5 transition-all hover:bg-white/80 hover:shadow-sm ${
        tone === 'attention' && value > 0 ? 'border-amber-200' : 'border-sage/15'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            tone === 'attention' && value > 0 ? 'bg-amber-100' : 'bg-dusty-rose/15'
          }`}
        >
          <Icon
            className={`w-4 h-4 ${tone === 'attention' && value > 0 ? 'text-amber-700' : 'text-terracotta'}`}
          />
        </div>
        <ArrowRight className="w-4 h-4 text-dune/30" />
      </div>
      <div className="text-3xl font-serif text-dune">{value}{suffix}</div>
      <div className="text-xs text-dune/60 mt-1">{label}</div>
    </Link>
  )
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 bg-white/60 border border-sage/15 rounded-xl p-4 hover:bg-white/80 transition-all"
    >
      <div className="w-9 h-9 rounded-lg bg-dusty-rose/15 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-terracotta" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-dune">{title}</div>
        <div className="text-xs text-dune/60 truncate">{description}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-dune/30 group-hover:text-dune/60 transition-colors" />
    </Link>
  )
}

function ActionRow({ action }: { action: RecentAction }) {
  const actor = action.actorName || action.actorEmail || action.actorPhone || 'system'
  const when = action.createdAt instanceof Date ? action.createdAt : new Date(action.createdAt)
  const relative = formatRelative(when)

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
      <div className="min-w-0">
        <span className="font-mono text-xs text-terracotta">{action.action}</span>
        {action.targetId && (
          <span className="text-xs text-dune/50 ml-2 font-mono">{action.targetType}:{action.targetId}</span>
        )}
        <div className="text-xs text-dune/60 mt-0.5">
          by <span className="text-dune">{actor}</span>
        </div>
      </div>
      <time className="text-xs text-dune/50 flex-shrink-0">{relative}</time>
    </div>
  )
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}
