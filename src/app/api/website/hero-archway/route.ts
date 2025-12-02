import { NextResponse } from 'next/server'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { eq } from 'drizzle-orm'

// Cache for 60 seconds, revalidate in background
export const revalidate = 60

const HERO_ARCHWAY_SECTION = 'hero_archway'

// Default image used when no settings are configured
const defaultImage = {
  assetId: 'default',
  url: '/lashpop-images/studio/studio-photos-by-salome.jpg',
  fileName: 'studio-photos-by-salome.jpg',
  position: { x: 50, y: 50 },
  objectFit: 'cover' as const
}

// GET - Fetch hero archway settings for public consumption
export async function GET() {
  try {
    const db = getDb()

    let desktop = defaultImage
    let mobile = defaultImage

    try {
      const [setting] = await db
        .select()
        .from(websiteSettings)
        .where(eq(websiteSettings.section, HERO_ARCHWAY_SECTION))
        .limit(1)

      if (setting?.config) {
        const config = setting.config as { desktop?: typeof defaultImage; mobile?: typeof defaultImage }
        if (config.desktop) desktop = config.desktop
        if (config.mobile) mobile = config.mobile
      }
    } catch {
      // Table might not exist yet, return defaults
    }

    return NextResponse.json({ desktop, mobile })
  } catch (error) {
    console.error('Error fetching hero archway settings:', error)
    // Return defaults on error so the page still works
    return NextResponse.json({ desktop: defaultImage, mobile: defaultImage })
  }
}
