'use server'

import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import {
  DEFAULT_FOUNDER_LETTER,
  FOUNDER_LETTER_SECTION,
  mergeFounderLetter,
  type FounderLetterContent,
} from '@/types/founder-letter'

/**
 * Read the founder-letter content. Always returns fully-populated content
 * — missing fields fall back to DEFAULT_FOUNDER_LETTER (which mirrors the
 * historical hardcoded copy in FounderLetterSection.tsx).
 */
export async function getFounderLetter(): Promise<FounderLetterContent> {
  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, FOUNDER_LETTER_SECTION))
      .limit(1)

    const row = rows[0]
    if (!row) return DEFAULT_FOUNDER_LETTER

    const stored = row.config as Partial<FounderLetterContent> | null
    return mergeFounderLetter(stored)
  } catch (err) {
    console.error('[founder-letter] read failed; returning defaults', err)
    return DEFAULT_FOUNDER_LETTER
  }
}
