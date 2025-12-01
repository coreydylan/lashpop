-- Add service_category_id to tags table to link DAM tags to backend service categories
ALTER TABLE "tags" ADD COLUMN "service_category_id" uuid REFERENCES "service_categories"("id") ON DELETE SET NULL;
