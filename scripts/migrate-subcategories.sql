-- Create service_subcategories table
CREATE TABLE IF NOT EXISTS "service_subcategories" (
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

-- Add subcategory_id to services table
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "subcategory_id" uuid;

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_subcategories_category_id_service_categories_id_fk'
  ) THEN
    ALTER TABLE "service_subcategories"
    ADD CONSTRAINT "service_subcategories_category_id_service_categories_id_fk"
    FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_subcategory_id_service_subcategories_id_fk'
  ) THEN
    ALTER TABLE "services"
    ADD CONSTRAINT "services_subcategory_id_service_subcategories_id_fk"
    FOREIGN KEY ("subcategory_id") REFERENCES "public"."service_subcategories"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END
$$;
