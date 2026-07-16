import { Metadata } from 'next'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { getStudioSettings } from '@/actions/studio'
import { STUDIO_SETTINGS_SECTION } from '@/types/studio'
import { StudioInfoEditor } from './StudioInfoEditor'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Studio Info — LashPop Admin',
}

export default async function StudioInfoPage() {
  const db = getDb()
  const [settings, rows] = await Promise.all([
    getStudioSettings(),
    db
      .select({ version: websiteSettings.version, sourceOwner: websiteSettings.sourceOwner })
      .from(websiteSettings)
      .where(eq(websiteSettings.section, STUDIO_SETTINGS_SECTION))
      .limit(1),
  ])
  return (
    <StudioInfoEditor
      initialSettings={settings}
      initialVersion={rows[0]?.version ?? 0}
      initialSourceOwner={rows[0]?.sourceOwner ?? 'admin'}
    />
  )
}
