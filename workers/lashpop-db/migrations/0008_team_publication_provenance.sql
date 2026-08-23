-- Publication provenance for team_members.
--
-- show_on_website had no reason, actor, or timestamp of its own, so when two
-- published artists turned up hidden there was no way to say who hid them or
-- why. These columns record that alongside the flag. They are nullable: rows
-- whose publication state predates this migration keep a NULL reason, and the
-- post-sync reconciliation report treats "active but hidden with no reason" as
-- the condition worth alerting on.
ALTER TABLE `team_members` ADD `show_on_website_reason` text;--> statement-breakpoint
ALTER TABLE `team_members` ADD `show_on_website_actor` text;--> statement-breakpoint
ALTER TABLE `team_members` ADD `show_on_website_changed_at` integer;
--> statement-breakpoint
-- Ava's hidden state is client-approved and documented in migration 0007.
-- Backfill it so reconciliation reports it as an acknowledged exception
-- instead of an unexplained hidden active provider.
UPDATE `team_members`
SET
  `show_on_website_reason` = 'Client-approved departure; kept active in Vagaro but unpublished (migration 0007, August 2026)',
  `show_on_website_actor` = 'system:migration-0008',
  `show_on_website_changed_at` = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
WHERE lower(`name`) = 'ava zeutenhorst';
