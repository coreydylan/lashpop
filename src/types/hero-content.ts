export const HERO_CONTENT_SECTION = 'hero_content' as const

export interface HeroContent {
  heading: string
  subheading: string
  primaryCta: string
  quizCta: string
  careersCta: string
  reviewsLabel: string
}

export const DEFAULT_HERO_CONTENT: HeroContent = {
  heading: 'lashes + beauty',
  subheading: 'for the modern woman',
  primaryCta: 'Book Now',
  quizCta: 'Take Our Lash Quiz',
  careersCta: 'Work With Us',
  reviewsLabel: 'Reviews',
}

export function mergeHeroContent(input: Partial<HeroContent> | null | undefined): HeroContent {
  return {
    heading: input?.heading?.trim() || DEFAULT_HERO_CONTENT.heading,
    subheading: input?.subheading?.trim() || DEFAULT_HERO_CONTENT.subheading,
    primaryCta: input?.primaryCta?.trim() || DEFAULT_HERO_CONTENT.primaryCta,
    quizCta: input?.quizCta?.trim() || DEFAULT_HERO_CONTENT.quizCta,
    careersCta: input?.careersCta?.trim() || DEFAULT_HERO_CONTENT.careersCta,
    reviewsLabel: input?.reviewsLabel?.trim() || DEFAULT_HERO_CONTENT.reviewsLabel,
  }
}
