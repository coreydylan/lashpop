-- Add credentials field to team_members for structured data (certifications, licenses, qualifications)
-- This data appears in JSON-LD structured data for search engines but not necessarily on the public website
ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "credentials" jsonb DEFAULT '[]'::jsonb;

-- Add include_in_schema flag to reviews
-- When true, the review will be included in structured data (JSON-LD) for search engines
-- even if not displayed on the public website
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "include_in_schema" boolean DEFAULT true;

-- Add show_on_website flag to reviews for controlling public display
-- Separate from include_in_schema to allow hidden reviews to still be crawlable
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "show_on_website" boolean DEFAULT true;

-- Comment for documentation
COMMENT ON COLUMN "team_members"."credentials" IS 'JSONB array of credentials/certifications for Schema.org structured data. Format: [{type, name, issuer?, dateIssued?, licenseNumber?}]';
COMMENT ON COLUMN "reviews"."include_in_schema" IS 'Include this review in JSON-LD structured data for search engines';
COMMENT ON COLUMN "reviews"."show_on_website" IS 'Display this review publicly on the website';
