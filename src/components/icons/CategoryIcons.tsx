/**
 * Category Icons
 *
 * SVG icons for each service category, designed to match the Desert Ocean aesthetic.
 * All icons use currentColor for easy colorization with category brand colors.
 */

import { SVGProps } from 'react'

interface IconProps extends SVGProps<SVGSVGElement> {
  className?: string
}

// Lashes - Eye with lashes radiating outward
export const LashesIcon = ({ className = "w-6 h-6", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <ellipse cx="12" cy="12" rx="7" ry="4" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <path d="M5 9C5 9 6 7 7.5 7M19 9C19 9 18 7 16.5 7M5 15C5 15 6 17 7.5 17M19 15C19 15 18 17 16.5 17" strokeLinecap="round" />
  </svg>
)

// Brows - Eyebrow arch shape
export const BrowsIcon = ({ className = "w-6 h-6", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M4 12C4 12 7 8 12 8C17 8 20 12 20 12" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 10.5L9 10M15 10L17 10.5" strokeLinecap="round" />
  </svg>
)

// Permanent Makeup - Makeup brush/applicator
export const PermanentMakeupIcon = ({ className = "w-6 h-6", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M3 21L10 14" strokeLinecap="round" />
    <path d="M10 14L14 10L21 3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="17.5" cy="6.5" r="2.5" fill="currentColor" opacity="0.3" />
    <path d="M9 15L7 17C7 17 5 19 3 21" strokeLinecap="round" />
  </svg>
)

// Facials - Flower/lotus blossom
export const FacialsIcon = ({ className = "w-6 h-6", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <path d="M12 6C10.5 6 9 7 9 9C9 10 10 11 12 11C14 11 15 10 15 9C15 7 13.5 6 12 6Z" />
    <path d="M12 18C10.5 18 9 17 9 15C9 14 10 13 12 13C14 13 15 14 15 15C15 17 13.5 18 12 18Z" />
    <path d="M6 12C6 10.5 7 9 9 9C10 9 11 10 11 12C11 14 10 15 9 15C7 15 6 13.5 6 12Z" />
    <path d="M18 12C18 10.5 17 9 15 9C14 9 13 10 13 12C13 14 14 15 15 15C17 15 18 13.5 18 12Z" />
  </svg>
)

// Waxing - Smooth wave/leaf shape
export const WaxingIcon = ({ className = "w-6 h-6", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M12 3C8 3 5 8 5 12C5 16 8 21 12 21" strokeLinecap="round" />
    <path d="M12 3C16 3 19 8 19 12C19 16 16 21 12 21" strokeLinecap="round" />
    <path d="M12 3V21" strokeLinecap="round" />
  </svg>
)

// Specialty - Diamond/gem shape
export const SpecialtyIcon = ({ className = "w-6 h-6", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M6 9L12 3L18 9" strokeLinejoin="round" />
    <path d="M6 9L12 21L18 9" strokeLinejoin="round" />
    <path d="M6 9H18" />
    <path d="M12 3V9" opacity="0.5" />
  </svg>
)

// Bundles - Stacked layers/gift
export const BundlesIcon = ({ className = "w-6 h-6", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <rect x="4" y="9" width="16" height="11" rx="1" />
    <path d="M12 9V20" />
    <path d="M4 13H20" />
    <path d="M12 4V9" strokeLinecap="round" />
    <path d="M9 6L12 4L15 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Export all icons as a map for easy access
export const CATEGORY_ICONS = {
  lashes: LashesIcon,
  brows: BrowsIcon,
  'permanent-makeup': PermanentMakeupIcon,
  facials: FacialsIcon,
  waxing: WaxingIcon,
  specialty: SpecialtyIcon,
  bundles: BundlesIcon,
} as const

export type CategoryIconType = keyof typeof CATEGORY_ICONS

/**
 * Get icon component by category slug
 */
export function getCategoryIcon(slug: string): React.ComponentType<IconProps> {
  const normalized = slug.toLowerCase() as CategoryIconType
  return CATEGORY_ICONS[normalized] || SpecialtyIcon
}
