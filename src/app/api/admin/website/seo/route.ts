import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { eq } from 'drizzle-orm'
import { requireAdminApi } from '@/lib/admin/auth'
import { writeWebsiteSetting } from '@/lib/admin/settings-writer'
import { SEOSettings, DEFAULT_SEO_SETTINGS, mergeWithDefaults } from '@/types/seo'

export const dynamic = 'force-dynamic'

const SEO_SECTION = 'seo_metadata'

// GET - Fetch SEO settings
export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  try {
    const db = getDb()
    const [setting] = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, SEO_SECTION))
      .limit(1)

    const settings = setting?.config
      ? mergeWithDefaults(setting.config as unknown as Partial<SEOSettings>)
      : { ...DEFAULT_SEO_SETTINGS }

    return NextResponse.json({
      settings,
      version: setting?.version ?? 0,
      sourceOwner: setting?.sourceOwner ?? 'admin',
    })
  } catch (error) {
    console.error('Error fetching SEO settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT - Update SEO settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings, baseVersion } = body as { settings?: Partial<SEOSettings>; baseVersion?: unknown }

    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
    if (typeof baseVersion !== 'number') {
      return NextResponse.json({ error: 'baseVersion is required' }, { status: 400 })
    }

    // Merge with defaults and add timestamp
    const config: SEOSettings = {
      ...mergeWithDefaults(settings),
      updatedAt: new Date().toISOString()
    }

    const result = await writeWebsiteSetting({
      section: SEO_SECTION,
      config,
      baseVersion,
      action: 'seo.settings.update',
    })
    if (!result.ok) return NextResponse.json(result, { status: result.status })

    return NextResponse.json({
      success: true,
      settings: result.setting.config,
      version: result.setting.version,
      sourceOwner: result.setting.sourceOwner,
    })
  } catch (error) {
    console.error('Error updating SEO settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
