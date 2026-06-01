import { Mail, Download } from 'lucide-react'
import { requireAdmin } from '@/lib/admin/auth'
import { listNewsletterSubscribers } from '@/app/actions/newsletter'

export const dynamic = 'force-dynamic'

function formatDate(value: Date | string | null): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function NewsletterInboxPage() {
  await requireAdmin()

  const subscribers = await listNewsletterSubscribers()
  const allEmails = subscribers.map((s) => s.email).join(', ')
  const mailtoHref = subscribers.length > 0 ? `mailto:?bcc=${encodeURIComponent(allEmails)}` : undefined

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
        {mailtoHref && (
          <a href={mailtoHref} className="btn btn-secondary">
            <Mail className="w-4 h-4" /> Email all (BCC)
          </a>
        )}
      </div>

      {subscribers.length === 0 ? (
        <div className="glass rounded-3xl border border-sage/20 p-12 text-center">
          <Mail className="w-12 h-12 text-dune/20 mx-auto mb-4" />
          <p className="text-dune/60">No one has signed up yet.</p>
        </div>
      ) : (
        <div className="glass rounded-3xl border border-sage/20 overflow-hidden">
          <table className="w-full text-sm">
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

      {subscribers.length > 0 && (
        <p className="mt-4 text-xs text-dune/40 flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" />
          Tip: &quot;Email all&quot; opens your mail client with everyone BCC&apos;d.
        </p>
      )}
    </div>
  )
}
