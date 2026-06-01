import { Inbox, Mail, Phone, Instagram } from 'lucide-react'
import { requireAdmin } from '@/lib/admin/auth'
import { listWorkWithUsSubmissions } from '@/actions/work-with-us'

export const dynamic = 'force-dynamic'

const PATH_LABELS: Record<string, { label: string; className: string }> = {
  employee: { label: 'Employee', className: 'bg-ocean-mist/15 text-ocean-mist border-ocean-mist/30' },
  booth: { label: 'Booth Rental', className: 'bg-dusty-rose/15 text-dusty-rose border-dusty-rose/30' },
  training: { label: 'Training', className: 'bg-golden/15 text-golden border-golden/30' },
}

function formatDate(value: Date | string | null): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function WorkWithUsInboxPage() {
  await requireAdmin()

  const submissions = await listWorkWithUsSubmissions()

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dusty-rose/30 to-dusty-rose/10 flex items-center justify-center">
          <Inbox className="w-6 h-6 text-dusty-rose" />
        </div>
        <div>
          <h1 className="h2 text-dune">Work With Us Applications</h1>
          <p className="text-sm text-dune/60">
            {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'} from the careers page
          </p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="glass rounded-3xl border border-sage/20 p-12 text-center">
          <Inbox className="w-12 h-12 text-dune/20 mx-auto mb-4" />
          <p className="text-dune/60">No applications yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => {
            const path = PATH_LABELS[s.path] ?? { label: s.path, className: 'bg-sage/10 text-dune/60 border-sage/20' }
            return (
              <div key={s.id} className="glass rounded-2xl border border-sage/20 p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-lg text-dune">{s.name}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${path.className}`}>{path.label}</span>
                  </div>
                  <span className="text-xs text-dune/50">{formatDate(s.createdAt)}</span>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-dune/70 mb-3">
                  <a href={`mailto:${s.email}`} className="flex items-center gap-1.5 hover:text-terracotta">
                    <Mail className="w-3.5 h-3.5" /> {s.email}
                  </a>
                  <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 hover:text-terracotta">
                    <Phone className="w-3.5 h-3.5" /> {s.phone}
                  </a>
                  {s.instagram && (
                    <span className="flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5" /> {s.instagram}
                    </span>
                  )}
                </div>

                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  {s.experience && <Detail label="Experience" value={s.experience} />}
                  {s.specialty && s.specialty.length > 0 && <Detail label="Specialties" value={s.specialty.join(', ')} />}
                  {s.currentBusiness && <Detail label="Current business" value={s.currentBusiness} />}
                  {s.desiredStartDate && <Detail label="Desired start" value={s.desiredStartDate} />}
                  {typeof s.boothDays === 'number' && <Detail label="Booth days/wk" value={String(s.boothDays)} />}
                </dl>

                {s.message && (
                  <p className="mt-3 text-sm text-dune/80 bg-cream/50 rounded-xl p-3 whitespace-pre-wrap">{s.message}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-dune/45 whitespace-nowrap">{label}:</dt>
      <dd className="text-dune/80">{value}</dd>
    </div>
  )
}
