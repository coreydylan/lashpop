-- Website Settings Table
-- Stores configuration for various sections of the landing page
CREATE TABLE IF NOT EXISTS "website_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "section" text NOT NULL UNIQUE,
  "config" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Homepage Reviews Selection Table
-- Stores which reviews are selected for the homepage and their display order
CREATE TABLE IF NOT EXISTS "homepage_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "review_id" uuid NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

