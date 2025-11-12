ALTER TABLE "tag_categories" ADD COLUMN IF NOT EXISTS "permissions" jsonb;--> statement-breakpoint
ALTER TABLE "tag_categories" ADD COLUMN IF NOT EXISTS "default_view_config" jsonb;
