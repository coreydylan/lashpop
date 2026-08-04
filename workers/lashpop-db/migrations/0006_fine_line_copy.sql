-- Client-approved Fine Line Tattoos copy. Keep this as a local presentation
-- override: Vagaro remains the operational service source, while the website
-- is allowed to use friendlier marketing copy.
UPDATE `services`
SET
  `description` = 'Thoughtfully designed fine-line tattoos featuring clean, delicate details. Choose from curated flash designs or create a small custom piece that’s uniquely yours',
  `updated_at` = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
WHERE `vagaro_service_id` = '35729654';
--> statement-breakpoint
UPDATE `service_categories`
SET
  `description` = 'Thoughtfully designed fine-line tattoos featuring clean, delicate details. Choose from curated flash designs or create a small custom piece that’s uniquely yours',
  `updated_at` = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
WHERE `slug` = 'fine-line-tattoos';
