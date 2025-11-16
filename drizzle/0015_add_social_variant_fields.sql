-- Create social_platform enum
DO $$ BEGIN
 CREATE TYPE "public"."social_platform" AS ENUM('instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'pinterest', 'tiktok');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Create crop_strategy enum
DO $$ BEGIN
 CREATE TYPE "public"."crop_strategy" AS ENUM('smart_crop', 'center_crop', 'letterbox', 'extend');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Add social variant fields to assets table
ALTER TABLE "assets" ADD COLUMN "source_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "platform" "social_platform";--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "variant" text;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "ratio" text;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "crop_strategy" "crop_strategy";--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "crop_data" jsonb;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "letterbox_data" jsonb;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "validation_score" real;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "validation_warnings" jsonb;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "exported" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "exported_at" timestamp;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "exported_to" text;--> statement-breakpoint
-- Add foreign key constraint for source_asset_id
ALTER TABLE "assets" ADD CONSTRAINT "assets_source_asset_id_assets_id_fk" FOREIGN KEY ("source_asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Create indexes for efficient querying
CREATE INDEX "assets_source_asset_id_idx" ON "assets" USING btree ("source_asset_id");--> statement-breakpoint
CREATE INDEX "assets_platform_idx" ON "assets" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "assets_exported_idx" ON "assets" USING btree ("exported");
