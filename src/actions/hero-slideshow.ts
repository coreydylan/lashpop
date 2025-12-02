'use server'

import { db, websiteSettings } from "@/db"
import { eq } from "drizzle-orm"
import type {
  SlideshowPreset,
  SlideshowAssignments,
  SlideshowImage,
  DEFAULT_TRANSITION,
  DEFAULT_TIMING,
  DEFAULT_NAVIGATION
} from '@/types/hero-slideshow'

// Inline defaults to avoid import issues with server actions
const defaultTransition = {
  type: 'fade' as const,
  duration: 1000,
  easing: 'easeInOut' as const
}

const defaultTiming = {
  autoAdvance: true,
  interval: 5000,
  pauseOnHover: true,
  pauseOnInteraction: true,
  resumeDelay: 2000,
  startDelay: 1000
}

const defaultNavigation = {
  scrollEnabled: true,
  swipeEnabled: true,
  dragEnabled: false,
  scrollSensitivity: 1.0,
  snapBehavior: 'immediate' as const,
  looping: true,
  showIndicators: false,
  indicatorPosition: 'hidden' as const,
  indicatorStyle: 'dots' as const
}

const defaultAssignments: SlideshowAssignments = {
  desktop: null,
  mobile: null,
  mobileSameAsDesktop: true
}

interface SlideshowConfig {
  preset: SlideshowPreset | null
  // Fallback single image if no slideshow preset assigned
  fallbackImage: {
    url: string
    position: { x: number; y: number }
    objectFit: 'cover' | 'contain'
  } | null
}

/**
 * Get the active slideshow configuration for a specific device
 * Returns the preset if one is assigned, or the fallback single image config
 */
export async function getActiveSlideshowConfig(device: 'desktop' | 'mobile'): Promise<SlideshowConfig> {
  try {
    // Fetch assignments
    const [assignmentSetting] = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, 'hero_slideshow_assignments'))
      .limit(1)

    let assignments = { ...defaultAssignments }
    if (assignmentSetting?.config) {
      const config = assignmentSetting.config as unknown as SlideshowAssignments
      assignments = {
        desktop: config.desktop ?? null,
        mobile: config.mobile ?? null,
        mobileSameAsDesktop: config.mobileSameAsDesktop ?? true
      }
    }

    // Determine which preset ID to use
    const presetId = device === 'mobile' && assignments.mobileSameAsDesktop
      ? assignments.desktop
      : assignments[device]

    // If no preset assigned, check for fallback single image
    if (!presetId) {
      const [heroArchwaySetting] = await db
        .select()
        .from(websiteSettings)
        .where(eq(websiteSettings.section, 'hero_archway'))
        .limit(1)

      if (heroArchwaySetting?.config) {
        const archwayConfig = heroArchwaySetting.config as unknown as {
          desktop?: { url: string; position: { x: number; y: number }; objectFit: 'cover' | 'contain' }
          mobile?: { url: string; position: { x: number; y: number }; objectFit: 'cover' | 'contain' }
        }
        const fallback = archwayConfig[device]
        if (fallback) {
          return {
            preset: null,
            fallbackImage: {
              url: fallback.url,
              position: fallback.position || { x: 50, y: 50 },
              objectFit: fallback.objectFit || 'cover'
            }
          }
        }
      }

      // Ultimate fallback
      return {
        preset: null,
        fallbackImage: {
          url: '/lashpop-images/studio/studio-photos-by-salome.jpg',
          position: { x: 50, y: 50 },
          objectFit: 'cover'
        }
      }
    }

    // Fetch the preset
    const [presetsSetting] = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, 'hero_slideshow_presets'))
      .limit(1)

    if (!presetsSetting?.config) {
      return {
        preset: null,
        fallbackImage: {
          url: '/lashpop-images/studio/studio-photos-by-salome.jpg',
          position: { x: 50, y: 50 },
          objectFit: 'cover'
        }
      }
    }

    const presetsConfig = presetsSetting.config as unknown as { presets: SlideshowPreset[] }
    const preset = presetsConfig.presets?.find(p => p.id === presetId)

    if (!preset) {
      return {
        preset: null,
        fallbackImage: {
          url: '/lashpop-images/studio/studio-photos-by-salome.jpg',
          position: { x: 50, y: 50 },
          objectFit: 'cover'
        }
      }
    }

    return {
      preset,
      fallbackImage: null
    }
  } catch (error) {
    console.error('Error fetching slideshow config:', error)
    // Return default fallback on error
    return {
      preset: null,
      fallbackImage: {
        url: '/lashpop-images/studio/studio-photos-by-salome.jpg',
        position: { x: 50, y: 50 },
        objectFit: 'cover'
      }
    }
  }
}

/**
 * Get both desktop and mobile slideshow configs
 * Used by the server component for SSR
 */
export async function getSlideshowConfigs(): Promise<{
  desktop: SlideshowConfig
  mobile: SlideshowConfig
}> {
  const [desktop, mobile] = await Promise.all([
    getActiveSlideshowConfig('desktop'),
    getActiveSlideshowConfig('mobile')
  ])

  return { desktop, mobile }
}

/**
 * Get all slideshow presets
 */
export async function getAllSlideshowPresets(): Promise<SlideshowPreset[]> {
  try {
    const [setting] = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, 'hero_slideshow_presets'))
      .limit(1)

    if (!setting?.config) {
      return []
    }

    const config = setting.config as unknown as { presets: SlideshowPreset[] }
    return config.presets || []
  } catch (error) {
    console.error('Error fetching slideshow presets:', error)
    return []
  }
}
