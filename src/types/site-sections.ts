/**
 * Canonical homepage section model. Stored in `website_settings` row with
 * `section = 'site_sections'`. This is the single source of truth for each
 * homepage section's menu name + anchor + order + visibility — the nav bar
 * DERIVES its links from it, so a nav label and its section can never drift.
 *
 * Editing a nav label edits the canonical SiteSection.navLabel (stored in ONE
 * place); the nav re-renders from here.
 */

export const SITE_SECTIONS_SECTION = 'site_sections'

/** One canonical homepage section. */
export interface SiteSection {
  /** Stable id, equal to the anchor without its leading '#', e.g. "services". */
  id: string
  /** Short canonical menu name, e.g. "Services". This is what the nav renders. */
  navLabel: string
  /** In-page anchor the nav links to, e.g. "#services". */
  anchor: string
  /** Sort order in the nav (ascending). */
  order: number
  /** Whether the section appears in the nav. */
  visible: boolean
}

export interface SiteSectionsContent {
  /** Ordered list of canonical sections. */
  sections: SiteSection[]
  updatedAt?: string
}

/**
 * Defaults seeded EXACTLY from the current nav so deploying without any DB
 * write keeps the navigation byte-identical. `id` is the anchor without '#'.
 * The `#find-us` anchor is verified against the real Map section id
 * (`<section id="find-us">` in landing-v2/sections/MapSection.tsx).
 */
export const DEFAULT_SITE_SECTIONS: SiteSectionsContent = {
  sections: [
    { id: 'services', navLabel: 'Services', anchor: '#services', order: 0, visible: true },
    { id: 'team', navLabel: 'Team', anchor: '#team', order: 1, visible: true },
    { id: 'reviews', navLabel: 'Reviews', anchor: '#reviews', order: 2, visible: true },
    { id: 'gallery', navLabel: 'Gallery', anchor: '#gallery', order: 3, visible: true },
    { id: 'faq', navLabel: 'FAQ', anchor: '#faq', order: 4, visible: true },
    { id: 'find-us', navLabel: 'Find Us', anchor: '#find-us', order: 5, visible: true },
  ],
}

export function mergeSiteSections(
  input: Partial<SiteSectionsContent> | null | undefined
): SiteSectionsContent {
  const base = DEFAULT_SITE_SECTIONS
  if (!input) return base
  return {
    ...base,
    ...input,
    sections:
      Array.isArray(input.sections) && input.sections.length > 0
        ? input.sections
        : base.sections,
  }
}
