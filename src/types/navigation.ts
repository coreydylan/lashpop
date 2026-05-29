/**
 * Navigation bar content. Stored in `website_settings` row with
 * `section = 'navigation'`. Consumed by the `Navigation` component
 * (and the mobile menu it renders).
 */

export const NAVIGATION_SECTION = 'navigation'

/** A single nav link: visible label + its target href. */
export interface NavItem {
  /** Visible link text, e.g. "Services". */
  label: string
  /** Target href. In-page anchors start with '#', e.g. "#services". */
  href: string
}

export interface NavigationContent {
  /** Ordered list of primary nav links. */
  navItems: NavItem[]
  /** Alt text for the logo image. */
  logoAlt: string
  /** Label for the outline "Work With Us" CTA. */
  workWithUsLabel: string
  /** Target route for the "Work With Us" CTA. */
  workWithUsHref: string
  /** Label for the filled "Book Now" CTA. */
  bookNowLabel: string
  /** In-page anchor the "Book Now" CTA scrolls to. */
  bookNowTarget: string
  updatedAt?: string
}

/**
 * Defaults mirror what `Navigation.tsx` currently hardcodes, so deploying
 * the new admin without any DB write keeps the navigation looking identical.
 */
export const DEFAULT_NAVIGATION: NavigationContent = {
  navItems: [
    { label: 'Services', href: '#services' },
    { label: 'Team', href: '#team' },
    { label: 'Reviews', href: '#reviews' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Find Us', href: '#find-us' },
  ],
  logoAlt: 'LashPop Studios',
  workWithUsLabel: 'Work With Us',
  workWithUsHref: '/work-with-us',
  bookNowLabel: 'Book Now',
  bookNowTarget: '#services',
}

export function mergeNavigation(
  input: Partial<NavigationContent> | null | undefined
): NavigationContent {
  const base = DEFAULT_NAVIGATION
  if (!input) return base
  return {
    ...base,
    ...input,
    navItems:
      Array.isArray(input.navItems) && input.navItems.length > 0
        ? input.navItems
        : base.navItems,
  }
}
