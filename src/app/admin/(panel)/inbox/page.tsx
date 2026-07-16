import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BriefcaseBusiness, Inbox, Mail, Users } from 'lucide-react'
import { requireAdmin } from '@/lib/admin/auth'
import { listNewsletterSubscribers } from '@/app/actions/newsletter'
import { listWorkWithUsSubmissions } from '@/actions/work-with-us'

export const metadata: Metadata = {
  title: 'Inbox — LashPop Admin',
}

export const dynamic = 'force-dynamic'

const PATH_LABELS: Record<string, string> = {
  employee: 'Employee',
  booth: 'Booth rental',
  training: 'Training',
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return 'No activity yet'
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default async function InboxOverviewPage() {
  await requireAdmin()

  const [subscribers, submissions] = await Promise.all([
    listNewsletterSubscribers(),
    listWorkWithUsSubmissions(),
  ])

  const applicationCounts = submissions.reduce<Record<string, number>>((counts, submission) => {
    counts[submission.path] = (counts[submission.path] ?? 0) + 1
    return counts
  }, {})

  const latestSubscriber = subscribers[0]
  const activeSubscriberCount = subscribers.filter((subscriber) => subscriber.status === 'active').length
  const latestSubmission = submissions[0]
  const recentSubmissions = submissions.slice(0, 4)

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="border-b border-black/10 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">Inbox</p>
            <h1 className="mt-2 font-serif text-3xl text-[#292a27] sm:text-4xl">People who raised their hand</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60">
              Review newsletter interest and career inquiries without mixing them into website publishing work.
            </p>
          </div>
          <div className="rounded-lg border border-black/10 bg-[#f8f4ee] px-3 py-2 text-xs leading-5 text-black/55">
            Subscriber consent status and application records are tracked separately
          </div>
        </div>
      </header>

      <section aria-label="Inbox totals" className="grid gap-4 lg:grid-cols-2">
        <InboxSummaryCard
          href="/admin/inbox/work-with-us"
          icon={BriefcaseBusiness}
          eyebrow="Applications"
          title={`${submissions.length} ${submissions.length === 1 ? 'submission' : 'submissions'}`}
          detail={latestSubmission ? `Latest: ${latestSubmission.name} · ${formatDate(latestSubmission.createdAt)}` : 'No applications have been submitted.'}
          linkLabel="Review applications"
        >
          <div className="flex flex-wrap gap-2">
            {Object.entries(PATH_LABELS).map(([path, label]) => (
              <span key={path} className="rounded-full border border-black/10 bg-[#f8f4ee] px-2.5 py-1 text-xs text-black/60">
                {label} <strong className="ml-1 text-[#292a27]">{applicationCounts[path] ?? 0}</strong>
              </span>
            ))}
          </div>
        </InboxSummaryCard>

        <InboxSummaryCard
          href="/admin/inbox/newsletter"
          icon={Mail}
          eyebrow="Newsletter"
          title={`${activeSubscriberCount} active ${activeSubscriberCount === 1 ? 'subscriber' : 'subscribers'}`}
          detail={latestSubscriber ? `Latest signup: ${formatDate(latestSubscriber.subscribedAt)}` : 'No newsletter signups have been recorded.'}
          linkLabel="Manage subscriber directory"
        >
          <div className="flex items-center gap-2 text-xs text-black/55">
            <Users className="size-4 text-[#a14f35]" aria-hidden="true" />
            {subscribers.length} total consent {subscribers.length === 1 ? 'record' : 'records'} retained.
          </div>
        </InboxSummaryCard>
      </section>

      <section className="overflow-hidden rounded-xl border border-black/10 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-serif text-xl text-[#292a27]">Recent applications</h2>
            <p className="mt-1 text-xs text-black/50">Newest career and booth inquiries, with no bulk contact actions.</p>
          </div>
          <Link
            href="/admin/inbox/work-with-us"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-medium text-[#292a27] hover:border-black/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]"
          >
            Open applications <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Inbox className="mx-auto size-8 text-black/20" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-[#292a27]">No applications yet</p>
            <p className="mt-1 text-xs text-black/50">New submissions will appear here automatically.</p>
          </div>
        ) : (
          <ul className="divide-y divide-black/10">
            {recentSubmissions.map((submission) => (
              <li key={submission.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-[#292a27]">{submission.name}</p>
                    <span className="rounded-full border border-[#c96f50]/20 bg-[#c96f50]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8f442f]">
                      {PATH_LABELS[submission.path] ?? submission.path}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-black/50">{submission.specialty?.join(', ') || 'No specialty provided'}</p>
                </div>
                <time className="text-xs text-black/45" dateTime={new Date(submission.createdAt).toISOString()}>
                  {formatDate(submission.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function InboxSummaryCard({
  href,
  icon: Icon,
  eyebrow,
  title,
  detail,
  linkLabel,
  children,
}: {
  href: string
  icon: typeof Mail
  eyebrow: string
  title: string
  detail: string
  linkLabel: string
  children: React.ReactNode
}) {
  return (
    <article className="flex min-h-64 flex-col rounded-xl border border-black/10 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-black/45">{eyebrow}</p>
          <h2 className="mt-2 font-serif text-3xl text-[#292a27]">{title}</h2>
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#c96f50]/10 text-[#a14f35]">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-black/55">{detail}</p>
      <div className="mt-4">{children}</div>
      <Link
        href={href}
        className="mt-auto inline-flex min-h-11 items-center gap-2 self-start rounded-lg text-sm font-semibold text-[#9a4932] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]"
      >
        {linkLabel} <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </article>
  )
}
