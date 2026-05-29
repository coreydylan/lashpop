/**
 * Team-intro content (the "Find Your Stylist" section header + CTA on the
 * homepage team grid). Stored in a `website_settings` row with
 * `section = 'team_intro'`. Consumed by `EnhancedTeamSectionClient`.
 */

export const TEAM_INTRO_SECTION = 'team_intro'

export interface TeamIntroContent {
  /** Section H2, e.g. "Find Your Stylist". */
  heading: string
  /**
   * Lead paragraph below the heading. Rendered as the first <p>. May contain
   * non-breaking spaces ( ) to preserve the historical layout.
   */
  description: string
  /**
   * Bold/emphasized prefix of the second (uppercase) line. Historically the
   * `<span className="font-semibold">` reading "Click the profiles".
   */
  descriptionEmphasis: string
  /**
   * Remainder of the second line, following the emphasized prefix. Historically
   * " below to find a stylist that fits your vibe." (note the leading space).
   */
  descriptionRest: string
  /** Label for the bottom CTA linking to /work-with-us, e.g. "Join The Team". */
  ctaLabel: string
  updatedAt?: string
}

/**
 * Defaults mirror what `EnhancedTeamSectionClient.tsx` currently hardcodes,
 * so deploying the new admin without any DB write keeps the homepage team
 * section looking identical. The   chars are the `&nbsp;` entities used
 * in the original JSX ("schedules, and policies" kept on one line).
 */
export const DEFAULT_TEAM_INTRO: TeamIntroContent = {
  heading: 'Find Your Stylist',
  description:
    'LashPop Studios is home to a collective of independent beauty businesses, each offering their own services, pricing, schedules, and policies.',
  descriptionEmphasis: 'Click the profiles',
  descriptionRest: ' below to find a stylist that fits your vibe.',
  ctaLabel: 'Join The Team',
}

export function mergeTeamIntro(
  input: Partial<TeamIntroContent> | null | undefined
): TeamIntroContent {
  const base = DEFAULT_TEAM_INTRO
  if (!input) return base
  return {
    ...base,
    ...input,
  }
}
