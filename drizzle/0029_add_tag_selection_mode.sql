-- Add selection mode and limit fields to tag_categories
-- selection_mode: 'single' (one tag per asset), 'multi' (unlimited), 'limited' (up to N tags)
-- selection_limit: maximum number of tags when selection_mode is 'limited'

ALTER TABLE "tag_categories" ADD COLUMN "selection_mode" text NOT NULL DEFAULT 'multi';
ALTER TABLE "tag_categories" ADD COLUMN "selection_limit" integer;

-- Migrate existing isRating categories to use selectionMode: 'single'
UPDATE "tag_categories" SET "selection_mode" = 'single' WHERE "is_rating" = true;
