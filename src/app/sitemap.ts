import { MetadataRoute } from 'next'
import { getSEOSettings } from '@/actions/seo'
import { getDb } from '@/db'
import { services } from '@/db/schema/services'
import { serviceCategories } from '@/db/schema/service_categories'
import { eq } from 'drizzle-orm'

/**
 * Generate dynamic sitemap.xml
 *
 * Includes:
 * - Static pages (home, services, work-with-us)
 * - Service category pages (if they exist)
 * - Individual service pages (if they exist)
 * - Team member pages (if they exist)
 * - llms.txt for AI discovery
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSEOSettings()
  const siteUrl = settings.site.siteUrl || 'https://lashpopstudios.com'
  const now = new Date()

  // Static pages with their priorities
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/services`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/work-with-us`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // llms.txt for AI crawler discovery
    {
      url: `${siteUrl}/llms.txt`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  // Dynamic pages from database
  const dynamicPages: MetadataRoute.Sitemap = []

  try {
    const db = getDb()

    // Get active service categories
    const categories = await db
      .select({ slug: serviceCategories.slug, updatedAt: serviceCategories.updatedAt })
      .from(serviceCategories)
      .where(eq(serviceCategories.isActive, true))

    for (const category of categories) {
      if (category.slug) {
        dynamicPages.push({
          url: `${siteUrl}/services/${category.slug}`,
          lastModified: category.updatedAt || now,
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    }

    // Get active services
    const serviceList = await db
      .select({
        slug: services.slug,
        categorySlug: serviceCategories.slug,
        updatedAt: services.updatedAt
      })
      .from(services)
      .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(eq(services.isActive, true))

    for (const service of serviceList) {
      if (service.slug && service.categorySlug) {
        dynamicPages.push({
          url: `${siteUrl}/services/${service.categorySlug}/${service.slug}`,
          lastModified: service.updatedAt || now,
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }
    }
  } catch (error) {
    // If database is not available, just return static pages
    console.error('Error generating dynamic sitemap entries:', error)
  }

  return [...staticPages, ...dynamicPages]
}
