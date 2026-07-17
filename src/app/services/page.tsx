import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllServices, getServiceCategoriesForLanding } from '@/actions/services'

const SITE_URL = 'https://lashpopstudios.com'

export const metadata: Metadata = {
  title: 'Lash, Brow, Facial & Beauty Services | LashPop Studios',
  description:
    'Explore eyelash extensions, brows, facials, waxing, permanent makeup, fine line tattoos, and more at LashPop Studios in Oceanside, CA.',
  alternates: { canonical: `${SITE_URL}/services` },
  openGraph: {
    title: 'Beauty Services at LashPop Studios',
    description:
      'Browse lash, brow, skincare, waxing, permanent makeup, tattoo, and specialty beauty services in Oceanside, CA.',
    url: `${SITE_URL}/services`,
    type: 'website',
  },
}

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export default async function ServicesPage() {
  const [categories, services] = await Promise.all([
    getServiceCategoriesForLanding(),
    getAllServices(),
  ])

  return (
    <main className="min-h-screen bg-ivory text-charcoal">
      <header className="border-b border-charcoal/10 px-6 py-5 md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
          <Link
            href="/"
            className="font-display text-xl tracking-tight transition-colors hover:text-terracotta"
          >
            LashPop Studios
          </Link>
          <Link
            href="/#services"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/65 transition-colors hover:text-terracotta"
          >
            Back to home
          </Link>
        </div>
      </header>

      <section className="px-6 pb-16 pt-16 md:px-10 md:pb-24 md:pt-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-terracotta">
            Oceanside, California
          </p>
          <h1 className="max-w-4xl font-display text-5xl leading-[0.98] tracking-tight sm:text-6xl md:text-7xl">
            Services made for your everyday kind of beautiful.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-charcoal/70 md:text-lg">
            Browse the LashPop collective&apos;s current service menu. Pricing,
            timing, and availability can vary by independent artist.
          </p>
        </div>
      </section>

      <nav aria-label="Service categories" className="px-6 pb-14 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-2">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#${category.slug}`}
              className="rounded-full border border-charcoal/15 bg-white/55 px-4 py-2 text-sm transition-colors hover:border-terracotta hover:text-terracotta"
            >
              {category.name}
            </a>
          ))}
        </div>
      </nav>

      <div className="px-6 pb-24 md:px-10 md:pb-32">
        <div className="mx-auto max-w-6xl space-y-20">
          {categories.map((category) => {
            const categoryServices = services.filter(
              (service) => service.categorySlug === category.slug,
            )

            if (categoryServices.length === 0) return null

            return (
              <section
                key={category.id}
                id={category.slug}
                className="scroll-mt-8 border-t border-charcoal/15 pt-8"
                aria-labelledby={`${category.slug}-heading`}
              >
                <div className="mb-8 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:gap-12">
                  <h2
                    id={`${category.slug}-heading`}
                    className="font-display text-4xl tracking-tight md:text-5xl"
                  >
                    {category.name}
                  </h2>
                  <div className="max-w-2xl text-sm leading-6 text-charcoal/65 md:pt-2 md:text-base">
                    {category.tagline && (
                      <p className="font-semibold text-charcoal">{category.tagline}</p>
                    )}
                    {category.description && <p className="mt-2">{category.description}</p>}
                  </div>
                </div>

                <div className="grid gap-px overflow-hidden rounded-2xl border border-charcoal/10 bg-charcoal/10 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryServices.map((service) => (
                    <Link
                      key={service.id}
                      href={`/services/${service.slug}`}
                      className="group flex min-h-44 flex-col bg-white p-6 transition-colors hover:bg-warm-sand/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-terracotta"
                    >
                      <h3 className="font-display text-2xl leading-tight transition-colors group-hover:text-terracotta">
                        {service.name}
                      </h3>
                      {service.subtitle && (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-charcoal/60">
                          {service.subtitle}
                        </p>
                      )}
                      <div className="mt-auto flex items-end justify-between gap-4 pt-8 text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/55">
                        <span>{service.durationMinutes} min</span>
                        <span>
                          From {priceFormatter.format(service.priceStarting / 100)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </main>
  )
}
