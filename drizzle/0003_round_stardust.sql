ALTER TABLE "services" DROP CONSTRAINT "services_category_id_service_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "category_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "vagaro_service_id" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "vagaro_parent_service_id" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "vagaro_data" jsonb;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "last_synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "vagaro_employee_id" text;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "vagaro_data" jsonb;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "last_synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_vagaro_service_id_unique" UNIQUE("vagaro_service_id");--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_vagaro_employee_id_unique" UNIQUE("vagaro_employee_id");