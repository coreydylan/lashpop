ALTER TABLE "user" ADD COLUMN "dam_access" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "knowledge_data" json;