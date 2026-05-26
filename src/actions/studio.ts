'use server'

import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import {
  DEFAULT_STUDIO_SETTINGS,
  STUDIO_SETTINGS_SECTION,
  mergeStudioSettings,
  type StudioSettings,
} from '@/types/studio'

/**
 * Read the studio identity settings. Always returns a fully-populated
 * StudioSettings — missing fields fall back to DEFAULT_STUDIO_SETTINGS
 * (which mirrors the historical hardcoded values).
 *
 * Safe to call from server components on every render — the row is
 * tiny and the call is one indexed lookup.
 */
export async function getStudioSettings(): Promise<StudioSettings> {
  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, STUDIO_SETTINGS_SECTION))
      .limit(1)

    const row = rows[0]
    if (!row) return DEFAULT_STUDIO_SETTINGS

    const stored = row.config as Partial<StudioSettings> | null
    return mergeStudioSettings(stored)
  } catch (err) {
    console.error('[studio] getStudioSettings failed; returning defaults', err)
    return DEFAULT_STUDIO_SETTINGS
  }
}
