CREATE TABLE "service_subcategories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_subcategories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "subcategory_id" uuid;--> statement-breakpoint
ALTER TABLE "tag_categories" ADD COLUMN "is_rating" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "service_subcategories" ADD CONSTRAINT "service_subcategories_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_subcategory_id_service_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."service_subcategories"("id") ON DELETE set null ON UPDATE no action;