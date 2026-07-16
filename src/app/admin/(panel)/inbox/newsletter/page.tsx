import { Mail, ShieldCheck } from 'lucide-react'
import { requireAdmin } from '@/lib/admin/auth'
import { listNewsletterSubscribers } from '@/app/actions/newsletter'
import { SubscriberExportActions } from './SubscriberExportActions'

export const dynamic = 'force-dynamic'

function formatDate(value: Date | string | null): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function NewsletterInboxPage() {
  await requireAdmin()

  const subscribers = await listNewsletterSubscribers()
  const exportSubscribers = subscribers.map((subscriber) => ({
    email: subscriber.email,
    subscribedAt: subscriber.subscribedAt?.toISOString() ?? null,
    source: subscriber.source,
  }))

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-terracotta/30 to-terracotta/10 flex items-center justify-center">
            <Mail className="w-6 h-6 text-terracotta" />
          </div>
          <div>
            <h1 className="h2 text-dune">Newsletter Signups</h1>
            <p className="text-sm text-dune/60">
              {subscribers.length} {subscribers.length === 1 ? 'person has' : 'people have'} subscribed via the footer form
            </p>
          </div>
        </div>
        {subscribers.length > 0 && <SubscriberExportActions subscribers={exportSubscribers} />}
      </div>

      {subscribers.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-black/10 bg-white p-4 text-sm text-black/65">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#9a4932]" aria-hidden="true" />
          <p>
            Import the CSV into LashPop&apos;s approved email platform so unsubscribe handling,
            consent records, and delivery controls stay intact. Do not paste this list into an
            email&apos;s To, Cc, or Bcc fields.
          </p>
        </div>
      )}

      {subscribers.length === 0 ? (
        <div className="glass rounded-3xl border border-sage/20 p-12 text-center">
          <Mail className="w-12 h-12 text-dune/20 mx-auto mb-4" />
          <p className="text-dune/60">No one has signed up yet.</p>
        </div>
      ) : (
        <div className="glass rounded-3xl border border-sage/20 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <caption className="sr-only">Opted-in newsletter subscribers</caption>
            <thead>
              <tr className="border-b border-sage/15 text-left text-xs uppercase tracking-wider text-dune/50">
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Signed up</th>
                <th className="px-5 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/10">
              {subscribers.map((s) => (
                <tr key={s.email} className="hover:bg-cream/40 transition-colors">
                  <td className="px-5 py-3">
                    <a href={`mailto:${s.email}`} className="text-dune hover:text-terracotta">
                      {s.email}
                    </a>
                  </td>
                  <td className="px-5 py-3 text-dune/60">{formatDate(s.subscribedAt)}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 text-xs rounded-full border border-sage/20 bg-sage/5 text-dune/60">
                      {s.source || 'footer_form'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
