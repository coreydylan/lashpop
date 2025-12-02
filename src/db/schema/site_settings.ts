import { pgTable, text, timestamp, uuid, jsonb, boolean } from "drizzle-orm/pg-core"

/**
 * Site Settings Table
 * Comprehensive configuration for all editable site content
 * Uses a key-value pattern with typed JSON for flexibility
 */
export const siteSettings = pgTable("site_settings", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Setting category for organization (business, content, navigation, branding, seo)
  category: text("category").notNull(),

  // Setting key (e.g., 'contact.phone', 'social.instagram', 'founder.greeting')
  key: text("key").notNull().unique(),

  // The actual value - can be string, number, boolean, or complex object
  value: jsonb("value").$type<unknown>(),

  // Human-readable label for admin UI
  label: text("label"),

  // Description/help text for admin UI
  description: text("description"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

// ============================================
// Type Definitions for Site Settings Values
// ============================================

// Business Information Types
export interface BusinessContactSettings {
  phone: string
  email: string
  phoneDisplay?: string // Formatted display version
}

export interface BusinessLocationSettings {
  streetAddress: string
  city: string
  state: string
  zipCode: string
  fullAddress?: string // Combined address string
  coordinates: {
    lat: number
    lng: number
  }
  googleMapsUrl: string
  mapboxAccessToken?: string
}

export interface BusinessHoursSettings {
  regularHours: string // e.g., "8a-7:30p every day"
  appointmentOnly: boolean
  specialNote?: string // e.g., "by appointment only"
  dayByDay?: {
    monday?: string
    tuesday?: string
    wednesday?: string
    thursday?: string
    friday?: string
    saturday?: string
    sunday?: string
  }
}

export interface SocialMediaSettings {
  instagram?: string
  facebook?: string
  tiktok?: string
  twitter?: string
  youtube?: string
  pinterest?: string
  yelp?: string
  google?: string
}

// Branding Types
export interface BrandingSettings {
  companyName: string
  tagline: string
  logoUrl?: string
  faviconUrl?: string
}

// SEO Types
export interface SEOSettings {
  metaTitle: string
  metaDescription: string
  ogImage?: string
  keywords?: string[]
}

// Founder Letter Types
export interface FounderLetterSettings {
  greeting: string
  paragraphs: string[]
  signOff: string
  signature: string
  founderName: string
  founderTitle: string
  founderPhotoUrl?: string
  enabled: boolean
}

// Navigation Types
export interface NavLinkItem {
  id: string
  label: string
  href: string
  enabled: boolean
  order: number
}

export interface NavigationSettings {
  headerLinks: NavLinkItem[]
  footerServiceLinks: NavLinkItem[]
  ctaButtonText: string
  ctaButtonUrl?: string
}

// Footer Types
export interface FooterSettings {
  showNewsletter: boolean
  newsletterTitle: string
  newsletterDescription: string
  copyrightText: string
  policyLinks: {
    privacyPolicy?: string
    termsOfService?: string
    cancellationPolicy?: string
  }
}

// Section Content Types
export interface SectionContentSettings {
  welcome?: {
    backgroundImage?: string
    enabled: boolean
  }
  team?: {
    heading: string
    description?: string
  }
  services?: {
    heading: string
    description?: string
  }
  reviews?: {
    heading: string
    description?: string
  }
  faq?: {
    heading: string
    description?: string
  }
  instagram?: {
    heading: string
    description?: string
  }
}

// Combined Settings Export (for fetching all at once)
export interface AllSiteSettings {
  business: {
    contact: BusinessContactSettings
    location: BusinessLocationSettings
    hours: BusinessHoursSettings
    social: SocialMediaSettings
  }
  branding: BrandingSettings
  seo: SEOSettings
  founderLetter: FounderLetterSettings
  navigation: NavigationSettings
  footer: FooterSettings
  sectionContent: SectionContentSettings
}

// Default values for initial setup
export const defaultSiteSettings: AllSiteSettings = {
  business: {
    contact: {
      phone: "+17602120448",
      phoneDisplay: "+1 (760) 212-0448",
      email: "hello@lashpopstudios.com"
    },
    location: {
      streetAddress: "429 S Coast Hwy",
      city: "Oceanside",
      state: "CA",
      zipCode: "92054",
      fullAddress: "429 S Coast Hwy, Oceanside, CA 92054",
      coordinates: {
        lat: 33.1959,
        lng: -117.3795
      },
      googleMapsUrl: "https://maps.app.goo.gl/mozm5VjGqw8qCuzL8"
    },
    hours: {
      regularHours: "8a-7:30p every day",
      appointmentOnly: true,
      specialNote: "by appointment only"
    },
    social: {
      instagram: "https://instagram.com/lashpopstudios",
      facebook: "https://facebook.com/lashpopstudios"
    }
  },
  branding: {
    companyName: "LashPop Studios",
    tagline: "Where artistry meets precision in every lash application."
  },
  seo: {
    metaTitle: "LashPop Studios | Premium Lash Extensions in Oceanside, CA",
    metaDescription: "Experience exceptional lash extensions and beauty services at LashPop Studios in Oceanside, CA. Classic, volume, and hybrid lashes by expert artists."
  },
  founderLetter: {
    enabled: true,
    greeting: "Dear Beautiful Soul,",
    paragraphs: [
      "When I started LashPop, I wanted to build something simple: a place where you actually feel taken care of.",
      "We're all united by the same mission—helping you feel effortlessly beautiful and confident, with a few less things to worry about during your busy week. We might be able to give you that \"just woke up from eight blissful hours\" look with little effort (even if your reality looks more like five). We're not here to judge ;)",
      "Thank you for trusting us. We can't wait to see you."
    ],
    signOff: "With love and lashes,",
    signature: "Emily and the LashPop Family",
    founderName: "Emily",
    founderTitle: "Founder, LashPop Studios"
  },
  navigation: {
    headerLinks: [
      { id: "about", label: "About", href: "#about", enabled: true, order: 0 },
      { id: "services", label: "Services", href: "#services", enabled: true, order: 1 },
      { id: "team", label: "Team", href: "#team", enabled: true, order: 2 },
      { id: "contact", label: "Contact", href: "#contact", enabled: true, order: 3 }
    ],
    footerServiceLinks: [
      { id: "classic", label: "Classic Lashes", href: "#services", enabled: true, order: 0 },
      { id: "volume", label: "Volume Lashes", href: "#services", enabled: true, order: 1 },
      { id: "hybrid", label: "Hybrid Lashes", href: "#services", enabled: true, order: 2 },
      { id: "lift", label: "Lash Lift & Tint", href: "#services", enabled: true, order: 3 },
      { id: "brows", label: "Brow Services", href: "#services", enabled: true, order: 4 }
    ],
    ctaButtonText: "Book Now"
  },
  footer: {
    showNewsletter: true,
    newsletterTitle: "Stay Connected",
    newsletterDescription: "Subscribe for exclusive offers and beauty tips",
    copyrightText: "© {year} LashPop Studios. All rights reserved.",
    policyLinks: {
      privacyPolicy: "#",
      termsOfService: "#",
      cancellationPolicy: "#"
    }
  },
  sectionContent: {
    welcome: {
      enabled: true
    },
    team: {
      heading: "Meet Your Artists"
    },
    services: {
      heading: "Our Services"
    },
    reviews: {
      heading: "What Our Clients Say"
    },
    faq: {
      heading: "Frequently Asked Questions"
    },
    instagram: {
      heading: "Follow Our Journey"
    }
  }
}

export type InsertSiteSetting = typeof siteSettings.$inferInsert
export type SelectSiteSetting = typeof siteSettings.$inferSelect
