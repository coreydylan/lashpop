-- Add vagaro_service_code column to services table
-- This stores the 5-character service-specific code from Vagaro widget URLs
-- Example: "6XoR0" from https://www.vagaro.com//resources/WidgetEmbeddedLoader/[business_prefix]6XoR0

ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "vagaro_service_code" text;

-- Add comment for documentation
COMMENT ON COLUMN "services"."vagaro_service_code" IS '5-character code from Vagaro widget URL that identifies this specific service';
