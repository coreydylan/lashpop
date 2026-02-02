-- Add tagline field to service_categories for the short taglines displayed on the landing page
-- e.g., "Wake up ready." for LASHES

ALTER TABLE "service_categories" ADD COLUMN IF NOT EXISTS "tagline" text;

-- Comment for documentation
COMMENT ON COLUMN "service_categories"."tagline" IS 'Short tagline displayed on landing page service cards (e.g., "Wake up ready.")';
