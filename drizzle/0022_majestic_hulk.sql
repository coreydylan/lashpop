CREATE TABLE "quiz_result_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lash_style" "quiz_lash_style" NOT NULL,
	"result_image_asset_id" uuid,
	"result_image_crop_data" jsonb,
	"result_image_crop_url" text,
	"display_name" text NOT NULL,
	"description" text NOT NULL,
	"best_for" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommended_service" text NOT NULL,
	"booking_label" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_result_settings_lash_style_unique" UNIQUE("lash_style")
);
--> statement-breakpoint
ALTER TABLE "quiz_result_settings" ADD CONSTRAINT "quiz_result_settings_result_image_asset_id_assets_id_fk" FOREIGN KEY ("result_image_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;