import Link from 'next/link'
import { ArrowRight, CheckCircle2, Database, Layers3, LockKeyhole, TriangleAlert } from 'lucide-react'

interface RawCategory {
  id: string
  vagaroCategoryId: string
  title: string
  sourceOrder: number
  serviceCount: number
  isActive: boolean
  teamLabel: string | null
  showOnTeam: boolean
  mappedCategoryName: string | null
  mappedCategorySlug: string | null
  mappedCategoryOrder: number | null
  mappingType: string | null
}

interface WebsiteCategory {
  id: string
  name: string
  sourceName: string
  slug: string
  displayOrder: number
  isActive: boolean
  sourceType: string
  showInBooking: boolean
  syncStatus: string
}

interface Props {
  rawCategories: RawCategory[]
  localCategories: WebsiteCategory[]
}

const sourceLabels: Record<string, string> = {
  vagaro: 'Vagaro',
  merged: 'Merged',
  manual: 'LashPop',
}

export function VagaroTaxonomyOverview({ rawCategories, localCategories }: Props) {
  const hasWarning = rawCategories.some(category => !category.isActive || !category.mappedCategoryName)

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-sage/15 bg-white/65 shadow-sm">
      <div className="border-b border-sage/10 bg-gradient-to-r from-ocean-mist/10 via-white/40 to-dusty-rose/10 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ocean-mist/15">
              <Layers3 className="h-5 w-5 text-ocean-mist" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl text-dune">Booking taxonomy</h2>
                {hasWarning ? (
                  <TriangleAlert className="h-4 w-4 text-golden" aria-label="Taxonomy needs attention" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-ocean-mist" aria-label="Taxonomy is mapped" />
                )}
              </div>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-dune/65">
                Vagaro automatically controls booking category names, order, active status, services, and stylist eligibility.
                LashPop controls the customer-facing label, description, art, and homepage marketing cards.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/system/syncs" className="btn btn-secondary text-xs">
              Sync status <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/admin/website/homepage-services" className="btn btn-secondary text-xs">
              Homepage cards <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-ocean-mist/15 bg-white/70 p-4">
            <Database className="mb-2 h-4 w-4 text-ocean-mist" />
            <p className="text-xs font-semibold uppercase tracking-wider text-dune/45">Automatic from Vagaro</p>
            <p className="mt-1 text-sm text-dune/70">Create, rename, reorder, deactivate, service assignment, stylist chips</p>
          </div>
          <div className="rounded-2xl border border-dusty-rose/15 bg-white/70 p-4">
            <LockKeyhole className="mb-2 h-4 w-4 text-dusty-rose" />
            <p className="text-xs font-semibold uppercase tracking-wider text-dune/45">Local presentation</p>
            <p className="mt-1 text-sm text-dune/70">Public label, descriptions, taglines, icons, category art</p>
          </div>
          <div className="rounded-2xl border border-golden/15 bg-white/70 p-4">
            <Layers3 className="mb-2 h-4 w-4 text-golden" />
            <p className="text-xs font-semibold uppercase tracking-wider text-dune/45">Curated separately</p>
            <p className="mt-1 text-sm text-dune/70">Homepage “Choose a Service” cards and manual Botox placement</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-sage/10 bg-cream/45 text-[11px] uppercase tracking-wider text-dune/45">
            <tr>
              <th className="px-5 py-3 font-semibold">Vagaro source</th>
              <th className="px-4 py-3 font-semibold">Services</th>
              <th className="px-4 py-3 font-semibold">Maps to LashPop</th>
              <th className="px-4 py-3 font-semibold">Booking position</th>
              <th className="px-4 py-3 font-semibold">Stylist chip</th>
              <th className="px-5 py-3 text-right font-semibold">State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage/10">
            {rawCategories.map(category => (
              <tr key={category.id} className="text-dune/70">
                <td className="px-5 py-3.5">
                  <div className="font-medium text-dune">{category.sourceOrder}. {category.title}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-dune/35">Vagaro #{category.vagaroCategoryId}</div>
                </td>
                <td className="px-4 py-3.5 tabular-nums">{category.serviceCount}</td>
                <td className="px-4 py-3.5">
                  {category.mappedCategoryName ? (
                    <div className="flex items-center gap-2">
                      <span>{category.mappedCategoryName}</span>
                      {category.mappedCategorySlug === 'lashes' && category.title === 'Lash Lifts' && (
                        <span className="rounded-full bg-ocean-mist/10 px-2 py-0.5 text-[10px] font-medium text-ocean-mist">merged</span>
                      )}
                    </div>
                  ) : (
                    <span className="font-medium text-golden">Awaiting automatic mapping</span>
                  )}
                </td>
                <td className="px-4 py-3.5 tabular-nums">
                  {category.mappedCategoryOrder ? `#${category.mappedCategoryOrder}` : '—'}
                </td>
                <td className="px-4 py-3.5">
                  {category.showOnTeam ? (category.teamLabel || category.title) : <span className="text-dune/35">Hidden</span>}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    category.isActive && category.mappedCategoryName
                      ? 'bg-ocean-mist/10 text-ocean-mist'
                      : 'bg-golden/10 text-golden'
                  }`}>
                    {category.isActive ? (category.mappedCategoryName ? 'Synced' : 'Unmapped') : 'Removed'}
                  </span>
                </td>
              </tr>
            ))}
            {localCategories.filter(category => category.showInBooking).map(category => (
              <tr key={category.id} className="bg-dusty-rose/[0.035] text-dune/70">
                <td className="px-5 py-3.5">
                  <div className="font-medium text-dune">LashPop local</div>
                  <div className="mt-0.5 text-[10px] text-dune/35">Not overwritten by Vagaro</div>
                </td>
                <td className="px-4 py-3.5">—</td>
                <td className="px-4 py-3.5">{category.name}</td>
                <td className="px-4 py-3.5 tabular-nums">#{category.displayOrder}</td>
                <td className="px-4 py-3.5">Local team settings</td>
                <td className="px-5 py-3.5 text-right">
                  <span className="rounded-full bg-dusty-rose/10 px-2.5 py-1 text-[10px] font-semibold text-dusty-rose">
                    {sourceLabels[category.sourceType] || category.sourceType}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
