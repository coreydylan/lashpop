import Link from 'next/link'
import { and, eq } from 'drizzle-orm'
import { AlertTriangle, ArrowRight, CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react'
import { getDb } from '@/db'
import { services as servicesTable } from '@/db/schema/services'
import { teamMembers } from '@/db/schema/team_members'
import { teamMemberServicesVagaro } from '@/db/schema/team_member_services_vagaro'
import { getHomepageServices } from '@/actions/homepage-services'
import { getAllServiceCategoriesAdmin, getAllServicesAdmin, getVagaroSyncRunsAdmin, getVagaroTaxonomyAdmin } from '@/actions/services'
import { getTeamMembersWithServices } from '@/actions/team'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ category?: string }>

export default async function ServiceLaunchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const [categories, taxonomy, allServices, homepage, team, runs] = await Promise.all([
    getAllServiceCategoriesAdmin(),
    getVagaroTaxonomyAdmin(),
    getAllServicesAdmin(),
    getHomepageServices(),
    getTeamMembersWithServices(),
    getVagaroSyncRunsAdmin(1),
  ])

  const selected = categories.find((category) => category.slug === params.category)
    ?? categories.find((category) => category.slug === 'fine-line-tattoos')
    ?? categories.find((category) => category.isActive)
    ?? categories[0]

  if (!selected) {
    return <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">No service categories are available yet. Run the Vagaro sync first.</div>
  }

  const sourceRows = taxonomy.rawCategories.filter((category) => category.mappedCategoryId === selected.id)
  const categoryServices = allServices.filter((service) => service.categoryId === selected.id)
  const db = getDb()
  const eligibleRows = await db
    .select({ id: teamMembers.id, name: teamMembers.name })
    .from(teamMemberServicesVagaro)
    .innerJoin(servicesTable, eq(teamMemberServicesVagaro.serviceId, servicesTable.id))
    .innerJoin(teamMembers, eq(teamMemberServicesVagaro.teamMemberId, teamMembers.id))
    .where(and(eq(servicesTable.categoryId, selected.id), eq(teamMembers.isActive, true)))

  const eligibleStylists = Array.from(new Map(eligibleRows.map((row) => [row.id, row])).values())
  const teamLabel = sourceRows[0]?.teamLabel || selected.name
  const visibleChipMembers = team.filter((member) => member.serviceCategories.includes(teamLabel))
  const homepageCard = homepage.cards.find((card) => card.slug === selected.slug || card.id === selected.slug)
  const describedServices = categoryServices.filter((service) => Boolean(service.description || service.vagaroDescription))
  const imagedServices = categoryServices.filter((service) => Boolean(service.resolvedImageUrl))
  const latestRun = runs[0]
  const sourceOrderMatches = sourceRows.length === 0 || sourceRows.some((source) => source.sourceOrder === selected.displayOrder)

  const checks = [
    {
      label: 'Vagaro category is mapped',
      ok: sourceRows.length > 0 || selected.sourceType === 'manual',
      detail: sourceRows.length > 0 ? sourceRows.map((source) => source.title).join(', ') : `Local ${selected.sourceType} category`,
      href: '/admin/system/syncs',
      action: 'Review sync',
    },
    {
      label: 'Booking visibility and order are ready',
      ok: selected.isActive && selected.showInBooking && sourceOrderMatches,
      detail: selected.showInBooking ? `Position ${selected.displayOrder + 1}${sourceOrderMatches ? '' : ' · differs from Vagaro'}` : 'Hidden from booking',
      href: '/admin/website/services',
      action: 'Open taxonomy',
    },
    {
      label: 'Customer-facing category copy is complete',
      ok: Boolean(selected.description && selected.tagline),
      detail: [selected.tagline ? 'tagline' : null, selected.description ? 'description' : null, selected.icon ? 'icon' : null].filter(Boolean).join(' · ') || 'No local presentation yet',
      href: '/admin/website/services',
      action: 'Edit presentation',
    },
    {
      label: 'Homepage service card is live',
      ok: Boolean(homepageCard?.enabled && homepageCard.description && homepageCard.icon),
      detail: homepageCard ? `${homepageCard.title}${homepageCard.enabled ? '' : ' · disabled'}` : 'No matching card',
      href: '/admin/website/homepage-services',
      action: 'Edit homepage card',
    },
    {
      label: 'Individual service details are usable',
      ok: categoryServices.length > 0 && describedServices.length === categoryServices.length,
      detail: `${describedServices.length}/${categoryServices.length} descriptions · ${imagedServices.length}/${categoryServices.length} images`,
      href: '/admin/website/services',
      action: 'Review services',
    },
    {
      label: 'Eligible stylists surface on the public team',
      ok: eligibleStylists.length > 0 && visibleChipMembers.length >= eligibleStylists.length,
      detail: eligibleStylists.length > 0 ? eligibleStylists.map((stylist) => stylist.name).join(', ') : 'No eligible stylists returned by Vagaro',
      href: '/admin/website/team',
      action: 'Review stylist chips',
    },
  ]

  const readyCount = checks.filter((check) => check.ok).length

  return (
    <div className="space-y-7">
      <header className="grid gap-5 border-b border-black/10 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9f4c33]">Guided workflow</p>
          <h1 className="mt-2 font-serif text-4xl">Launch or update a service</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60">One verification path across Vagaro, booking, homepage marketing, service details, and stylist profiles.</p>
        </div>
        <form className="flex flex-col gap-2 sm:flex-row sm:items-end" method="get">
          <label htmlFor="category" className="text-xs font-semibold text-black/60 sm:sr-only">Service category</label>
          <select id="category" name="category" defaultValue={selected.slug} className="min-h-11 min-w-64 rounded-lg border border-black/15 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]">
            {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
          </select>
          <button type="submit" className="min-h-11 rounded-lg bg-[#292a27] px-4 text-sm font-semibold text-white hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]">Check service</button>
        </form>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className={`rounded-2xl border p-6 ${readyCount === checks.length ? 'border-emerald-700/20 bg-emerald-50' : 'border-amber-700/20 bg-amber-50'}`}>
          <div className="flex items-start gap-3">
            {readyCount === checks.length ? <CheckCircle2 className="mt-0.5 size-6 text-emerald-700" /> : <AlertTriangle className="mt-0.5 size-6 text-amber-700" />}
            <div>
              <h2 className="font-serif text-2xl">{selected.name}</h2>
              <p className="mt-1 text-sm text-black/60">{readyCount} of {checks.length} launch checks ready.</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-black/45"><RefreshCw className="size-3.5" /> Latest Vagaro run</div>
          <p className="mt-3 text-sm font-semibold capitalize">{latestRun?.status || 'No recorded run'}</p>
          <p className="mt-1 text-xs text-black/50">{latestRun?.startedAt ? new Date(latestRun.startedAt).toLocaleString() : 'Run a sync before launch.'}</p>
        </div>
      </section>

      <ol className="grid gap-3" aria-label="Service launch checklist">
        {checks.map((check, index) => (
          <li key={check.label} className="grid gap-4 rounded-xl border border-black/10 bg-white p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <span className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold ${check.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{check.ok ? <CheckCircle2 className="size-4" /> : index + 1}</span>
            <div>
              <h3 className="text-sm font-semibold">{check.label}</h3>
              <p className="mt-1 text-xs leading-5 text-black/55">{check.detail}</p>
            </div>
            <Link href={check.href} className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-[#9f4c33] hover:text-[#7e3925]">{check.action} <ArrowRight className="size-3.5" /></Link>
          </li>
        ))}
      </ol>

      <section className="rounded-xl border border-black/10 bg-[#292a27] p-5 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-xl">Verify the public result</h2>
            <p className="mt-1 text-xs leading-5 text-white/55">Open both destinations after every sync or publishing change.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/#services" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-[#292a27]">Choose a Service <ExternalLink className="size-4" /></a>
            <a href="/#team" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/20 px-4 text-sm font-semibold text-white">Find Your Stylist <ExternalLink className="size-4" /></a>
          </div>
        </div>
      </section>
    </div>
  )
}
