-- Auto-promote bookkeeping for reviews
-- homepage_dismissed: set true when admin manually unselects a review from the homepage,
--   so the auto-promoter (cron) doesn't re-add it on the next run.
-- hidden_reason: when show_on_website is flipped to false automatically (e.g. review mentions
--   a team member no longer listed on the staff page), this records why so the filter can
--   restore the review later if the team member returns. NULL means the visibility was set
--   manually by an admin and should not be auto-overridden.

ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "homepage_dismissed" boolean DEFAULT false NOT NULL;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "hidden_reason" text;

COMMENT ON COLUMN "reviews"."homepage_dismissed" IS 'Admin removed this from the homepage selection — auto-promote should skip it.';
COMMENT ON COLUMN "reviews"."hidden_reason" IS 'When set (e.g. "stale_team_member"), show_on_website was flipped automatically and can be auto-restored.';
