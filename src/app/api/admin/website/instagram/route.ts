import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { eq } from 'drizzle-orm'
import { requireAdminApi } from '@/lib/admin/auth'
import { writeWebsiteSetting } from '@/lib/admin/settings-writer'

export const dynamic = 'force-dynamic'

const INSTAGRAM_SECTION = 'instagram_carousel'

// Default settings
const defaultSettings = {
  maxPosts: 12,
  autoScroll: true,
  scrollSpeed: 20,
  showCaptions: false
}

// GET - Fetch Instagram carousel settings
export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  try {
    const db = getDb()
    const [setting] = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, INSTAGRAM_SECTION))
      .limit(1)
    const settings = setting?.config
      ? { ...defaultSettings, ...(setting.config as Record<string, unknown>) }
      : { ...defaultSettings }

    return NextResponse.json({
      settings,
      version: setting?.version ?? 0,
      sourceOwner: setting?.sourceOwner ?? 'admin',
    })
  } catch (error) {
    console.error('Error fetching Instagram settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT - Update Instagram carousel settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as { settings?: Record<string, unknown>; baseVersion?: unknown }
    const settings = body.settings

    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
    if (typeof body.baseVersion !== 'number') {
      return NextResponse.json({ error: 'baseVersion is required' }, { status: 400 })
    }

    // Validate and merge with defaults
    const config = {
      maxPosts: Math.max(4, Math.min(24, Number(settings.maxPosts || defaultSettings.maxPosts))),
      autoScroll: Boolean(settings.autoScroll ?? defaultSettings.autoScroll),
      scrollSpeed: Math.max(10, Math.min(40, Number(settings.scrollSpeed || defaultSettings.scrollSpeed))),
      showCaptions: Boolean(settings.showCaptions ?? defaultSettings.showCaptions),
      updatedAt: new Date().toISOString()
    }

    const result = await writeWebsiteSetting({
      section: INSTAGRAM_SECTION,
      config,
      baseVersion: body.baseVersion,
      action: 'instagram.settings.update',
    })
    if (!result.ok) return NextResponse.json(result, { status: result.status })

    return NextResponse.json({
      success: true,
      settings: result.setting.config,
      version: result.setting.version,
      sourceOwner: result.setting.sourceOwner,
    })
  } catch (error) {
    console.error('Error updating Instagram settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
