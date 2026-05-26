/**
 * Founder letter content. Stored in `website_settings` row with
 * `section = 'founder_letter'`. Consumed by `FounderLetterSection`.
 */

export const FOUNDER_LETTER_SECTION = 'founder_letter'

export interface FounderLetterContent {
  /** Section H2, e.g. "Welcome to LashPop Studios". */
  heading: string
  /** Opening line, italic, above the paragraphs. */
  greeting: string
  /** Body paragraphs (rendered as <p> elements in order). */
  paragraphs: string[]
  /** Sign-off, e.g. "Xo,". */
  signOff: string
  /** Name printed below the sign-off. */
  signature: string
  updatedAt?: string
}

/**
 * Defaults mirror what `FounderLetterSection.tsx` currently hardcodes,
 * so deploying the new admin without any DB write keeps the homepage
 * looking identical.
 */
export const DEFAULT_FOUNDER_LETTER: FounderLetterContent = {
  heading: 'Welcome to LashPop Studios',
  greeting: "I'm so glad you're here.",
  paragraphs: [
    'When I launched LashPop back in 2016, I wanted something simple: a place where women could feel genuinely cared for and walk out looking refreshed without the long routine. That idea grew into the beauty collective we have today: artists who specialize in lashes, brows, skincare, injectables, waxing, permanent jewelry, and more, all with one goal in mind.',
    "We're united by the same mission: helping you feel effortlessly beautiful and confident, with a few less things to stress about during your busy week. If we can give you that \"just woke up from eight blissful hours\" look with almost no effort (even if you're running on five), we'll call that a win.",
    "We can't wait to see you soon!",
  ],
  signOff: 'Xo,',
  signature: 'Emily',
}

export function mergeFounderLetter(
  input: Partial<FounderLetterContent> | null | undefined
): FounderLetterContent {
  const base = DEFAULT_FOUNDER_LETTER
  if (!input) return base
  return {
    ...base,
    ...input,
    paragraphs: Array.isArray(input.paragraphs) && input.paragraphs.length > 0
      ? input.paragraphs
      : base.paragraphs,
  }
}
