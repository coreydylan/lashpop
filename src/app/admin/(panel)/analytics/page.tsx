import type { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'
import { AnalyticsBoard } from '@/components/admin-analytics/AnalyticsBoard'
import { requireAdmin } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Website performance | LashPop Admin',
  robots: { index: false, follow: false },
}

export default async function AnalyticsPage() {
  await requireAdmin()

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="grid gap-5 border-b border-black/10 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rust">Website performance</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight text-charcoal sm:text-4xl">
            See what is moving—and what deserves attention.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">
            A private view of anonymous website traffic and important action signals. Use it to decide where to look next, then confirm final appointments in Vagaro and saved enquiries in the Admin Inbox.
          </p>
        </div>
        <div className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-sage/30 bg-white px-4 text-xs font-semibold text-black/65 lg:self-auto">
          <ShieldCheck className="size-4 text-rust" aria-hidden="true" />
          Aggregate only · no customer profiles
        </div>
      </header>

      <AnalyticsBoard />
    </div>
  )
}
