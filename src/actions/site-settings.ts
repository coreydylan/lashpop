'use server'

import { db } from '@/db'
import { siteSettings } from '@/db/schema/site_settings'
import { eq } from 'drizzle-orm'
import {
  AllSiteSettings,
  defaultSiteSettings,
  BusinessContactSettings,
  BusinessLocationSettings,
  BusinessHoursSettings,
  SocialMediaSettings,
  BrandingSettings,
  SEOSettings,
  FounderLetterSettings,
  NavigationSettings,
  FooterSettings,
  SectionContentSettings
} from '@/db/schema/site_settings'

// ============================================
// Type-safe setting keys
// ============================================
type SettingCategory = 'business' | 'branding' | 'seo' | 'content' | 'navigation' | 'footer'

const SETTING_KEYS = {
  // Business
  'business.contact': 'business.contact',
  'business.location': 'business.location',
  'business.hours': 'business.hours',
  'business.social': 'business.social',
  // Branding
  'branding': 'branding',
  // SEO
  'seo': 'seo',
  // Content
  'founderLetter': 'founderLetter',
  'sectionContent': 'sectionContent',
  // Navigation
  'navigation': 'navigation',
  // Footer
  'footer': 'footer',
} as const

type SettingKey = keyof typeof SETTING_KEYS

// ============================================
// Core CRUD Operations
// ============================================

/**
 * Get a single setting by key
 */
export async function getSetting<T>(key: SettingKey): Promise<T | null> {
  try {
    const result = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1)

    if (result.length > 0 && result[0].value !== null) {
      return result[0].value as T
    }
    return null
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error)
    return null
  }
}

/**
 * Set a single setting by key
 */
export async function setSetting<T>(
  key: SettingKey,
  value: T,
  category: SettingCategory,
  label?: string,
  description?: string
): Promise<boolean> {
  try {
    // Upsert the setting
    const existing = await db
      .select({ id: siteSettings.id })
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(siteSettings)
        .set({
          value: value as unknown as Record<string, unknown>,
          category,
          label,
          description,
          updatedAt: new Date()
        })
        .where(eq(siteSettings.key, key))
    } else {
      await db.insert(siteSettings).values({
        key,
        value: value as unknown as Record<string, unknown>,
        category,
        label,
        description
      })
    }
    return true
  } catch (error) {
    console.error(`Error setting ${key}:`, error)
    return false
  }
}

/**
 * Get all settings, merging with defaults
 */
export async function getAllSiteSettings(): Promise<AllSiteSettings> {
  try {
    const results = await db.select().from(siteSettings)

    // Start with defaults
    const settings: AllSiteSettings = JSON.parse(JSON.stringify(defaultSiteSettings))

    // Override with database values
    for (const row of results) {
      if (row.value !== null) {
        switch (row.key) {
          case 'business.contact':
            settings.business.contact = row.value as BusinessContactSettings
            break
          case 'business.location':
            settings.business.location = row.value as BusinessLocationSettings
            break
          case 'business.hours':
            settings.business.hours = row.value as BusinessHoursSettings
            break
          case 'business.social':
            settings.business.social = row.value as SocialMediaSettings
            break
          case 'branding':
            settings.branding = row.value as BrandingSettings
            break
          case 'seo':
            settings.seo = row.value as SEOSettings
            break
          case 'founderLetter':
            settings.founderLetter = row.value as FounderLetterSettings
            break
          case 'navigation':
            settings.navigation = row.value as NavigationSettings
            break
          case 'footer':
            settings.footer = row.value as FooterSettings
            break
          case 'sectionContent':
            settings.sectionContent = row.value as SectionContentSettings
            break
        }
      }
    }

    return settings
  } catch (error) {
    console.error('Error fetching all site settings:', error)
    return defaultSiteSettings
  }
}

// ============================================
// Specialized Getters (for frontend components)
// ============================================

/**
 * Get business contact information
 */
export async function getBusinessContact(): Promise<BusinessContactSettings> {
  const result = await getSetting<BusinessContactSettings>('business.contact')
  return result || defaultSiteSettings.business.contact
}

/**
 * Get business location information
 */
export async function getBusinessLocation(): Promise<BusinessLocationSettings> {
  const result = await getSetting<BusinessLocationSettings>('business.location')
  return result || defaultSiteSettings.business.location
}

/**
 * Get business hours
 */
export async function getBusinessHours(): Promise<BusinessHoursSettings> {
  const result = await getSetting<BusinessHoursSettings>('business.hours')
  return result || defaultSiteSettings.business.hours
}

/**
 * Get social media links
 */
export async function getSocialMedia(): Promise<SocialMediaSettings> {
  const result = await getSetting<SocialMediaSettings>('business.social')
  return result || defaultSiteSettings.business.social
}

/**
 * Get branding settings
 */
export async function getBranding(): Promise<BrandingSettings> {
  const result = await getSetting<BrandingSettings>('branding')
  return result || defaultSiteSettings.branding
}

