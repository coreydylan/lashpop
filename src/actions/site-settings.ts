'use server'

import { db, websiteSettings } from "@/db"
import { eq } from "drizzle-orm"

// Type definitions for each settings section
export type BusinessInfo = {
  name: string
  phone: string
  email: string
  streetAddress: string
  city: string
  state: string
  postalCode: string
  country: string
  latitude: number
  longitude: number
}

export type SeoSettings = {
  metaTitle: string
  metaDescription: string
  ogTitle: string
  ogDescription: string
}

export type SocialLinks = {
  instagram?: string
  facebook?: string
  tiktok?: string
  yelp?: string
  google?: string
}

export type AnalyticsSettings = {
  ga4MeasurementId?: string
  metaPixelId?: string
}

export type ServiceAreas = {
  cities: string[]
}

export type OpeningHours = {
  dayOfWeek: string[]
  opens: string
  closes: string
}

export type ProudlyServingText = {
  text: string
}

export type SiteSettings = {
  businessInfo: BusinessInfo
  seoSettings: SeoSettings
  socialLinks: SocialLinks
  analyticsSettings: AnalyticsSettings
  serviceAreas: ServiceAreas
  openingHours: OpeningHours
  proudlyServingText: ProudlyServingText
}

// Default values
const DEFAULT_BUSINESS_INFO: BusinessInfo = {
  name: 'LashPop Studios',
  phone: '+1-760-212-0448',
  email: 'hello@lashpopstudios.com',
  streetAddress: '429 S Coast Hwy',
  city: 'Oceanside',
  state: 'CA',
  postalCode: '92054',
  country: 'US',
  latitude: 33.1959,
  longitude: -117.3795,
}

const DEFAULT_SEO_SETTINGS: SeoSettings = {
  metaTitle: 'LashPop Studios | Premier Lash Extensions in Oceanside & North County San Diego',
  metaDescription: 'LashPop Studios | Premier Lash Extensions in Oceanside & North County San Diego',
  ogTitle: 'LashPop Studios | Premier Lash Extensions in Oceanside & North County San Diego',
  ogDescription: 'LashPop Studios | Premier Lash Extensions in Oceanside & North County San Diego',
}

const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  instagram: 'https://instagram.com/lashpopstudios',
  facebook: 'https://facebook.com/lashpopstudios',
}

const DEFAULT_ANALYTICS_SETTINGS: AnalyticsSettings = {
  ga4MeasurementId: undefined,
  metaPixelId: undefined,
}

const DEFAULT_SERVICE_AREAS: ServiceAreas = {
  cities: ['Oceanside', 'Carlsbad', 'Vista', 'Encinitas', 'San Marcos', 'Escondido'],
}

const DEFAULT_OPENING_HOURS: OpeningHours = {
  dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  opens: '08:00',
  closes: '19:30',
}

const DEFAULT_PROUDLY_SERVING_TEXT: ProudlyServingText = {
  text: 'Lash Extensions Oceanside • Lash Extensions Carlsbad • Lash Extensions Vista • Lash Extensions Encinitas • Lash Extensions San Marcos • Lash Extensions Escondido',
}

// Helper function to get a specific setting section
async function getSettingSection<T>(section: string, defaultValue: T): Promise<T> {
  try {
    const result = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, section))
      .limit(1)

    if (result.length > 0 && result[0].config) {
      return { ...defaultValue, ...result[0].config } as T
    }
    return defaultValue
  } catch (error) {
    console.error(`Error fetching ${section}:`, error)
    return defaultValue
  }
}

// Get all site settings merged with defaults
export async function getSiteSettings(): Promise<SiteSettings> {
  const [businessInfo, seoSettings, socialLinks, analyticsSettings, serviceAreas, openingHours, proudlyServingText] =
    await Promise.all([
      getBusinessInfo(),
      getSeoSettings(),
      getSocialLinks(),
      getAnalyticsSettings(),
      getServiceAreas(),
      getOpeningHours(),
      getProudlyServingText(),
    ])

  return {
    businessInfo,
    seoSettings,
    socialLinks,
    analyticsSettings,
    serviceAreas,
    openingHours,
    proudlyServingText,
  }
}

// Get business info with defaults
export async function getBusinessInfo(): Promise<BusinessInfo> {
  return getSettingSection<BusinessInfo>('business_info', DEFAULT_BUSINESS_INFO)
}

// Get SEO settings with defaults
export async function getSeoSettings(): Promise<SeoSettings> {
  return getSettingSection<SeoSettings>('seo_settings', DEFAULT_SEO_SETTINGS)
}

// Get social links with defaults
export async function getSocialLinks(): Promise<SocialLinks> {
  return getSettingSection<SocialLinks>('social_links', DEFAULT_SOCIAL_LINKS)
}

// Get analytics settings with defaults
export async function getAnalyticsSettings(): Promise<AnalyticsSettings> {
  return getSettingSection<AnalyticsSettings>('analytics', DEFAULT_ANALYTICS_SETTINGS)
}

// Get service areas with defaults
export async function getServiceAreas(): Promise<ServiceAreas> {
  return getSettingSection<ServiceAreas>('service_areas', DEFAULT_SERVICE_AREAS)
}

// Get opening hours with defaults
export async function getOpeningHours(): Promise<OpeningHours> {
  return getSettingSection<OpeningHours>('opening_hours', DEFAULT_OPENING_HOURS)
}

// Get proudly serving text with defaults
export async function getProudlyServingText(): Promise<ProudlyServingText> {
  return getSettingSection<ProudlyServingText>('proudly_serving_text', DEFAULT_PROUDLY_SERVING_TEXT)
}

// Update a specific section
export async function updateSiteSettings(
  section: string,
  config: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if the section already exists
    const existing = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, section))
      .limit(1)

    if (existing.length > 0) {
      // Update existing section
      await db
        .update(websiteSettings)
        .set({
          config,
          updatedAt: new Date(),
        })
        .where(eq(websiteSettings.section, section))
    } else {
      // Insert new section
      await db.insert(websiteSettings).values({
        section,
        config,
      })
    }

    return { success: true }
  } catch (error) {
    console.error(`Error updating ${section}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
