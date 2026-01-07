'use server'

import { getDb, websiteSettings } from "@/db"
import { eq } from "drizzle-orm"

// Types for hero archway configuration
export interface HeroArchwayImage {
  assetId: string
  url: string
  fileName: string
  position: { x: number; y: number }
  objectFit: 'cover' | 'contain'
}

export interface HeroArchwayConfig {
  desktop: HeroArchwayImage
  mobile: HeroArchwayImage
}

// Default settings - uses the current hardcoded image
const defaultImage: HeroArchwayImage = {
  assetId: 'default',
  url: '/lashpop-images/studio/studio-photos-by-salome.jpg',
  fileName: 'studio-photos-by-salome.jpg',
  position: { x: 50, y: 50 },
  objectFit: 'cover'
}

const defaultConfig: HeroArchwayConfig = {
  desktop: defaultImage,
  mobile: defaultImage
}

/**
 * Get hero archway settings from the database
 * Used by the server component to pass to HeroSection and MobileHeroBackground
 */
export async function getHeroArchwayConfig(): Promise<HeroArchwayConfig> {
  try {
    const db = getDb()
    const [setting] = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, 'hero_archway'))
      .limit(1)

    if (setting?.config) {
      const config = setting.config as Partial<HeroArchwayConfig>
      return {
        desktop: config.desktop || defaultImage,
        mobile: config.mobile || defaultImage
      }
    }
  } catch (error) {
    console.error('Error fetching hero archway config:', error)
    // Return defaults if there's any error
  }

  return defaultConfig
}
