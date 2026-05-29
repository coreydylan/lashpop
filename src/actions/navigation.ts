'use server'

import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import {
  DEFAULT_NAVIGATION,
  NAVIGATION_SECTION,
  mergeNavigation,
  type NavigationContent,
} from '@/types/navigation'

/**
 * Read the navigation content. Always returns fully-populated content
 * — missing fields fall back to DEFAULT_NAVIGATION (which mirrors the
 * historical hardcoded copy in Navigation.tsx).
 */
export async function getNavigation(): Promise<NavigationContent> {
  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, NAVIGATION_SECTION))
      .limit(1)

    const row = rows[0]
    if (!row) return DEFAULT_NAVIGATION

    const stored = row.config as Partial<NavigationContent> | null
    return mergeNavigation(stored)
  } catch (err) {
    console.error('[navigation] read failed; returning defaults', err)
    return DEFAULT_NAVIGATION
  }
}
