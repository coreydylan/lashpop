CREATE TYPE "public"."quiz_lash_style" AS ENUM('classic', 'hybrid', 'wetAngel', 'volume');--> statement-breakpoint
CREATE TABLE "quiz_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"lash_style" "quiz_lash_style" NOT NULL,
	"crop_data" jsonb,
	"crop_url" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quiz_photos" ADD CONSTRAINT "quiz_photos_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;