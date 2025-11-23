-- Landing Page CMS Tables Migration

-- Landing Page Sections (general section configuration)
CREATE TABLE IF NOT EXISTS "landing_page_sections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "section_key" text UNIQUE NOT NULL,
  "section_name" text NOT NULL,
  "is_visible" boolean DEFAULT true NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "settings" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Landing Page Hero Configuration
CREATE TABLE IF NOT EXISTS "landing_page_hero" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "arch_asset_id" uuid,
  "arch_image_url" text,
  "image_position" jsonb,
  "heading" text,
  "tagline" text,
  "description" text,
  "location" text,
  "trust_indicators" jsonb,
  "primary_cta" jsonb,
  "secondary_cta" jsonb,
  "background_settings" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Landing Page Content (for text sections like founder letter)
CREATE TABLE IF NOT EXISTS "landing_page_content" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "section_key" text UNIQUE NOT NULL,
  "heading" text,
  "subheading" text,
  "html_content" text,
  "text_content" text,
  "image_url" text,
  "image_asset_id" uuid,
  "svg_path" text,
  "alt_text" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Landing Page Review Display (which reviews to show)
CREATE TABLE IF NOT EXISTS "landing_page_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "review_id" uuid NOT NULL REFERENCES "reviews"("id") ON DELETE CASCADE,
  "display_order" integer DEFAULT 0 NOT NULL,
  "is_visible" boolean DEFAULT true NOT NULL,
  "is_featured" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Landing Page Instagram Carousel Configuration
CREATE TABLE IF NOT EXISTS "landing_page_instagram" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "max_images" integer DEFAULT 10 NOT NULL,
  "auto_scroll_speed" integer DEFAULT 3000,
  "dam_tag_filter" text DEFAULT 'ig_carousel',
  "settings" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Landing Page Grid Scroller Configuration
CREATE TABLE IF NOT EXISTS "landing_page_grid_scroller" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "dam_tag_filter" text DEFAULT 'website/grid-scroller',
  "max_images" integer DEFAULT 20 NOT NULL,
  "target_row_height" integer DEFAULT 300,
  "row_padding" integer DEFAULT 8,
  "settings" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Landing Page FAQs
CREATE TABLE IF NOT EXISTS "landing_page_faqs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "is_visible" boolean DEFAULT true NOT NULL,
  "category" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_landing_sections_key" ON "landing_page_sections"("section_key");
CREATE INDEX IF NOT EXISTS "idx_landing_sections_order" ON "landing_page_sections"("display_order");
CREATE INDEX IF NOT EXISTS "idx_landing_content_key" ON "landing_page_content"("section_key");
CREATE INDEX IF NOT EXISTS "idx_landing_reviews_order" ON "landing_page_reviews"("display_order");
CREATE INDEX IF NOT EXISTS "idx_landing_reviews_review_id" ON "landing_page_reviews"("review_id");
CREATE INDEX IF NOT EXISTS "idx_landing_faqs_order" ON "landing_page_faqs"("display_order");
CREATE INDEX IF NOT EXISTS "idx_landing_faqs_visible" ON "landing_page_faqs"("is_visible");
