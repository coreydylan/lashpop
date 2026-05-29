/**
 * Hero copy content. Stored in `website_settings` row with
 * `section = 'hero_copy'`. Consumed by `HeroSection`.
 */

export const HERO_COPY_SECTION = 'hero_copy'

export interface HeroCopyContent {
  /** Hero H1 headline, e.g. "lashes + beauty". */
  heading: string
  /** Subheading chip text below the headline, e.g. "for the modern woman". */
  subheading: string
  /** Primary CTA button label (scrolls to services / Book Now). */
  bookNowLabel: string
  /** Secondary CTA button label (launches the lash quiz). */
  quizLabel: string
  /** Tertiary CTA button label (links to /work-with-us). */
  workWithUsLabel: string
  /** Label on the reviews chip, e.g. "Reviews". */
  reviewsChipLabel: string
  updatedAt?: string
}

/**
 * Defaults mirror what `HeroSection.tsx` currently hardcodes (both the
 * mobile and desktop layouts use the identical strings), so deploying the
 * new admin without any DB write keeps the homepage looking identical.
 */
export const DEFAULT_HERO_COPY: HeroCopyContent = {
  heading: 'lashes + beauty',
  subheading: 'for the modern woman',
  bookNowLabel: 'Book Now',
  quizLabel: 'Take Our Lash Quiz',
  workWithUsLabel: 'Work With Us',
  reviewsChipLabel: 'Reviews',
}

export function mergeHeroCopy(
  input: Partial<HeroCopyContent> | null | undefined
): HeroCopyContent {
  const base = DEFAULT_HERO_COPY
  if (!input) return base
  return {
    ...base,
    ...input,
  }
}
