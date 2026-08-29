CREATE TABLE `public_image_sources` (
  `source_key` text PRIMARY KEY NOT NULL,
  `source_kind` text NOT NULL,
  `source_url` text NOT NULL,
  `cloudflare_image_id` text NOT NULL,
  `delivery_url` text NOT NULL,
  `previous_cloudflare_image_id` text,
  `source_etag` text,
  `source_last_modified` text,
  `source_content_length` integer,
  `source_content_hash` text,
  `status` text DEFAULT 'ready' NOT NULL,
  `failure_count` integer DEFAULT 0 NOT NULL,
  `last_error` text,
  `checked_at` integer NOT NULL,
  `ingested_at` integer NOT NULL,
  `refreshed_at` integer NOT NULL,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `public_image_sources_kind_status_idx` ON `public_image_sources` (`source_kind`, `status`);
--> statement-breakpoint
ALTER TABLE `services` ADD COLUMN `vagaro_image_source_url` text;
--> statement-breakpoint
ALTER TABLE `team_members` ADD COLUMN `vagaro_photo_source_url` text;
