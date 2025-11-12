ALTER TABLE "tag_categories" ADD COLUMN "is_collection" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tag_categories" ADD COLUMN "permissions" jsonb;--> statement-breakpoint
ALTER TABLE "tag_categories" ADD COLUMN "default_view_config" jsonb;