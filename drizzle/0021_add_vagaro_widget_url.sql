-- Add vagaro_widget_url column to services table
-- This stores the direct booking widget URL from Vagaro's "Share Link" feature
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "vagaro_widget_url" text;

-- Add comment for documentation
COMMENT ON COLUMN "services"."vagaro_widget_url" IS 'Direct booking widget URL from Vagaro Share Link feature';
