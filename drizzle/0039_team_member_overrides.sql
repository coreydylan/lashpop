-- Inline admin mode: explicit precedence flags so local edits to bio/photo
-- survive the Vagaro sync (which keeps writing vagaro_bio / vagaro_photo_url).
-- When *_override = true, the frontend prefers the local column over the Vagaro one.
-- is_off_vagaro marks hand-created stylists the Vagaro sync must NOT deactivate.
ALTER TABLE "team_members"
  ADD COLUMN IF NOT EXISTS "bio_override"   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "image_override" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_off_vagaro"  boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "team_members"."bio_override"   IS 'When true, frontend prefers local bio over vagaro_bio (set by inline admin edit).';
COMMENT ON COLUMN "team_members"."image_override" IS 'When true, frontend prefers local image_url over vagaro_photo_url (set by inline admin edit).';
COMMENT ON COLUMN "team_members"."is_off_vagaro"  IS 'Hand-created stylist not present in Vagaro; sync deactivation loop must skip these.';
