-- Add is_rating field to tag_categories table
ALTER TABLE "tag_categories" ADD COLUMN IF NOT EXISTS "is_rating" boolean DEFAULT false NOT NULL;
