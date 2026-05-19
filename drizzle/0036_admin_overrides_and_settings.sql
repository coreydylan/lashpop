-- Admin override mechanism + configurable settings for the review pipeline.
--
-- 1. reviews.admin_locked_fields — jsonb array of column names the AI editor
--    must NOT overwrite. Push e.g. "quality_score" when an admin edits that
--    column manually; the editor's UPDATE statements exclude rows where the
--    target column is in this array.
--
-- 2. website_settings 'review_pipeline' row — singleton config blob the
--    Worker reads at the start of each cycle. Replaces hardcoded constants
--    so admins can tune capacity, recency window, diversity caps, etc. via
--    /admin/website/review-settings without redeploying the Worker.

ALTER TABLE "reviews"
  ADD COLUMN IF NOT EXISTS "admin_locked_fields" jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN "reviews"."admin_locked_fields"
  IS 'Array of column names locked from AI editor overwrite. Push e.g. "quality_score" when an admin manually edits that column.';

-- Seed the review_pipeline settings singleton. If a row already exists at this
-- section (idempotent re-run) we keep its config.
INSERT INTO "website_settings" ("section", "config")
VALUES (
  'review_pipeline',
  '{
    "homepage_capacity": 9,
    "editor_pass_interval_days": 7,
    "auto_promote_min_quality_score": 5,
    "auto_promote_min_text_length": 80,
    "auto_promote_recency_months": 18,
    "diversity_cap_per_source": 3,
    "diversity_cap_per_stylist": 2,
    "highlights_per_stylist": 3,
    "editor_pass_enabled": true
  }'::jsonb
)
ON CONFLICT ("section") DO NOTHING;
