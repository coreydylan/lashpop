/**
 * SEO Settings Type Definitions
 *
 * Defines the configuration schema for site-wide and page-level SEO settings,
 * including meta tags, OpenGraph, Twitter cards, and structured data.
 */

// ============================================
// Image Configuration (matches DAM pattern)
// ============================================

export interface SEOImage {
  id: string
  assetId: string
  url: string
  fileName: string
  alt?: string
  // Position for cropping (0-100%)
  position: { x: number; y: number }
}

// ============================================
// Page-Level SEO Configuration
// ============================================

export interface PageSEO {
  // Basic Meta
  title?: string
  metaDescription?: string
  keywords?: string[]
  canonicalUrl?: string

  // OpenGraph
  ogTitle?: string
  ogDescription?: string
  ogImage?: SEOImage | null
  ogType?: 'website' | 'article' | 'profile'

  // Twitter Card
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: SEOImage | null
  twitterCard?: 'summary' | 'summary_large_image'

  // Additional
  noIndex?: boolean
  noFollow?: boolean
}

// ============================================
// Credentials for Structured Data (E-E-A-T)
// ============================================

/**
 * Business-level credential for Schema.org structured data
 * These appear in JSON-LD for search engines to demonstrate expertise
 */
export interface BusinessCredential {
  type: 'certification' | 'license' | 'accreditation' | 'award' | 'membership'
  name: string                    // e.g., "Licensed Cosmetology Establishment"
  issuer?: string                 // e.g., "California Board of Barbering and Cosmetology"
  dateIssued?: string            // ISO date string
  expirationDate?: string        // ISO date string
  licenseNumber?: string         // For verifiable licenses
  url?: string                   // Link to verification
}

// Re-export TeamMemberCredential from schema for consistency
export type { TeamMemberCredential } from '@/db/schema/team_members'

// ============================================
// Site-Wide SEO Configuration
// ============================================

export interface SiteSEO {
  // Business Info (for Schema)
  businessName: string
  businessDescription: string
  businessType: string // Schema.org type: BeautySalon, HealthAndBeautyBusiness, etc.

  // Contact
  phone?: string
  email?: string

  // Social Profiles
  socialProfiles: {
    instagram?: string
    facebook?: string
    tiktok?: string
    twitter?: string
    yelp?: string
    pinterest?: string
  }

  // Default Images
  defaultOgImage?: SEOImage | null
  defaultTwitterImage?: SEOImage | null
  logo?: SEOImage | null

  // Site Info
  siteUrl: string
  siteName: string

  // llms.txt content (manually editable for custom intro)
  llmsTxtIntro?: string

  // Business credentials for structured data (E-E-A-T)
  // These appear in JSON-LD for search engines but not necessarily on the public website
  credentials?: BusinessCredential[]
}

// ============================================
// Complete SEO Settings
// ============================================

export interface SEOSettings {
  site: SiteSEO
  pages: {
    homepage: PageSEO
    services: PageSEO
    workWithUs: PageSEO
    [key: string]: PageSEO // Allow custom pages
  }
  updatedAt: string
}

// ============================================
// API Response Types
// ============================================

export interface SEOSettingsResponse {
  settings: SEOSettings
}

// ============================================
// Default Values
// ============================================

export const DEFAULT_PAGE_SEO: PageSEO = {
  ogType: 'website',
  twitterCard: 'summary_large_image',
  noIndex: false,
  noFollow: false
}

export const DEFAULT_SITE_SEO: SiteSEO = {
  businessName: 'LashPop Studios',
  businessDescription: 'Experience luxury lash services in Oceanside, CA. From classic to mega volume, discover your perfect lash look with our expert artists.',
  businessType: 'BeautySalon',
  socialProfiles: {},
  siteUrl: 'https://lashpopstudios.com',
  siteName: 'LashPop Studios',
  credentials: []
}

export const DEFAULT_SEO_SETTINGS: SEOSettings = {
  site: DEFAULT_SITE_SEO,
  pages: {
    homepage: {
      title: 'LashPop Studios - Effortless Beauty for the Modern Woman',
      metaDescription: 'Experience luxury lash services in Oceanside, CA. From classic to mega volume, discover your perfect lash look with our expert artists.',
      ogTitle: 'LashPop Studios - Effortless Beauty for the Modern Woman',
      ogDescription: 'Experience luxury lash services in Oceanside, CA. Book your appointment today.',
      ...DEFAULT_PAGE_SEO
    },
    services: {
      title: 'Our Services | LashPop Studios',
      metaDescription: 'Explore our full range of lash services including classic, hybrid, volume, and mega volume extensions, plus lash lifts, brow services, and more.',
      ...DEFAULT_PAGE_SEO
    },
    workWithUs: {
      title: 'Careers at LashPop Studios | Join Our Team',
      metaDescription: 'Join the LashPop Studios team. Opportunities for employees, booth rental, and training programs. Build your career in the beauty industry.',
      ...DEFAULT_PAGE_SEO
    }
  },
  updatedAt: new Date().toISOString()
}

// ============================================
// Schema.org Types for LocalBusiness
// ============================================

export const BUSINESS_TYPES = [
  { value: 'BeautySalon', label: 'Beauty Salon' },
  { value: 'HealthAndBeautyBusiness', label: 'Health & Beauty Business' },
  { value: 'HairSalon', label: 'Hair Salon' },
  { value: 'DaySpa', label: 'Day Spa' },
  { value: 'NailSalon', label: 'Nail Salon' },
  { value: 'TattooParlor', label: 'Tattoo Parlor' }
] as const

// ============================================
// Helper Functions
// ============================================

export function createDefaultPageSEO(title: string, description: string): PageSEO {
  return {
    title,
    metaDescription: description,
    ogTitle: title,
    ogDescription: description,
    ...DEFAULT_PAGE_SEO
  }
}

export function mergeWithDefaults(partial: Partial<SEOSettings>): SEOSettings {
  return {
    site: { ...DEFAULT_SITE_SEO, ...partial.site },
    pages: {
      homepage: { ...DEFAULT_SEO_SETTINGS.pages.homepage, ...partial.pages?.homepage },
      services: { ...DEFAULT_SEO_SETTINGS.pages.services, ...partial.pages?.services },
      workWithUs: { ...DEFAULT_SEO_SETTINGS.pages.workWithUs, ...partial.pages?.workWithUs },
      ...partial.pages
    },
    updatedAt: partial.updatedAt || new Date().toISOString()
  }
}
