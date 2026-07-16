'use server'

import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import {
  WORK_WITH_US_CONTENT_SECTION,
  mergeWorkWithUsContent,
  type WorkWithUsContent,
} from '@/types/work-with-us-content'

export async function getWorkWithUsContent(): Promise<WorkWithUsContent> {
  try {
    const [row] = await getDb()
      .select({ config: websiteSettings.config })
      .from(websiteSettings)
      .where(eq(websiteSettings.section, WORK_WITH_US_CONTENT_SECTION))
      .limit(1)
    return mergeWorkWithUsContent(row?.config as Partial<WorkWithUsContent> | null)
  } catch (error) {
    console.error('[work-with-us-content] failed to load content', error)
    return mergeWorkWithUsContent(null)
  }
}
