import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { eq } from 'drizzle-orm'
import { requireAdminApi } from '@/lib/admin/auth'
import { writeWebsiteSetting } from '@/lib/admin/settings-writer'

export const dynamic = 'force-dynamic'

const HERO_ARCHWAY_SECTION = 'hero_archway'

// Types for hero archway configuration
export interface HeroArchwayImage {
  assetId: string
  url: string
  fileName: string
  position: { x: number; y: number }
  objectFit: 'cover' | 'contain'
}

export interface HeroArchwayConfig {
  desktop: HeroArchwayImage | null
  mobile: HeroArchwayImage | null
  updatedAt?: string
}

// Default settings - uses the current hardcoded image
const defaultSettings: HeroArchwayConfig = {
  desktop: {
    assetId: 'default',
    url: '/lashpop-images/studio/studio-photos-by-salome.jpg',
    fileName: 'studio-photos-by-salome.jpg',
    position: { x: 50, y: 50 },
    objectFit: 'cover'
  },
  mobile: {
    assetId: 'default',
    url: '/lashpop-images/studio/studio-photos-by-salome.jpg',
    fileName: 'studio-photos-by-salome.jpg',
    position: { x: 50, y: 50 },
    objectFit: 'cover'
  }
}

// GET - Fetch hero archway settings
export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  try {
    const db = getDb()

    let settings: HeroArchwayConfig = { ...defaultSettings }
    let version = 0
    let sourceOwner = 'admin'

    try {
      const [setting] = await db
        .select()
        .from(websiteSettings)
        .where(eq(websiteSettings.section, HERO_ARCHWAY_SECTION))
        .limit(1)

      if (setting?.config) {
        const config = setting.config as unknown as HeroArchwayConfig
        settings = {
          desktop: config.desktop || defaultSettings.desktop,
          mobile: config.mobile || defaultSettings.mobile,
          updatedAt: config.updatedAt
        }
      }
      version = setting?.version ?? 0
      sourceOwner = setting?.sourceOwner ?? 'admin'
    } catch {
      // Table might not exist yet, return defaults
    }

    return NextResponse.json({ settings, version, sourceOwner })
  } catch (error) {
    console.error('Error fetching hero archway settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT - Update hero archway settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings, baseVersion } = body as {
      settings: HeroArchwayConfig
      baseVersion: number
    }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Validate image settings
    const validateImage = (img: HeroArchwayImage | null): HeroArchwayImage | null => {
      if (!img) return null
      return {
        assetId: img.assetId || 'default',
        url: img.url || defaultSettings.desktop!.url,
        fileName: img.fileName || 'unknown',
        position: {
          x: Math.max(0, Math.min(100, img.position?.x ?? 50)),
          y: Math.max(0, Math.min(100, img.position?.y ?? 50))
        },
        objectFit: img.objectFit === 'contain' ? 'contain' : 'cover'
      }
    }

    const config: HeroArchwayConfig = {
      desktop: validateImage(settings.desktop),
      mobile: validateImage(settings.mobile),
      updatedAt: new Date().toISOString()
    }

    const result = await writeWebsiteSetting({
      section: HERO_ARCHWAY_SECTION,
      config,
      baseVersion,
      action: 'hero.archway.update',
    })

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status })
    }

    return NextResponse.json({
      success: true,
      settings: config,
      version: result.setting.version,
      sourceOwner: result.setting.sourceOwner,
    })
  } catch (error) {
    console.error('Error updating hero archway settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
