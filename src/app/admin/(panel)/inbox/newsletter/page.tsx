import type { Metadata } from 'next'
import { Mail, ShieldCheck } from 'lucide-react'
import { requireAdmin } from '@/lib/admin/auth'
import { listNewsletterSubscribers } from '@/app/actions/newsletter'
import { SubscriberDirectory, type SubscriberRow } from './SubscriberDirectory'

export const metadata: Metadata = {
  title: 'Newsletter Subscribers — LashPop Admin',
}

export const dynamic = 'force-dynamic'

export default async function NewsletterInboxPage() {
  const session = await requireAdmin()
  const subscribers = await listNewsletterSubscribers()
  const initialSubscribers: SubscriberRow[] = subscribers.map((subscriber) => ({
    ...subscriber,
    status: subscriber.status ?? 'active',
    subscribedAt: subscriber.subscribedAt?.toISOString() ?? null,
    unsubscribedAt: subscriber.unsubscribedAt?.toISOString() ?? null,
    updatedAt: subscriber.updatedAt?.toISOString() ?? null,
  }))

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="border-b border-black/10 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">Inbox · Newsletter</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#c96f50]/12 text-[#9a4932]">
                <Mail className="size-5" aria-hidden="true" />
              </span>
              <h1 className="font-serif text-3xl text-[#292a27] sm:text-4xl">Subscriber directory</h1>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60">
              See every website signup, preserve consent history, and prepare an active-only list for LashPop&apos;s approved email platform.
            </p>
          </div>
          <div className="flex max-w-md items-start gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 text-xs leading-5 text-black/55">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#9a4932]" aria-hidden="true" />
            The website keeps the signup ledger. Unsubscribes, bounces, complaints, and delivery controls must also remain enforced in the sending platform.
          </div>
        </div>
      </header>

      <SubscriberDirectory
        initialSubscribers={initialSubscribers}
        canManage={session.role === 'owner' || session.role === 'publisher'}
      />
    </div>
  )
}
