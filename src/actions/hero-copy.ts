'use server'

import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import {
  DEFAULT_HERO_COPY,
  HERO_COPY_SECTION,
  mergeHeroCopy,
  type HeroCopyContent,
} from '@/types/hero-copy'

/**
 * Read the hero-copy content. Always returns fully-populated content
 * — missing fields fall back to DEFAULT_HERO_COPY (which mirrors the
 * historical hardcoded copy in HeroSection.tsx).
 */
export async function getHeroCopy(): Promise<HeroCopyContent> {
  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, HERO_COPY_SECTION))
      .limit(1)

    const row = rows[0]
    if (!row) return DEFAULT_HERO_COPY

    const stored = row.config as Partial<HeroCopyContent> | null
    return mergeHeroCopy(stored)
  } catch (err) {
    console.error('[hero-copy] read failed; returning defaults', err)
    return DEFAULT_HERO_COPY
  }
}
