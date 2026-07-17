import { MetadataRoute } from 'next'
import { getSEOSettings } from '@/actions/seo'
import { getDb } from '@/db'
import { services } from '@/db/schema/services'
import { serviceCategories } from '@/db/schema/service_categories'
import { and, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/**
 * Generate dynamic sitemap.xml
 *
 * Every entry must be a self-canonical, indexable 200 URL. Legacy URLs and
 * non-HTML discovery files belong in redirects/robots, not in this sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSEOSettings()
  const siteUrl = (settings.site.siteUrl || 'https://lashpopstudios.com').replace(/\/+$/, '')

  // Do not emit a request-time lastModified value for static pages. Claiming
  // every page changed whenever the sitemap is fetched creates noisy signals.
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/services`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/work-with-us`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${siteUrl}/terms`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  // Dynamic pages from database
  const dynamicPages: MetadataRoute.Sitemap = []

  try {
    const db = getDb()

    // Category pages are only public when the category is active and exposed
    // in the booking taxonomy.
    const categories = await db
      .select({ slug: serviceCategories.slug, updatedAt: serviceCategories.updatedAt })
      .from(serviceCategories)
      .where(
        and(
          eq(serviceCategories.isActive, true),
          eq(serviceCategories.showInBooking, true),
        ),
      )

    for (const category of categories) {
      if (category.slug) {
        dynamicPages.push({
          url: `${siteUrl}/services/${category.slug}`,
          lastModified: category.updatedAt || undefined,
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    }

    // Service detail pages use the flat /services/{service-slug} route. The old
    // category-nested shape never had a matching route and caused 102 sitemap
    // URLs to return 404 on staging.
    const serviceList = await db
      .select({
        slug: services.slug,
        updatedAt: services.updatedAt
      })
      .from(services)
      .where(eq(services.isActive, true))

    for (const service of serviceList) {
      if (service.slug) {
        dynamicPages.push({
          url: `${siteUrl}/services/${service.slug}`,
          lastModified: service.updatedAt || undefined,
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }
    }
  } catch (error) {
    // If database is not available, just return static pages
    console.error('Error generating dynamic sitemap entries:', error)
  }

  // A category and service should not share a slug, but dedupe defensively so
  // malformed taxonomy data can never create duplicate sitemap entries.
  return Array.from(
    new Map([...staticPages, ...dynamicPages].map((entry) => [entry.url, entry])).values(),
  )
}
