-- Add parent_tag_id for nested tag hierarchy (e.g., Brows > Brow Lamination)
ALTER TABLE "tags" ADD COLUMN "parent_tag_id" uuid REFERENCES "tags"("id") ON DELETE SET NULL;

-- Add service_id to link tags directly to individual services
ALTER TABLE "tags" ADD COLUMN "service_id" uuid REFERENCES "services"("id") ON DELETE SET NULL;

-- Create index for efficient parent-child queries
CREATE INDEX "tags_parent_tag_id_idx" ON "tags"("parent_tag_id");

-- Create index for service lookups
CREATE INDEX "tags_service_id_idx" ON "tags"("service_id");
