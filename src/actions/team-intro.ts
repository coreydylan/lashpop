'use server'

import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import {
  DEFAULT_TEAM_INTRO,
  TEAM_INTRO_SECTION,
  mergeTeamIntro,
  type TeamIntroContent,
} from '@/types/team-intro'

/**
 * Read the team-intro content. Always returns fully-populated content
 * — missing fields fall back to DEFAULT_TEAM_INTRO (which mirrors the
 * historical hardcoded copy in EnhancedTeamSectionClient.tsx).
 */
export async function getTeamIntro(): Promise<TeamIntroContent> {
  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, TEAM_INTRO_SECTION))
      .limit(1)

    const row = rows[0]
    if (!row) return DEFAULT_TEAM_INTRO

    const stored = row.config as Partial<TeamIntroContent> | null
    return mergeTeamIntro(stored)
  } catch (err) {
    console.error('[team-intro] read failed; returning defaults', err)
    return DEFAULT_TEAM_INTRO
  }
}
