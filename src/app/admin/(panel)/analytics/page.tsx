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
    <div className="space-y-5 sm:space-y-8">
      <header className="border-b border-black/10 pb-5">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rust">Website performance</p>
          <h1 className="mt-1 text-balance font-serif text-3xl leading-tight text-charcoal sm:text-4xl">
            Website performance
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60">
            See anonymous traffic and action signals, then confirm appointments in Vagaro and saved enquiries in the Inbox.
          </p>
        </div>
        <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-black/55">
          <ShieldCheck className="size-4 text-rust" aria-hidden="true" />
          Anonymous aggregates only · no customer profiles
        </p>
      </header>

      <AnalyticsBoard />
    </div>
  )
}
