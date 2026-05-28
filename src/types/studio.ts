/**
 * Studio identity — single source of truth for the studio's name, contact
 * info, hours, social URLs, and map coordinates.
 *
 * Stored as a `website_settings` row with `section = 'studio'`.
 * Consumed by FooterV2, MapSection, ReviewsSection, InstagramCarousel,
 * FAQSection, ServiceDetailClient, BookingModal/BookingView,
 * LocalBusinessSchema, llms.txt, privacy/terms pages.
 */

export const STUDIO_SETTINGS_SECTION = 'studio'

export interface StudioAddress {
  street: string
  city: string
  state: string
  zip: string
}

export interface StudioCoordinates {
  lat: number
  lng: number
}

export interface StudioSocial {
  instagram?: string
  facebook?: string
  tiktok?: string
  yelp?: string
  google?: string
  vagaro?: string
  pinterest?: string
  twitter?: string
}

export interface StudioSettings {
  name: string
  tagline: string
  address: StudioAddress
  coordinates: StudioCoordinates
  phone: string
  /** Pre-formatted for `tel:` links, e.g. `+17602120448`. */
  phoneE164: string
  email: string
  hoursShort: string
  vagaroBookingUrl: string
  social: StudioSocial
  /** Where newsletter signups + work-with-us applications get emailed. */
  inboundEmail: string
  updatedAt?: string
}

/**
 * Defaults reflect the *current* hardcoded values across the codebase
 * (per `tmp/admin-audit.md` Part 2 Section A). Treat as the seed for
 * first deploy — admin can override anything in /admin/content/studio-info.
 */
export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  name: 'LashPop Studios',
  tagline: 'Effortless beauty for the modern woman.',
  address: {
    street: '429 S Coast Hwy',
    city: 'Oceanside',
    state: 'CA',
    zip: '92054',
  },
  coordinates: { lat: 33.1959, lng: -117.3795 },
  phone: '(760) 212-0448',
  phoneE164: '+17602120448',
  email: 'lashpopstudios@gmail.com',
  // Footer renders this with `whitespace-pre-line`, so `\n` becomes a line
  // break. Format matches MapSection's hours card: "8:00 AM – 7:30 PM" with
  // an en-dash, then "By Appointment Only" on the next line.
  hoursShort: '8:00 AM – 7:30 PM every day\nBy Appointment Only',
  vagaroBookingUrl: 'https://www.vagaro.com/lashpop32',
  social: {
    instagram: 'https://instagram.com/lashpopstudios',
    facebook: 'https://www.facebook.com/lashpopCA',
    tiktok: 'https://tiktok.com/@lashpopstudios_',
    yelp: 'https://www.yelp.com/biz/lashpop-studios-oceanside',
    google: 'https://maps.app.goo.gl/mozm5VjGqw8qCuzL8',
    vagaro: 'https://www.vagaro.com/lashpop32',
  },
  inboundEmail: 'lashpopstudios@gmail.com',
}

/**
 * Merge user-provided partials over defaults. Used both at read time
 * (so missing fields stay sane) and write time.
 */
export function mergeStudioSettings(input: Partial<StudioSettings> | null | undefined): StudioSettings {
  const base = DEFAULT_STUDIO_SETTINGS
  if (!input) return base
  return {
    ...base,
    ...input,
    address: { ...base.address, ...(input.address ?? {}) },
    coordinates: { ...base.coordinates, ...(input.coordinates ?? {}) },
    social: { ...base.social, ...(input.social ?? {}) },
  }
}