/**
 * Get SEO settings
 */
export async function getSEO(): Promise<SEOSettings> {
  const result = await getSetting<SEOSettings>('seo')
  return result || defaultSiteSettings.seo
}

/**
 * Get founder letter content
 */
export async function getFounderLetter(): Promise<FounderLetterSettings> {
  const result = await getSetting<FounderLetterSettings>('founderLetter')
  return result || defaultSiteSettings.founderLetter
}

/**
 * Get navigation settings
 */
export async function getNavigation(): Promise<NavigationSettings> {
  const result = await getSetting<NavigationSettings>('navigation')
  return result || defaultSiteSettings.navigation
}

/**
 * Get footer settings
 */
export async function getFooter(): Promise<FooterSettings> {
  const result = await getSetting<FooterSettings>('footer')
  return result || defaultSiteSettings.footer
}

/**
 * Get section content settings
 */
export async function getSectionContent(): Promise<SectionContentSettings> {
  const result = await getSetting<SectionContentSettings>('sectionContent')
  return result || defaultSiteSettings.sectionContent
}

// ============================================
// Specialized Setters (for admin panel)
// ============================================

/**
 * Update business contact information
 */
export async function updateBusinessContact(data: BusinessContactSettings): Promise<boolean> {
  return setSetting('business.contact', data, 'business', 'Contact Information', 'Phone and email')
}

/**
 * Update business location
 */
export async function updateBusinessLocation(data: BusinessLocationSettings): Promise<boolean> {
  return setSetting('business.location', data, 'business', 'Location', 'Address and map coordinates')
}

/**
 * Update business hours
 */
export async function updateBusinessHours(data: BusinessHoursSettings): Promise<boolean> {
  return setSetting('business.hours', data, 'business', 'Hours of Operation', 'Business hours and availability')
}

/**
 * Update social media links
 */
export async function updateSocialMedia(data: SocialMediaSettings): Promise<boolean> {
  return setSetting('business.social', data, 'business', 'Social Media', 'Social media profile links')
}

/**
 * Update branding settings
 */
export async function updateBranding(data: BrandingSettings): Promise<boolean> {
  return setSetting('branding', data, 'branding', 'Branding', 'Company name and tagline')
}

/**
 * Update SEO settings
 */
export async function updateSEO(data: SEOSettings): Promise<boolean> {
  return setSetting('seo', data, 'seo', 'SEO', 'Meta tags and search optimization')
}

/**
 * Update founder letter content
 */
export async function updateFounderLetter(data: FounderLetterSettings): Promise<boolean> {
  return setSetting('founderLetter', data, 'content', 'Founder Letter', "Emily's welcome message")
}

/**
 * Update navigation settings
 */
export async function updateNavigation(data: NavigationSettings): Promise<boolean> {
  return setSetting('navigation', data, 'navigation', 'Navigation', 'Header and footer links')
}

/**
 * Update footer settings
 */
export async function updateFooter(data: FooterSettings): Promise<boolean> {
  return setSetting('footer', data, 'footer', 'Footer', 'Footer content and newsletter settings')
}

/**
 * Update section content settings
 */
export async function updateSectionContent(data: SectionContentSettings): Promise<boolean> {
  return setSetting('sectionContent', data, 'content', 'Section Content', 'Section headings and descriptions')
}

// ============================================
// Bulk Operations
// ============================================

/**
 * Initialize all settings with defaults (useful for first-time setup)
 */
export async function initializeDefaultSettings(): Promise<boolean> {
  try {
    await updateBusinessContact(defaultSiteSettings.business.contact)
    await updateBusinessLocation(defaultSiteSettings.business.location)
    await updateBusinessHours(defaultSiteSettings.business.hours)
    await updateSocialMedia(defaultSiteSettings.business.social)
    await updateBranding(defaultSiteSettings.branding)
    await updateSEO(defaultSiteSettings.seo)
    await updateFounderLetter(defaultSiteSettings.founderLetter)
    await updateNavigation(defaultSiteSettings.navigation)
    await updateFooter(defaultSiteSettings.footer)
    await updateSectionContent(defaultSiteSettings.sectionContent)
    return true
  } catch (error) {
    console.error('Error initializing default settings:', error)
    return false
  }
}

/**
 * Get combined settings for frontend components (optimized single query)
 * This is what most frontend components will use
 */
export async function getFrontendSettings(): Promise<{
  business: {
    contact: BusinessContactSettings
    location: BusinessLocationSettings
    hours: BusinessHoursSettings
    social: SocialMediaSettings
  }
  branding: BrandingSettings
  founderLetter: FounderLetterSettings
  navigation: NavigationSettings
  footer: FooterSettings
}> {
  const all = await getAllSiteSettings()
  return {
    business: all.business,
    branding: all.branding,
    founderLetter: all.founderLetter,
    navigation: all.navigation,
    footer: all.footer
  }
}
