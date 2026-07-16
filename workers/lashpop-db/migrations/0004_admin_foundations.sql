CREATE TABLE `website_setting_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`setting_id` text NOT NULL,
	`section` text NOT NULL,
	`config` text,
	`source_owner` text NOT NULL,
	`version` integer NOT NULL,
	`updated_by_user_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `website_setting_versions_section_idx` ON `website_setting_versions` (`section`,`created_at`);--> statement-breakpoint
ALTER TABLE `user` ADD `admin_role` text;--> statement-breakpoint
ALTER TABLE `website_settings` ADD `source_owner` text DEFAULT 'lashpop' NOT NULL;--> statement-breakpoint
ALTER TABLE `website_settings` ADD `version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `website_settings` ADD `updated_by_user_id` text;
--> statement-breakpoint
UPDATE `user`
SET `admin_role` = 'owner'
WHERE `dam_access` = 1 AND `admin_role` IS NULL;
--> statement-breakpoint
UPDATE `website_settings`
SET `source_owner` = 'legacy-inline'
WHERE `section` IN ('hero_copy', 'site_sections');
--> statement-breakpoint
INSERT INTO `website_setting_versions`
  (`id`, `setting_id`, `section`, `config`, `source_owner`, `version`, `updated_by_user_id`, `created_at`)
SELECT
  lower(hex(randomblob(16))), `id`, `section`, `config`, `source_owner`, `version`, `updated_by_user_id`,
  CAST(strftime('%s','now') AS INTEGER) * 1000
FROM `website_settings`;
--> statement-breakpoint
CREATE TRIGGER `website_settings_capture_update`
AFTER UPDATE OF `config` ON `website_settings`
WHEN OLD.`config` IS NOT NEW.`config`
BEGIN
  INSERT INTO `website_setting_versions`
    (`id`, `setting_id`, `section`, `config`, `source_owner`, `version`, `updated_by_user_id`, `created_at`)
  VALUES
    (lower(hex(randomblob(16))), OLD.`id`, OLD.`section`, OLD.`config`, OLD.`source_owner`, OLD.`version`, OLD.`updated_by_user_id`, CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
