-- Make show_on_website hidden-by-default and NOT NULL.
--
-- The D1 column was `show_on_website integer DEFAULT true` and nullable, while
-- Drizzle declared it notNull. Any insert that omitted the column published
-- that person on the live site - which is exactly what the legacy Vagaro
-- employee webhook used to do. Every code path now passes the value
-- explicitly; this makes the database itself fail safe.
--
-- SQLite cannot alter a column default, so this is the standard table rebuild:
-- create, copy, DROP TABLE team_members, rename.
--
-- CASCADE HAZARD - read before editing this file.
-- D1 runs with PRAGMA foreign_keys ON. With foreign keys enforced, DROP TABLE
-- performs an implicit DELETE of every row first, and that DELETE fires
-- ON DELETE CASCADE on child tables. Seven tables cascade off team_members
-- (sets, team_member_categories, team_member_highlights, team_member_photos,
-- team_member_services, team_member_services_vagaro, team_quick_facts) and two
-- more (assets, reviews) are ON DELETE SET NULL. PRAGMA defer_foreign_keys
-- defers constraint *violations*; it does not suppress cascade actions.
-- Applying this rebuild without the snapshot/restore below wipes those tables.
-- The bare sqlite3 CLI has foreign_keys OFF by default, so a local rehearsal
-- will not reproduce it - rehearse with PRAGMA foreign_keys = ON.
--
-- So: snapshot the child rows, do the rebuild, put them back, drop the
-- snapshots. The restores are idempotent - if no cascade fired (foreign keys
-- off), they insert nothing.
--
-- Rollback: the same rebuild with `show_on_website integer DEFAULT true`
-- (nullable), or restore from
-- ~/Developer/lashpop-backups/lashpop-production-2026-08-23-pre-0010.sql.
CREATE TABLE `__cascade_backup_sets` AS SELECT * FROM `sets`;--> statement-breakpoint
CREATE TABLE `__cascade_backup_team_member_categories` AS SELECT * FROM `team_member_categories`;--> statement-breakpoint
CREATE TABLE `__cascade_backup_team_member_highlights` AS SELECT * FROM `team_member_highlights`;--> statement-breakpoint
CREATE TABLE `__cascade_backup_team_member_photos` AS SELECT * FROM `team_member_photos`;--> statement-breakpoint
CREATE TABLE `__cascade_backup_team_member_services` AS SELECT * FROM `team_member_services`;--> statement-breakpoint
CREATE TABLE `__cascade_backup_team_member_services_vagaro` AS SELECT * FROM `team_member_services_vagaro`;--> statement-breakpoint
CREATE TABLE `__cascade_backup_team_quick_facts` AS SELECT * FROM `team_quick_facts`;--> statement-breakpoint
CREATE TABLE `__fk_backup_assets` AS SELECT `id`, `team_member_id` FROM `assets`;--> statement-breakpoint
CREATE TABLE `__fk_backup_reviews` AS SELECT `id`, `team_member_id` FROM `reviews`;--> statement-breakpoint
PRAGMA defer_foreign_keys = true;--> statement-breakpoint
CREATE TABLE `__new_team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`vagaro_employee_id` text,
	`vagaro_data` text,
	`vagaro_public_provider_id` integer,
	`vagaro_photo_url` text,
	`vagaro_bio` text,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`role` text NOT NULL,
	`type` text NOT NULL,
	`business_name` text,
	`bio` text,
	`quote` text,
	`instagram` text,
	`instagram_url` text,
	`booking_url` text NOT NULL,
	`uses_lashpop_booking` integer DEFAULT true NOT NULL,
	`image_url` text NOT NULL,
	`favorite_services` text,
	`external_service_categories` text,
	`fun_fact` text,
	`availability` text,
	`display_order` text DEFAULT '0',
	`is_active` integer DEFAULT true NOT NULL,
	`show_on_website` integer DEFAULT false NOT NULL,
	`credentials` text DEFAULT '[]',
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`last_synced_at` integer
, `bio_override` integer DEFAULT false NOT NULL, `image_override` integer DEFAULT false NOT NULL, `is_off_vagaro` integer DEFAULT false NOT NULL, `show_on_website_reason` text, `show_on_website_actor` text, `show_on_website_changed_at` integer);--> statement-breakpoint
INSERT INTO `__new_team_members` (`id`, `vagaro_employee_id`, `vagaro_data`, `vagaro_public_provider_id`, `vagaro_photo_url`, `vagaro_bio`, `name`, `phone`, `email`, `role`, `type`, `business_name`, `bio`, `quote`, `instagram`, `instagram_url`, `booking_url`, `uses_lashpop_booking`, `image_url`, `favorite_services`, `external_service_categories`, `fun_fact`, `availability`, `display_order`, `is_active`, `show_on_website`, `credentials`, `created_at`, `updated_at`, `last_synced_at`, `bio_override`, `image_override`, `is_off_vagaro`, `show_on_website_reason`, `show_on_website_actor`, `show_on_website_changed_at`) SELECT `id`, `vagaro_employee_id`, `vagaro_data`, `vagaro_public_provider_id`, `vagaro_photo_url`, `vagaro_bio`, `name`, `phone`, `email`, `role`, `type`, `business_name`, `bio`, `quote`, `instagram`, `instagram_url`, `booking_url`, `uses_lashpop_booking`, `image_url`, `favorite_services`, `external_service_categories`, `fun_fact`, `availability`, `display_order`, `is_active`, `show_on_website`, `credentials`, `created_at`, `updated_at`, `last_synced_at`, `bio_override`, `image_override`, `is_off_vagaro`, `show_on_website_reason`, `show_on_website_actor`, `show_on_website_changed_at` FROM `team_members`;--> statement-breakpoint
DROP TABLE `team_members`;--> statement-breakpoint
ALTER TABLE `__new_team_members` RENAME TO `team_members`;--> statement-breakpoint
CREATE UNIQUE INDEX `team_members_vagaro_employee_id_unique` ON `team_members` (`vagaro_employee_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_members_vagaro_public_provider_id_unique` ON `team_members` (`vagaro_public_provider_id`);--> statement-breakpoint
INSERT INTO `sets` SELECT * FROM `__cascade_backup_sets` b WHERE b.`id` NOT IN (SELECT `id` FROM `sets`);--> statement-breakpoint
INSERT INTO `team_member_categories` SELECT * FROM `__cascade_backup_team_member_categories` b WHERE NOT EXISTS (SELECT 1 FROM `team_member_categories` c WHERE c.`team_member_id` = b.`team_member_id` AND c.`category_id` = b.`category_id`);--> statement-breakpoint
INSERT INTO `team_member_highlights` SELECT * FROM `__cascade_backup_team_member_highlights` b WHERE b.`id` NOT IN (SELECT `id` FROM `team_member_highlights`);--> statement-breakpoint
INSERT INTO `team_member_photos` SELECT * FROM `__cascade_backup_team_member_photos` b WHERE b.`id` NOT IN (SELECT `id` FROM `team_member_photos`);--> statement-breakpoint
INSERT INTO `team_member_services` SELECT * FROM `__cascade_backup_team_member_services` b WHERE b.`id` NOT IN (SELECT `id` FROM `team_member_services`);--> statement-breakpoint
INSERT INTO `team_member_services_vagaro` SELECT * FROM `__cascade_backup_team_member_services_vagaro` b WHERE b.`id` NOT IN (SELECT `id` FROM `team_member_services_vagaro`);--> statement-breakpoint
INSERT INTO `team_quick_facts` SELECT * FROM `__cascade_backup_team_quick_facts` b WHERE b.`id` NOT IN (SELECT `id` FROM `team_quick_facts`);--> statement-breakpoint
UPDATE `assets` SET `team_member_id` = (SELECT b.`team_member_id` FROM `__fk_backup_assets` b WHERE b.`id` = `assets`.`id`) WHERE `team_member_id` IS NULL AND (SELECT b.`team_member_id` FROM `__fk_backup_assets` b WHERE b.`id` = `assets`.`id`) IS NOT NULL;--> statement-breakpoint
UPDATE `reviews` SET `team_member_id` = (SELECT b.`team_member_id` FROM `__fk_backup_reviews` b WHERE b.`id` = `reviews`.`id`) WHERE `team_member_id` IS NULL AND (SELECT b.`team_member_id` FROM `__fk_backup_reviews` b WHERE b.`id` = `reviews`.`id`) IS NOT NULL;--> statement-breakpoint
DROP TABLE `__cascade_backup_sets`;--> statement-breakpoint
DROP TABLE `__cascade_backup_team_member_categories`;--> statement-breakpoint
DROP TABLE `__cascade_backup_team_member_highlights`;--> statement-breakpoint
DROP TABLE `__cascade_backup_team_member_photos`;--> statement-breakpoint
DROP TABLE `__cascade_backup_team_member_services`;--> statement-breakpoint
DROP TABLE `__cascade_backup_team_member_services_vagaro`;--> statement-breakpoint
DROP TABLE `__cascade_backup_team_quick_facts`;--> statement-breakpoint
DROP TABLE `__fk_backup_assets`;--> statement-breakpoint
DROP TABLE `__fk_backup_reviews`;
