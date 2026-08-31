import type { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'
import { AnalyticsBoard } from '@/components/admin-analytics/AnalyticsBoard'
import { requireAdmin } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Website analytics | LashPop Admin',
  robots: { index: false, follow: false },
}

export default async function AnalyticsPage() {
  await requireAdmin()

  return (
    <div className="space-y-5 sm:space-y-8">
      <header className="border-b border-black/10 pb-5">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rust">Website analytics</p>
          <h1 className="mt-1 text-balance font-serif text-3xl leading-tight text-charcoal sm:text-4xl">
            Website analytics
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60">
            Compare website traffic, referring websites, popular pages and recorded actions over time. Open Vagaro for booking status and Inbox for saved applications and newsletter subscriptions.
          </p>
        </div>
        <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-black/55">
          <ShieldCheck className="size-4 text-rust" aria-hidden="true" />
          Anonymous website totals
        </p>
      </header>

      <AnalyticsBoard />
    </div>
  )
}
