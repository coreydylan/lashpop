-- Make show_on_website hidden-by-default and NOT NULL.
--
-- The D1 column was `show_on_website integer DEFAULT true` and nullable, while
-- Drizzle declared it notNull. Any insert that omitted the column published
-- that person on the live site - which is exactly what the legacy Vagaro
-- employee webhook used to do. Every code path now passes the value
-- explicitly; this makes the database itself fail safe.
--
-- SQLite cannot alter a column default, so this is the standard table rebuild.
-- team_members has no outgoing foreign keys; the eleven tables that reference
-- it point at the name, which survives the rename.
--
-- Rollback: the same rebuild with `show_on_website integer DEFAULT true`
-- (nullable), or restore from
-- ~/Developer/lashpop-backups/lashpop-production-2026-08-23-pre-0008.sql.
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
CREATE UNIQUE INDEX `team_members_vagaro_public_provider_id_unique` ON `team_members` (`vagaro_public_provider_id`);
