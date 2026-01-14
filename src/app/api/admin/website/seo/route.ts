import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { SEOSettings, DEFAULT_SEO_SETTINGS, mergeWithDefaults } from '@/types/seo'

export const dynamic = 'force-dynamic'

const SEO_SECTION = 'seo_metadata'

// GET - Fetch SEO settings
export async function GET() {
  try {
    const db = getDb()

    let settings: SEOSettings = { ...DEFAULT_SEO_SETTINGS }

    try {
      const [setting] = await db
        .select()
        .from(websiteSettings)
        .where(eq(websiteSettings.section, SEO_SECTION))
        .limit(1)

      if (setting?.config) {
        const config = setting.config as unknown as Partial<SEOSettings>
        settings = mergeWithDefaults(config)
      }
    } catch {
      // Table might not exist yet, return defaults
    }

    return NextResponse.json({ settings })
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
    const db = getDb()
    const body = await request.json()
    const { settings } = body as { settings: Partial<SEOSettings> }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Merge with defaults and add timestamp
    const config: SEOSettings = {
      ...mergeWithDefaults(settings),
      updatedAt: new Date().toISOString()
    }

    try {
      const [existing] = await db
        .select()
        .from(websiteSettings)
        .where(eq(websiteSettings.section, SEO_SECTION))
        .limit(1)

      if (existing) {
        await db
          .update(websiteSettings)
          .set({ config: config as unknown as Record<string, unknown>, updatedAt: new Date() })
          .where(eq(websiteSettings.section, SEO_SECTION))
      } else {
        await db
          .insert(websiteSettings)
          .values({ section: SEO_SECTION, config: config as unknown as Record<string, unknown> })
      }
    } catch (dbError) {
      console.error('Could not persist to database:', dbError)
      return NextResponse.json(
        { error: 'Failed to save to database' },
        { status: 500 }
      )
    }

    // Revalidate all pages so changes appear
    revalidatePath('/')
    revalidatePath('/services')
    revalidatePath('/work-with-us')

    return NextResponse.json({ success: true, settings: config })
  } catch (error) {
    console.error('Error updating SEO settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
