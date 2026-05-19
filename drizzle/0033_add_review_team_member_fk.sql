-- Canonically link a review to a team member when we can resolve one.
-- Vagaro's API returns `serviceProviderName` on every review (100% populated)
-- so the Worker sets this FK on insert. Google/Yelp leave it null unless we
-- later extract a name mention from the review body.
--
-- `reviews.subject` is retained as the raw text fallback so historical data
-- survives staff renames in Vagaro.
--
-- ON DELETE SET NULL: removing a team member just orphans the linkage; the
-- review row stays put.

ALTER TABLE "reviews"
  ADD COLUMN IF NOT EXISTS "team_member_id" uuid
  REFERENCES "team_members"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "reviews_team_member_id_idx"
  ON "reviews"("team_member_id");

COMMENT ON COLUMN "reviews"."team_member_id"
  IS 'FK to team_members. Populated for Vagaro (serviceProviderName match) and any review whose body mentions an active team member. Null is the common case for legacy/anonymous rows.';
