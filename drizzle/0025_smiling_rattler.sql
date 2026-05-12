ALTER TABLE "team_members" ADD COLUMN "vagaro_public_provider_id" integer;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "vagaro_photo_url" text;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "vagaro_bio" text;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_vagaro_public_provider_id_unique" UNIQUE("vagaro_public_provider_id");