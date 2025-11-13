/**
 * Category Brand Colors
 *
 * Each service category has a designated brand color for consistency
 * across chips, badges, cards, and sections throughout the site.
 *
 * Icons are referenced by name - use getCategoryIcon() from @/components/icons/CategoryIcons
 * to get the actual SVG component.
 */

export const CATEGORY_COLORS = {
  lashes: {
    primary: 'rgb(205, 168, 158)',
    light: 'rgba(205, 168, 158, 0.15)',
    medium: 'rgba(205, 168, 158, 0.3)',
    ring: 'rgba(205, 168, 158, 0.3)',
    tailwind: 'category-lashes',
    iconName: 'lashes',
    name: 'Lashes',
  },
  brows: {
    primary: 'rgb(212, 175, 117)',
    light: 'rgba(212, 175, 117, 0.15)',
    medium: 'rgba(212, 175, 117, 0.3)',
    ring: 'rgba(212, 175, 117, 0.3)',
    tailwind: 'category-brows',
    iconName: 'brows',
    name: 'Brows',
  },
  'permanent-makeup': {
    primary: 'rgb(189, 136, 120)',
    light: 'rgba(189, 136, 120, 0.15)',
    medium: 'rgba(189, 136, 120, 0.3)',
    ring: 'rgba(189, 136, 120, 0.3)',
    tailwind: 'category-permanent-makeup',
    iconName: 'permanent-makeup',
    name: 'Permanent Makeup',
  },
  facials: {
    primary: 'rgb(188, 201, 194)',
    light: 'rgba(188, 201, 194, 0.15)',
    medium: 'rgba(188, 201, 194, 0.3)',
    ring: 'rgba(188, 201, 194, 0.3)',
    tailwind: 'category-facials',
    iconName: 'facials',
    name: 'Facials',
  },
  waxing: {
    primary: 'rgb(161, 151, 129)',
    light: 'rgba(161, 151, 129, 0.15)',
    medium: 'rgba(161, 151, 129, 0.3)',
    ring: 'rgba(161, 151, 129, 0.3)',
    tailwind: 'category-waxing',
    iconName: 'waxing',
    name: 'Waxing',
  },
  specialty: {
    primary: 'rgb(212, 175, 117)',
    light: 'rgba(212, 175, 117, 0.15)',
    medium: 'rgba(212, 175, 117, 0.3)',
    ring: 'rgba(212, 175, 117, 0.3)',
    tailwind: 'category-specialty',
    iconName: 'specialty',
    name: 'Specialty',
  },
  bundles: {
    primary: 'rgb(205, 168, 158)',
    light: 'rgba(205, 168, 158, 0.15)',
    medium: 'rgba(205, 168, 158, 0.3)',
    ring: 'rgba(205, 168, 158, 0.3)',
    tailwind: 'category-bundles',
    iconName: 'bundles',
    name: 'Bundles',
  },
} as const;

export type CategorySlug = keyof typeof CATEGORY_COLORS;

/**
 * Get category colors by slug
 */
export function getCategoryColors(slug: string) {
  const normalized = slug.toLowerCase() as CategorySlug;
  return CATEGORY_COLORS[normalized] || CATEGORY_COLORS.lashes; // Fallback to lashes
}

/**
 * Get all category slugs
 */
export function getAllCategorySlugs(): CategorySlug[] {
  return Object.keys(CATEGORY_COLORS) as CategorySlug[];
}
