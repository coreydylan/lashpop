import { Metadata } from 'next'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { getFounderLetter } from '@/actions/founder-letter'
import { FOUNDER_LETTER_SECTION } from '@/types/founder-letter'
import { FounderLetterEditor } from './FounderLetterEditor'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Founder Letter — LashPop Admin',
}

export default async function FounderLetterPage() {
  const db = getDb()
  const [content, rows] = await Promise.all([
    getFounderLetter(),
    db
      .select({ version: websiteSettings.version, sourceOwner: websiteSettings.sourceOwner })
      .from(websiteSettings)
      .where(eq(websiteSettings.section, FOUNDER_LETTER_SECTION))
      .limit(1),
  ])
  return (
    <FounderLetterEditor
      initialContent={content}
      initialVersion={rows[0]?.version ?? 0}
      initialSourceOwner={rows[0]?.sourceOwner ?? 'admin'}
    />
  )
}
