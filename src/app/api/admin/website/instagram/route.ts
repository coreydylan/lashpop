import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { eq } from 'drizzle-orm'

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
  try {
    const db = getDb()

    let settings = { ...defaultSettings }

    try {
      const [setting] = await db
        .select()
        .from(websiteSettings)
        .where(eq(websiteSettings.section, INSTAGRAM_SECTION))
        .limit(1)
      
      if (setting?.config) {
        settings = { ...settings, ...(setting.config as any) }
      }
    } catch {
      // Table might not exist yet
    }

    return NextResponse.json({ settings })
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
    const db = getDb()
    const { settings } = await request.json()

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Validate and merge with defaults
    const config = {
      maxPosts: Math.max(4, Math.min(24, settings.maxPosts || defaultSettings.maxPosts)),
      autoScroll: Boolean(settings.autoScroll ?? defaultSettings.autoScroll),
      scrollSpeed: Math.max(10, Math.min(40, settings.scrollSpeed || defaultSettings.scrollSpeed)),
      showCaptions: Boolean(settings.showCaptions ?? defaultSettings.showCaptions),
      updatedAt: new Date().toISOString()
    }

    try {
      const [existing] = await db
        .select()
        .from(websiteSettings)
        .where(eq(websiteSettings.section, INSTAGRAM_SECTION))
        .limit(1)

      if (existing) {
        await db
          .update(websiteSettings)
          .set({ config, updatedAt: new Date() })
          .where(eq(websiteSettings.section, INSTAGRAM_SECTION))
      } else {
        await db
          .insert(websiteSettings)
          .values({ section: INSTAGRAM_SECTION, config })
      }
    } catch (dbError) {
      console.error('Could not persist to database:', dbError)
    }

    return NextResponse.json({ success: true, settings: config })
  } catch (error) {
    console.error('Error updating Instagram settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

