import type { Metadata } from 'next'
import { Mail, ShieldCheck } from 'lucide-react'
import { requireAdmin } from '@/lib/admin/auth'
import { listNewsletterSubscribers } from '@/app/actions/newsletter'
import { SubscriberDirectory, type SubscriberRow } from './SubscriberDirectory'

export const metadata: Metadata = {
  title: 'Newsletter subscribers — LashPop Admin',
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
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-7">
      <header className="border-b border-black/10 pb-5 sm:pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4 sm:gap-5">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">Inbox · Newsletter</p>
            <div className="mt-1 flex items-center gap-2.5 sm:mt-2 sm:gap-3">
              <span className="hidden size-10 shrink-0 items-center justify-center rounded-md bg-[#c96f50]/12 text-[#9a4932] sm:flex">
                <Mail className="size-5" aria-hidden="true" />
              </span>
              <h1 className="font-serif text-3xl text-[#292a27] sm:text-4xl">Subscriber directory</h1>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60 sm:mt-3">
              Review every newsletter signup and download a list of active subscribers.
            </p>
          </div>
          <div className="flex max-w-md items-start gap-3 border-l-2 border-[#c96f50] pl-3 text-xs leading-5 text-black/55 sm:border-l-0 sm:border-t sm:border-black/10 sm:pt-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#9a4932]" aria-hidden="true" />
            LashPop stores every signup and status change. Keep unsubscribed addresses, bounced addresses and spam complaints blocked in the service that sends the newsletter.
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
