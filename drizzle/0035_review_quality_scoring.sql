-- Review quality scoring + per-stylist highlight reels.
--
-- Drives the weekly editor pass in the ReviewEditor Durable Object:
--   1. Score new reviews via mesh-claude (1-10 quality for homepage carousel).
--   2. Cross-check ex-staff mentions semantically (regex misses paraphrasing).
--   3. Refresh per-stylist highlight reels — top 3 reviews per active team_member.
--
-- The carousel picker (post-sync.autoPromoteToHomepage) reads
-- quality_score DESC NULLS LAST, review_date DESC — so unscored reviews still
-- sort by recency until the editor catches up. No backfill required.

ALTER TABLE "reviews"
  ADD COLUMN IF NOT EXISTS "quality_score" smallint;

ALTER TABLE "reviews"
  ADD COLUMN IF NOT EXISTS "quality_scored_at" timestamptz;

ALTER TABLE "reviews"
  ADD COLUMN IF NOT EXISTS "editor_notes" text;

COMMENT ON COLUMN "reviews"."quality_score"
  IS 'Editor-assigned homepage-carousel suitability, 1=skip, 10=showcase. Null = unscored.';
COMMENT ON COLUMN "reviews"."quality_scored_at"
  IS 'Timestamp the editor last produced a score. Re-runs may overwrite.';
COMMENT ON COLUMN "reviews"."editor_notes"
  IS 'Short LLM justification for the score; useful for admin UI tooltip.';

CREATE INDEX IF NOT EXISTS "reviews_quality_score_idx"
  ON "reviews" ("quality_score" DESC NULLS LAST, "review_date" DESC);

-- Per-stylist highlight reels. Each active team_member gets up to N (3 by
-- default) reviews ranked by the editor. Rebuilt weekly. Used by the team
-- profile pages and AI-search (`itemReviewed` already points at the team
-- member; highlights are a curated featured subset).
CREATE TABLE IF NOT EXISTS "team_member_highlights" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "team_member_id" uuid NOT NULL REFERENCES "team_members"("id") ON DELETE CASCADE,
  "review_id" uuid NOT NULL REFERENCES "reviews"("id") ON DELETE CASCADE,
  "rank" smallint NOT NULL,
  "editor_notes" text,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE ("team_member_id", "review_id"),
  UNIQUE ("team_member_id", "rank")
);

CREATE INDEX IF NOT EXISTS "team_member_highlights_member_idx"
  ON "team_member_highlights" ("team_member_id", "rank");

COMMENT ON TABLE "team_member_highlights"
  IS 'Curated featured reviews per active stylist. Rebuilt by the weekly editor pass.';
