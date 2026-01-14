import { MetadataRoute } from 'next'
import { getSEOSettings } from '@/actions/seo'

/**
 * Generate robots.txt dynamically
 *
 * This includes:
 * - Standard search engine crawlers (Google, Bing, etc.)
 * - AI crawlers (GPTBot, Claude, Perplexity, etc.)
 * - Sitemap reference
 * - llms.txt reference for AI discovery
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSEOSettings()
  const siteUrl = settings.site.siteUrl || 'https://lashpopstudios.com'

  return {
    rules: [
      {
        // Allow all standard crawlers
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/private/',
        ],
      },
      {
        // Allow GPTBot (OpenAI/ChatGPT)
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      {
        // Allow Claude (Anthropic)
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      {
        // Allow Anthropic's crawlers
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      {
        // Allow Google Extended (AI features)
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      {
        // Allow PerplexityBot
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      {
        // Allow Cohere
        userAgent: 'cohere-ai',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      {
        // Allow CommonCrawl (used by many AI training)
        userAgent: 'CCBot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      {
        // Allow YouBot (You.com)
        userAgent: 'YouBot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    // Note: llms.txt is referenced separately via <link> tag and direct access
  }
}
