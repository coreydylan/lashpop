'use server'

import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { HERO_CONTENT_SECTION, mergeHeroContent, type HeroContent } from '@/types/hero-content'

export async function getHeroContent(): Promise<HeroContent> {
  try {
    const [row] = await getDb()
      .select({ config: websiteSettings.config })
      .from(websiteSettings)
      .where(eq(websiteSettings.section, HERO_CONTENT_SECTION))
      .limit(1)
    return mergeHeroContent(row?.config as Partial<HeroContent> | null)
  } catch (error) {
    console.error('[hero-content] failed to load content', error)
    return mergeHeroContent(null)
  }
}
