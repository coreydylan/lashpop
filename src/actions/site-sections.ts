'use server'

import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import {
  DEFAULT_SITE_SECTIONS,
  SITE_SECTIONS_SECTION,
  mergeSiteSections,
  type SiteSectionsContent,
} from '@/types/site-sections'

/**
 * Read the canonical site-sections content. Always returns fully-populated
 * content — missing fields fall back to DEFAULT_SITE_SECTIONS (which mirrors
 * the historical hardcoded nav in Navigation.tsx).
 */
export async function getSiteSections(): Promise<SiteSectionsContent> {
  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, SITE_SECTIONS_SECTION))
      .limit(1)

    const row = rows[0]
    if (!row) return DEFAULT_SITE_SECTIONS

    const stored = row.config as Partial<SiteSectionsContent> | null
    return mergeSiteSections(stored)
  } catch (err) {
    console.error('[site-sections] read failed; returning defaults', err)
    return DEFAULT_SITE_SECTIONS
  }
}
