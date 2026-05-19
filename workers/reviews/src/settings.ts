/**
 * Runtime settings for the review pipeline, read from
 * website_settings.config WHERE section='review_pipeline'.
 *
 * Admin tunes these via /admin/website/review-settings — no Worker redeploy
 * needed. Defaults below mirror migration 0036 in case the row is somehow
 * missing.
 */
import type { Sql } from './db'

export interface ReviewPipelineSettings {
  homepage_capacity: number
  editor_pass_interval_days: number
  auto_promote_min_quality_score: number
  auto_promote_min_text_length: number
  auto_promote_recency_months: number
  diversity_cap_per_source: number
  diversity_cap_per_stylist: number
  highlights_per_stylist: number
  editor_pass_enabled: boolean
}

export const DEFAULT_SETTINGS: ReviewPipelineSettings = {
  homepage_capacity: 9,
  editor_pass_interval_days: 7,
  auto_promote_min_quality_score: 5,
  auto_promote_min_text_length: 80,
  auto_promote_recency_months: 18,
  diversity_cap_per_source: 3,
  diversity_cap_per_stylist: 2,
  highlights_per_stylist: 3,
  editor_pass_enabled: true,
}

export async function loadReviewSettings(sql: Sql): Promise<ReviewPipelineSettings> {
  const rows = await sql<Array<{ config: Partial<ReviewPipelineSettings> }>>`
    SELECT config FROM website_settings WHERE section = 'review_pipeline' LIMIT 1
  `
  const raw = rows[0]?.config ?? {}
  // Merge defaults so any missing key is filled in. Type coercion stays
  // permissive — admin UI saves numbers as numbers but jsonb tolerates strings.
  return {
    homepage_capacity: Number(raw.homepage_capacity ?? DEFAULT_SETTINGS.homepage_capacity),
    editor_pass_interval_days: Number(raw.editor_pass_interval_days ?? DEFAULT_SETTINGS.editor_pass_interval_days),
    auto_promote_min_quality_score: Number(raw.auto_promote_min_quality_score ?? DEFAULT_SETTINGS.auto_promote_min_quality_score),
    auto_promote_min_text_length: Number(raw.auto_promote_min_text_length ?? DEFAULT_SETTINGS.auto_promote_min_text_length),
    auto_promote_recency_months: Number(raw.auto_promote_recency_months ?? DEFAULT_SETTINGS.auto_promote_recency_months),
    diversity_cap_per_source: Number(raw.diversity_cap_per_source ?? DEFAULT_SETTINGS.diversity_cap_per_source),
    diversity_cap_per_stylist: Number(raw.diversity_cap_per_stylist ?? DEFAULT_SETTINGS.diversity_cap_per_stylist),
    highlights_per_stylist: Number(raw.highlights_per_stylist ?? DEFAULT_SETTINGS.highlights_per_stylist),
    editor_pass_enabled: raw.editor_pass_enabled !== false,
  }
}
