'use server'

import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import {
  DEFAULT_FOOTER_CONTENT,
  FOOTER_CONTENT_SECTION,
  mergeFooterContent,
  type FooterContent,
} from '@/types/footer-content'

/**
 * Read the footer content. Always returns fully-populated content —
 * missing fields fall back to DEFAULT_FOOTER_CONTENT (which mirrors the
 * historical hardcoded copy in FooterV2.tsx).
 */
export async function getFooterContent(): Promise<FooterContent> {
  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, FOOTER_CONTENT_SECTION))
      .limit(1)

    const row = rows[0]
    if (!row) return DEFAULT_FOOTER_CONTENT

    const stored = row.config as Partial<FooterContent> | null
    return mergeFooterContent(stored)
  } catch (err) {
    console.error('[footer-content] read failed; returning defaults', err)
    return DEFAULT_FOOTER_CONTENT
  }
}
