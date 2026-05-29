/**
 * Footer content. Stored in `website_settings` row with
 * `section = 'footer_content'`. Consumed by `FooterV2`.
 */

export const FOOTER_CONTENT_SECTION = 'footer_content'

/**
 * A footer service link — either an internal service-browser deeplink
 * (slug + optional subcategorySlug) or an external URL. Mirrors the
 * `FooterService` union currently hardcoded in FooterV2.tsx.
 */
export type FooterServiceItem =
  | { label: string; slug: string; subcategorySlug?: string; externalUrl?: undefined }
  | { label: string; externalUrl: string; slug?: undefined; subcategorySlug?: undefined }

/** A policy link in the footer bottom bar (Privacy / Terms / Cancellation). */
export interface FooterPolicyLink {
  label: string
  href: string
}

export interface FooterContent {
  /** Column heading above the services list, e.g. "Services". */
  servicesHeading: string
  /** Column heading above the contact/visit block, e.g. "Visit Us". */
  visitHeading: string
  /** Column heading above the newsletter form, e.g. "Stay Connected". */
  newsletterHeading: string
  /** Newsletter blurb under the heading. */
  newsletterDescription: string
  /** Default label on the newsletter submit button (idle state). */
  newsletterButtonLabel: string
  /**
   * Copyright template string for the bottom bar. `{year}` and `{name}`
   * tokens are interpolated at render time with the current year and the
   * studio name.
   */
  copyrightTemplate: string
  /** Service links (label + deeplink or external URL). */
  services: FooterServiceItem[]
  /** Bottom-bar policy links. */
  policyLinks: FooterPolicyLink[]
  updatedAt?: string
}

/**
 * Defaults mirror what `FooterV2.tsx` currently hardcodes, so deploying
 * the new admin without any DB write keeps the footer looking identical.
 */
export const DEFAULT_FOOTER_CONTENT: FooterContent = {
  servicesHeading: 'Services',
  visitHeading: 'Visit Us',
  newsletterHeading: 'Stay Connected',
  newsletterDescription: 'Subscribe for exclusive offers and beauty tips',
  newsletterButtonLabel: 'Subscribe',
  copyrightTemplate: '© {year} {name}. All rights reserved.',
  services: [
    { label: 'Lash Extensions', slug: 'lashes' },
    { label: 'Lash Lifts', slug: 'lashes', subcategorySlug: 'lash-lifts-tints' },
    { label: 'Brows', slug: 'brows' },
    { label: 'Skincare', slug: 'facials' },
    { label: 'Waxing', slug: 'waxing' },
    { label: 'Permanent Makeup', slug: 'permanent-makeup' },
    { label: 'Permanent Jewelry', slug: 'specialty' },
    { label: 'Botox', externalUrl: 'https://www.naturtox.com/' },
  ],
  policyLinks: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cancellation Policy', href: '/?openFaq=cancellation-policy#faq' },
  ],
}

export function mergeFooterContent(
  input: Partial<FooterContent> | null | undefined
): FooterContent {
  const base = DEFAULT_FOOTER_CONTENT
  if (!input) return base
  return {
    ...base,
    ...input,
    services:
      Array.isArray(input.services) && input.services.length > 0
        ? input.services
        : base.services,
    policyLinks:
      Array.isArray(input.policyLinks) && input.policyLinks.length > 0
        ? input.policyLinks
        : base.policyLinks,
  }
}
