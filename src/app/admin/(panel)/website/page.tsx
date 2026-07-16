import Link from 'next/link'
import { ArrowRight, CheckCircle2, ExternalLink, Workflow } from 'lucide-react'
import { ADMIN_AREAS, type ContentOwner } from '@/components/admin-shell/sections'

const OWNER_COPY: Record<ContentOwner, string> = {
  LashPop: 'Edited here and published directly by the studio.',
  Vagaro: 'Core booking data syncs from Vagaro; presentation stays local.',
  Automation: 'A worker keeps this current; admins configure the rules.',
  System: 'Operational state and accountability, not public content.',
  Mixed: 'Vagaro or automation owns the facts; LashPop owns selected presentation fields.',
}

const OWNER_STYLE: Record<ContentOwner, string> = {
  LashPop: 'bg-[#c96f50]/10 text-[#9f4c33] border-[#c96f50]/25',
  Vagaro: 'bg-[#6f9693]/10 text-[#466f6c] border-[#6f9693]/25',
  Automation: 'bg-[#aa8748]/10 text-[#755b28] border-[#aa8748]/25',
  System: 'bg-black/[0.04] text-black/55 border-black/10',
  Mixed: 'bg-[#8b748f]/10 text-[#654d6a] border-[#8b748f]/25',
}

export default function WebsiteOverviewPage() {
  const website = ADMIN_AREAS.find((area) => area.id === 'website')!
  const editors = website.sections.filter((section) => section.id !== 'website-home' && section.id !== 'service-launch')

  return (
    <div className="space-y-8">
      <header className="grid gap-6 border-b border-black/10 pb-7 lg:grid-cols-[1fr_22rem] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9f4c33]">Publishing workspace</p>
          <h1 className="mt-2 max-w-3xl font-serif text-4xl leading-tight text-[#292a27]">Keep every public promise in one coherent story.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60">Each editor below names its source of truth. Vagaro owns booking facts; LashPop owns how those facts are explained and presented.</p>
        </div>
        <div className="flex gap-2 lg:justify-end">
          <a href="/" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-black/15 bg-white px-4 text-sm font-semibold hover:border-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]">
            View live site <ExternalLink className="size-4" />
          </a>
        </div>
      </header>

      <section className="rounded-2xl border border-[#c96f50]/25 bg-[#f4dfd5] p-5 sm:p-6">
        <div className="grid gap-5 md:grid-cols-[auto_1fr_auto] md:items-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-[#292a27] text-white"><Workflow className="size-5" /></span>
          <div>
            <h2 className="font-serif text-2xl">Launching or changing a service?</h2>
            <p className="mt-1 text-sm leading-6 text-black/60">Use the guided workflow to verify Vagaro sync, booking order, homepage copy, stylist eligibility, imagery, and public presentation together.</p>
          </div>
          <Link href="/admin/workflows/service-launch" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#292a27] px-4 text-sm font-semibold text-white hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]">
            Open workflow <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section aria-labelledby="ownership-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="ownership-heading" className="font-serif text-2xl">Publishing ownership</h2>
            <p className="mt-1 text-sm text-black/55">Know what can safely be edited here and what will sync back in.</p>
          </div>
          <CheckCircle2 className="hidden size-5 text-[#5f8174] sm:block" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {editors.map((section) => {
            const Icon = section.icon
            return (
              <Link key={section.id} href={section.href} className="group flex min-h-44 flex-col rounded-xl border border-black/10 bg-white p-5 hover:border-[#c96f50]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-black/[0.04] text-black/65"><Icon className="size-4" /></span>
                  <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${OWNER_STYLE[section.owner]}`}>{section.owner}</span>
                </div>
                <h3 className="mt-5 text-sm font-semibold">{section.label}</h3>
                <p className="mt-1 flex-1 text-xs leading-5 text-black/55">{OWNER_COPY[section.owner]}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#9f4c33]">Open editor <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
