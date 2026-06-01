'use server'

import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import {
  DEFAULT_HOMEPAGE_SERVICES,
  HOMEPAGE_SERVICES_SECTION,
  mergeHomepageServices,
  type HomepageServicesContent,
} from '@/types/homepage-services'

/**
 * Read the homepage "Choose a Service" cards. Always returns fully-populated
 * content — missing fields fall back to DEFAULT_HOMEPAGE_SERVICES (which
 * mirrors the historical hardcoded copy in ServicesSection.tsx).
 */
export async function getHomepageServices(): Promise<HomepageServicesContent> {
  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, HOMEPAGE_SERVICES_SECTION))
      .limit(1)

    const stored = rows[0]?.config as Partial<HomepageServicesContent> | null
    return mergeHomepageServices(stored)
  } catch (err) {
    console.error('[homepage-services] read failed; returning defaults', err)
    return DEFAULT_HOMEPAGE_SERVICES
  }
}
