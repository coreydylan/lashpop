'use server'

import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { eq } from 'drizzle-orm'
import { SEOSettings, DEFAULT_SEO_SETTINGS, mergeWithDefaults } from '@/types/seo'

const SEO_SECTION = 'seo_metadata'

/**
 * Fetch SEO settings from database with fallback to defaults
 */
export async function getSEOSettings(): Promise<SEOSettings> {
  try {
    const db = getDb()

    const [setting] = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, SEO_SECTION))
      .limit(1)

    if (setting?.config) {
      const config = setting.config as unknown as Partial<SEOSettings>
      return mergeWithDefaults(config)
    }

    return DEFAULT_SEO_SETTINGS
  } catch {
    // Return defaults if database isn't ready
    return DEFAULT_SEO_SETTINGS
  }
}

/**
 * Get site-level SEO settings only
 */
export async function getSiteSEO() {
  const settings = await getSEOSettings()
  return settings.site
}

/**
 * Get page-specific SEO settings
 */
export async function getPageSEO(page: 'homepage' | 'services' | 'workWithUs') {
  const settings = await getSEOSettings()
  return {
    site: settings.site,
    page: settings.pages[page]
  }
}
