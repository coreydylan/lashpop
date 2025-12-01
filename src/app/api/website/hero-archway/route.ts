import { NextResponse } from 'next/server'
import { db } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { eq } from 'drizzle-orm'
import {
  HeroArchwayConfig,
  defaultHeroArchwayConfig,
  getRandomImage
} from '@/types/hero-archway'

// Cache the response for 60 seconds to reduce DB calls
export const revalidate = 60

const SECTION_KEY = 'hero-archway'

// GET - Fetch hero archway configuration (public, read-only)
export async function GET() {
  try {
    const result = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, SECTION_KEY))
      .limit(1)

    const config = result.length > 0
      ? (result[0].config as HeroArchwayConfig)
      : defaultHeroArchwayConfig

    // Select random images based on mode
    let desktopImage = null
    let mobileImage = null

    if (config.randomMode === 'disabled') {
      // Use first enabled image
      desktopImage = config.desktop.images.find(img => img.enabled) || null
      mobileImage = config.mobile.images.find(img => img.enabled) || null
    } else {
      // Use weighted random selection
      desktopImage = getRandomImage(config.desktop.images)
      mobileImage = getRandomImage(config.mobile.images)
    }

    return NextResponse.json({
      config,
      selectedImages: {
        desktop: desktopImage,
        mobile: mobileImage
      }
    })
  } catch (error) {
    console.error('[Hero Archway Public API] Error fetching config:', error)
    // Return defaults on error
    return NextResponse.json({
      config: defaultHeroArchwayConfig,
      selectedImages: {
        desktop: null,
        mobile: null
      }
    })
  }
}
