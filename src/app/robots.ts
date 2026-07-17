import { MetadataRoute } from 'next'
import { getSEOSettings } from '@/actions/seo'

/**
 * Generate robots.txt dynamically
 *
 * Public content is available to search and AI crawlers. Operational, preview,
 * authentication, and project-only routes are kept out of the crawl graph.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSEOSettings()
  const siteUrl = (settings.site.siteUrl || 'https://lashpopstudios.com').replace(/\/+$/, '')

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/private/',
        '/login',
        '/confirm/',
        '/punchlist',
        '/preview/',
        '/seoguide',
        '/staffphoto',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
