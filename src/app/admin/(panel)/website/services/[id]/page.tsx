import Link from 'next/link'
import { ArrowLeft, CheckCircle2, ExternalLink, Info } from 'lucide-react'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { services } from '@/db/schema/services'
import { serviceCategories } from '@/db/schema/service_categories'
import { requireAdmin } from '@/lib/admin/auth'
import { updateServicePresentation } from './actions'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string; conflict?: string }>
}

export default async function ServicePresentationPage({ params, searchParams }: PageProps) {
  await requireAdmin()
  const { id } = await params
  const status = await searchParams
  const db = getDb()
  const [service] = await db
    .select({
      id: services.id,
      name: services.name,
      slug: services.slug,
      subtitle: services.subtitle,
      description: services.description,
      vagaroDescription: services.vagaroDescription,
      durationMinutes: services.durationMinutes,
      priceStarting: services.priceStarting,
      displayOrder: services.displayOrder,
      isActive: services.isActive,
      vagaroServiceId: services.vagaroServiceId,
      lastSyncedAt: services.lastSyncedAt,
      updatedAt: services.updatedAt,
      categoryName: serviceCategories.name,
    })
    .from(services)
    .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .where(eq(services.id, id))
    .limit(1)

  if (!service) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">Service not found.</div>

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="border-b border-black/10 pb-6">
        <Link href="/admin/website/services" className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-black/55 hover:text-black"><ArrowLeft className="size-4" /> Services & booking</Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9f4c33]">Local presentation</p>
              <span className="rounded-full border border-[#6f9693]/25 bg-[#6f9693]/10 px-2 py-0.5 text-[10px] font-semibold text-[#466f6c]">Vagaro facts</span>
            </div>
            <h1 className="mt-2 font-serif text-4xl">{service.name}</h1>
            <p className="mt-2 text-sm text-black/55">{service.categoryName || 'Uncategorized'} · position {service.displayOrder + 1}</p>
          </div>
          <a href={`/?service=${encodeURIComponent(service.slug)}#services`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-black/15 bg-white px-4 text-sm font-semibold hover:border-black/30">Preview <ExternalLink className="size-4" /></a>
        </div>
      </header>

      {status.saved === '1' && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-700/20 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="size-4" /> Service copy saved and published.</div>}
      {status.conflict === '1' && <div role="alert" className="rounded-xl border border-amber-700/20 bg-amber-50 p-4 text-sm text-amber-900">This service changed after you opened it. Review the latest values below before saving again.</div>}

      <section className="grid gap-4 rounded-xl border border-black/10 bg-white p-5 sm:grid-cols-3">
        <Fact label="Name" value={service.name} />
        <Fact label="Duration" value={`${service.durationMinutes} minutes`} />
        <Fact label="Starting price" value={`$${(service.priceStarting / 100).toFixed(0)}`} />
        <p className="sm:col-span-3 flex items-start gap-2 border-t border-black/10 pt-4 text-xs leading-5 text-black/55"><Info className="mt-0.5 size-3.5 shrink-0" /> These booking facts, active state, and ordering sync from Vagaro. Edit them in Vagaro, then verify the sync. The fields below are LashPop-owned overrides.</p>
      </section>

      <form action={updateServicePresentation} className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
        <input type="hidden" name="id" value={service.id} />
        <input type="hidden" name="baseUpdatedAt" value={new Date(service.updatedAt).getTime()} />
        <div>
          <label htmlFor="subtitle" className="text-sm font-semibold">Short subtitle</label>
          <p id="subtitle-help" className="mt-1 text-xs leading-5 text-black/50">Optional supporting line shown with the service.</p>
          <input id="subtitle" name="subtitle" defaultValue={service.subtitle || ''} maxLength={160} aria-describedby="subtitle-help" className="mt-2 min-h-11 w-full rounded-lg border border-black/15 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]" />
        </div>
        <div className="mt-5">
          <label htmlFor="description" className="text-sm font-semibold">Customer-facing description</label>
          <p id="description-help" className="mt-1 text-xs leading-5 text-black/50">Leave blank to use the latest Vagaro description. A local value will continue to win after future syncs.</p>
          <textarea id="description" name="description" defaultValue={service.description || ''} maxLength={4000} rows={7} aria-describedby="description-help" className="mt-2 w-full rounded-lg border border-black/15 px-3 py-3 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]" />
        </div>
        <div className="mt-5 rounded-lg bg-black/[0.035] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45">Current Vagaro fallback</p>
          <p className="mt-2 text-sm leading-6 text-black/60">{service.vagaroDescription || 'Vagaro has not supplied a description.'}</p>
        </div>
        <div className="mt-6 flex justify-end">
          <button type="submit" className="min-h-11 rounded-lg bg-[#c96f50] px-5 text-sm font-semibold text-white hover:bg-[#b75f42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50] focus-visible:ring-offset-2">Save and publish</button>
        </div>
      </form>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>
}
