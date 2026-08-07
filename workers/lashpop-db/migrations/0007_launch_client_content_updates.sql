-- Client-approved launch content updates (August 2026).
-- These are presentation/publication changes only; preserve the Vagaro source
-- records and all historical staff/service data.
UPDATE `services`
SET
  `subtitle` = NULL,
  `updated_at` = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
WHERE `slug` IN ('classic', 'angel', 'hybrid', 'volume');
--> statement-breakpoint
UPDATE `team_members`
SET
  `show_on_website` = 0,
  `updated_at` = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
WHERE lower(`name`) = 'ava zeutenhorst';
