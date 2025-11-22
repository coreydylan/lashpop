ALTER TABLE "instagram_posts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "instagram_posts" CASCADE;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "source_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_external_id_unique" UNIQUE("external_id");