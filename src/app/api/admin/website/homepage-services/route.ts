import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { requireAdminApi } from '@/lib/admin/auth'
import { writeWebsiteSetting } from '@/lib/admin/settings-writer'
import {
  HOMEPAGE_SERVICES_SECTION,
  mergeHomepageServices,
  type HomepageServicesContent,
} from '@/types/homepage-services'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  const db = getDb()
  const rows = await db
    .select()
    .from(websiteSettings)
    .where(eq(websiteSettings.section, HOMEPAGE_SERVICES_SECTION))
    .limit(1)

  const content = mergeHomepageServices(rows[0]?.config as Partial<HomepageServicesContent> | null)
  return NextResponse.json({
    content,
    version: rows[0]?.version ?? 0,
    sourceOwner: rows[0]?.sourceOwner ?? 'admin',
  })
}

export async function PUT(req: NextRequest) {
  let body: { cards?: HomepageServicesContent['cards']; baseVersion?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!Array.isArray(body.cards)) {
    return NextResponse.json({ error: 'cards is required' }, { status: 400 })
  }
  if (typeof body.baseVersion !== 'number') {
    return NextResponse.json({ error: 'baseVersion is required' }, { status: 400 })
  }

  const merged = mergeHomepageServices({ cards: body.cards })
  const result = await writeWebsiteSetting({
    section: HOMEPAGE_SERVICES_SECTION,
    config: merged,
    baseVersion: body.baseVersion,
    action: 'homepage-services.update',
  })
  if (!result.ok) return NextResponse.json(result, { status: result.status })

  return NextResponse.json({
    content: result.setting.config as unknown as HomepageServicesContent,
    version: result.setting.version,
    sourceOwner: result.setting.sourceOwner,
  })
}
