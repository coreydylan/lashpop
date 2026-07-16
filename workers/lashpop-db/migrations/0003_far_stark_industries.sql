CREATE TABLE `vagaro_category_mappings` (
	`id` text PRIMARY KEY NOT NULL,
	`vagaro_category_id` text NOT NULL,
	`service_category_id` text NOT NULL,
	`mapping_type` text DEFAULT 'automatic' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`vagaro_category_id`) REFERENCES `vagaro_service_categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`service_category_id`) REFERENCES `service_categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vagaro_category_mappings_service_idx` ON `vagaro_category_mappings` (`service_category_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `vagaro_category_mappings_vagaro_unique` ON `vagaro_category_mappings` (`vagaro_category_id`);--> statement-breakpoint
CREATE TABLE `vagaro_service_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`vagaro_category_id` text NOT NULL,
	`title` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`service_count` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`team_label` text,
	`team_display_order` integer,
	`show_on_team` integer DEFAULT true NOT NULL,
	`last_seen_at` integer NOT NULL,
	`last_synced_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `vagaro_service_categories_order_idx` ON `vagaro_service_categories` (`display_order`);--> statement-breakpoint
CREATE UNIQUE INDEX `vagaro_service_categories_vagaro_id_unique` ON `vagaro_service_categories` (`vagaro_category_id`);--> statement-breakpoint
CREATE TABLE `vagaro_sync_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`trigger` text NOT NULL,
	`status` text DEFAULT 'running' NOT NULL,
	`result` text,
	`error` text,
	`started_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`completed_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `service_categories` ADD `display_name` text;--> statement-breakpoint
ALTER TABLE `service_categories` ADD `source_type` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `service_categories` ADD `show_in_booking` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `service_categories` ADD `sync_status` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `service_categories` ADD `last_synced_at` integer;--> statement-breakpoint
ALTER TABLE `team_member_services_vagaro` ADD `vagaro_category_id` text;
--> statement-breakpoint
INSERT INTO `vagaro_service_categories`
  (`id`, `vagaro_category_id`, `title`, `display_order`, `service_count`, `is_active`, `team_label`, `team_display_order`, `show_on_team`, `last_seen_at`, `last_synced_at`)
VALUES
  ('vsc-11493462', '11493462', 'Lash Extensions', 1, 17, 1, 'Lashes', 10, 1, cast((julianday('now') - 2440587.5)*86400000 as integer), cast((julianday('now') - 2440587.5)*86400000 as integer)),
  ('vsc-23376322', '23376322', 'Lash Lifts', 2, 4, 1, 'Lash Lifts', 20, 1, cast((julianday('now') - 2440587.5)*86400000 as integer), cast((julianday('now') - 2440587.5)*86400000 as integer)),
  ('vsc-15071993', '15071993', 'Brows', 3, 12, 1, 'Brows', 30, 1, cast((julianday('now') - 2440587.5)*86400000 as integer), cast((julianday('now') - 2440587.5)*86400000 as integer)),
  ('vsc-22300842', '22300842', 'Skincare & Facials', 4, 16, 1, 'Skin Care', 40, 1, cast((julianday('now') - 2440587.5)*86400000 as integer), cast((julianday('now') - 2440587.5)*86400000 as integer)),
  ('vsc-11764599', '11764599', 'Waxing', 5, 14, 1, 'Waxing', 50, 1, cast((julianday('now') - 2440587.5)*86400000 as integer), cast((julianday('now') - 2440587.5)*86400000 as integer)),
  ('vsc-23861995', '23861995', 'Permanent Makeup (Microblading/Nanobrows/Freckles/Lip Blushing)', 6, 16, 1, 'Permanent Makeup', 60, 1, cast((julianday('now') - 2440587.5)*86400000 as integer), cast((julianday('now') - 2440587.5)*86400000 as integer)),
  ('vsc-34383222', '34383222', 'Permanent Jewelry', 7, 3, 1, 'Permanent Jewelry', 70, 1, cast((julianday('now') - 2440587.5)*86400000 as integer), cast((julianday('now') - 2440587.5)*86400000 as integer)),
  ('vsc-39970485', '39970485', 'Fine Line Tattoos', 8, 1, 1, 'Fine Line Tattoos', 0, 1, cast((julianday('now') - 2440587.5)*86400000 as integer), cast((julianday('now') - 2440587.5)*86400000 as integer)),
  ('vsc-21281317', '21281317', 'Bundles', 9, 7, 1, 'Bundles', 90, 0, cast((julianday('now') - 2440587.5)*86400000 as integer), cast((julianday('now') - 2440587.5)*86400000 as integer));
--> statement-breakpoint
INSERT INTO `vagaro_category_mappings`
  (`id`, `vagaro_category_id`, `service_category_id`, `mapping_type`)
SELECT 'vcm-11493462', 'vsc-11493462', `id`, 'manual' FROM `service_categories` WHERE `slug` = 'lashes';
--> statement-breakpoint
INSERT INTO `vagaro_category_mappings` (`id`, `vagaro_category_id`, `service_category_id`, `mapping_type`)
SELECT 'vcm-23376322', 'vsc-23376322', `id`, 'manual' FROM `service_categories` WHERE `slug` = 'lashes';
--> statement-breakpoint
INSERT INTO `vagaro_category_mappings` (`id`, `vagaro_category_id`, `service_category_id`, `mapping_type`)
SELECT 'vcm-15071993', 'vsc-15071993', `id`, 'manual' FROM `service_categories` WHERE `slug` = 'brows';
--> statement-breakpoint
INSERT INTO `vagaro_category_mappings` (`id`, `vagaro_category_id`, `service_category_id`, `mapping_type`)
SELECT 'vcm-22300842', 'vsc-22300842', `id`, 'manual' FROM `service_categories` WHERE `slug` = 'facials';
--> statement-breakpoint
INSERT INTO `vagaro_category_mappings` (`id`, `vagaro_category_id`, `service_category_id`, `mapping_type`)
SELECT 'vcm-11764599', 'vsc-11764599', `id`, 'manual' FROM `service_categories` WHERE `slug` = 'waxing';
--> statement-breakpoint
INSERT INTO `vagaro_category_mappings` (`id`, `vagaro_category_id`, `service_category_id`, `mapping_type`)
SELECT 'vcm-23861995', 'vsc-23861995', `id`, 'manual' FROM `service_categories` WHERE `slug` = 'permanent-makeup';
--> statement-breakpoint
INSERT INTO `vagaro_category_mappings` (`id`, `vagaro_category_id`, `service_category_id`, `mapping_type`)
SELECT 'vcm-34383222', 'vsc-34383222', `id`, 'manual' FROM `service_categories` WHERE `slug` = 'specialty';
--> statement-breakpoint
INSERT INTO `vagaro_category_mappings` (`id`, `vagaro_category_id`, `service_category_id`, `mapping_type`)
SELECT 'vcm-39970485', 'vsc-39970485', `id`, 'manual' FROM `service_categories` WHERE `slug` = 'fine-line-tattoos';
--> statement-breakpoint
INSERT INTO `vagaro_category_mappings` (`id`, `vagaro_category_id`, `service_category_id`, `mapping_type`)
SELECT 'vcm-21281317', 'vsc-21281317', `id`, 'manual' FROM `service_categories` WHERE `slug` = 'bundles';
--> statement-breakpoint
UPDATE `service_categories`
SET
  `display_name` = CASE `slug`
    WHEN 'lashes' THEN 'Lashes'
    WHEN 'brows' THEN 'Brows'
    WHEN 'facials' THEN 'Skincare'
    WHEN 'waxing' THEN 'Waxing'
    WHEN 'permanent-makeup' THEN 'Permanent Makeup'
    WHEN 'specialty' THEN 'Permanent Jewelry'
    WHEN 'fine-line-tattoos' THEN 'Fine Line Tattoos'
    WHEN 'injectables' THEN 'Botox'
    WHEN 'bundles' THEN 'Bundles'
    ELSE `display_name`
  END,
  `source_type` = CASE
    WHEN `slug` = 'lashes' THEN 'merged'
    WHEN `slug` IN ('brows', 'facials', 'waxing', 'permanent-makeup', 'specialty', 'fine-line-tattoos', 'bundles') THEN 'vagaro'
    ELSE 'manual'
  END,
  `show_in_booking` = CASE WHEN `slug` IN ('nails', 'lashpop-pro-training') THEN 0 ELSE `is_active` END,
  `sync_status` = CASE
    WHEN `slug` IN ('lashes', 'brows', 'facials', 'waxing', 'permanent-makeup', 'specialty', 'fine-line-tattoos', 'bundles') THEN 'synced'
    ELSE 'manual'
  END,
  `last_synced_at` = CASE
    WHEN `slug` IN ('lashes', 'brows', 'facials', 'waxing', 'permanent-makeup', 'specialty', 'fine-line-tattoos', 'bundles')
      THEN cast((julianday('now') - 2440587.5)*86400000 as integer)
    ELSE `last_synced_at`
  END;
--> statement-breakpoint
UPDATE `service_categories` SET `display_order` = 1 WHERE `slug` = 'lashes';
--> statement-breakpoint
UPDATE `service_categories` SET `display_order` = 2 WHERE `slug` = 'brows';
--> statement-breakpoint
UPDATE `service_categories` SET `display_order` = 3 WHERE `slug` = 'facials';
--> statement-breakpoint
UPDATE `service_categories` SET `display_order` = 4 WHERE `slug` = 'waxing';
--> statement-breakpoint
UPDATE `service_categories` SET `display_order` = 5 WHERE `slug` = 'permanent-makeup';
--> statement-breakpoint
UPDATE `service_categories` SET `display_order` = 6 WHERE `slug` = 'specialty';
--> statement-breakpoint
UPDATE `service_categories` SET `display_order` = 7 WHERE `slug` = 'fine-line-tattoos';
--> statement-breakpoint
UPDATE `service_categories` SET `display_order` = 8 WHERE `slug` = 'injectables';
--> statement-breakpoint
UPDATE `service_categories` SET `display_order` = 9 WHERE `slug` = 'bundles';
--> statement-breakpoint
UPDATE `team_member_services_vagaro`
SET `vagaro_category_id` = CASE lower(trim(`vagaro_parent_title`))
  WHEN 'lash extensions' THEN '11493462'
  WHEN 'lash lifts' THEN '23376322'
  WHEN 'brows' THEN '15071993'
  WHEN 'skincare & facials' THEN '22300842'
  WHEN 'waxing' THEN '11764599'
  WHEN 'permanent jewelry' THEN '34383222'
  WHEN 'fine line tattoos' THEN '39970485'
  WHEN 'bundles' THEN '21281317'
  ELSE CASE WHEN lower(trim(`vagaro_parent_title`)) LIKE 'permanent makeup%' THEN '23861995' ELSE `vagaro_category_id` END
END;
