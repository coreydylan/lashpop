-- Add is_pinned to homepage_reviews so admin-curated picks survive
-- the auto-rotation pass that the cron now runs.
--
-- Auto-promote behavior changes from "append-only fill" to "rebuild non-pinned
-- rows from scratch every cron tick" so fresh reviews actually rotate in.
--
-- Existing 13 rows are migrated as pinned=true so we don't lose the current
-- admin curation on day one. Admin can toggle them later.

ALTER TABLE "homepage_reviews"
  ADD COLUMN IF NOT EXISTS "is_pinned" boolean NOT NULL DEFAULT false;

-- One-time migration: treat existing rows as pinned to preserve current state.
UPDATE "homepage_reviews" SET "is_pinned" = true WHERE "is_pinned" = false;

COMMENT ON COLUMN "homepage_reviews"."is_pinned"
  IS 'true = admin-curated, survives auto-rotation. false = auto-promoted, deleted and re-inserted every cron.';
