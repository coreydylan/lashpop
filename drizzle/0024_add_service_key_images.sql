-- Add key image and demo mode support to services
-- This enables hierarchical key image selection: service > subcategory > category

-- Add key_image_asset_id to service_categories
ALTER TABLE "service_categories" ADD COLUMN "key_image_asset_id" uuid;

-- Add key_image_asset_id to service_subcategories with foreign key
ALTER TABLE "service_subcategories" ADD COLUMN "key_image_asset_id" uuid;
ALTER TABLE "service_subcategories" ADD CONSTRAINT "service_subcategories_key_image_asset_id_assets_id_fk"
  FOREIGN KEY ("key_image_asset_id") REFERENCES "public"."assets"("id") ON DELETE SET NULL;

-- Add key_image_asset_id and use_demo_photos to services
ALTER TABLE "services" ADD COLUMN "key_image_asset_id" uuid;
ALTER TABLE "services" ADD COLUMN "use_demo_photos" boolean DEFAULT false NOT NULL;
ALTER TABLE "services" ADD CONSTRAINT "services_key_image_asset_id_assets_id_fk"
  FOREIGN KEY ("key_image_asset_id") REFERENCES "public"."assets"("id") ON DELETE SET NULL;
