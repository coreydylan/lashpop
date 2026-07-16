import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { requireAdminApi } from '@/lib/admin/auth'
import { writeWebsiteSetting } from '@/lib/admin/settings-writer'
import {
  STUDIO_SETTINGS_SECTION,
  mergeStudioSettings,
  type StudioSettings,
} from '@/types/studio'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  const db = getDb()
  const rows = await db
    .select()
    .from(websiteSettings)
    .where(eq(websiteSettings.section, STUDIO_SETTINGS_SECTION))
    .limit(1)

  const row = rows[0]
  const settings = mergeStudioSettings(row?.config as Partial<StudioSettings> | null)
  return NextResponse.json({
    settings,
    version: row?.version ?? 0,
    sourceOwner: row?.sourceOwner ?? 'admin',
  })
}

export async function PUT(req: NextRequest) {
  let body: { settings?: Partial<StudioSettings>; baseVersion?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.settings || typeof body.settings !== 'object' || Array.isArray(body.settings)) {
    return NextResponse.json({ error: 'settings is required' }, { status: 400 })
  }
  if (typeof body.baseVersion !== 'number') {
    return NextResponse.json({ error: 'baseVersion is required' }, { status: 400 })
  }

  const merged = mergeStudioSettings(body.settings)
  merged.updatedAt = new Date().toISOString()

  const result = await writeWebsiteSetting({
    section: STUDIO_SETTINGS_SECTION,
    config: merged,
    baseVersion: body.baseVersion,
    action: 'studio.update',
  })
  if (!result.ok) return NextResponse.json(result, { status: result.status })

  return NextResponse.json({
    settings: result.setting.config as unknown as StudioSettings,
    version: result.setting.version,
    sourceOwner: result.setting.sourceOwner,
  })
}
