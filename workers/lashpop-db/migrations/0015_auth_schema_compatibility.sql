-- Additive Better Auth 1.7 schema compatibility. Existing opaque session
-- tokens, user roles, expiry and creation dates remain unchanged.
-- Rehearse with foreign_keys=ON against a fresh production export before apply.
-- Apply before deploying the compatible app; the old app tolerates these additions.
-- Rollback: restore the prior app version and leave these additive fields/table
-- in place. Do not restore historical session rows or reactivate revoked tokens.
-- The account table remains unused while password/OAuth sign-in is disabled.

ALTER TABLE `session` ADD COLUMN `updated_at` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
UPDATE `session` SET `updated_at` = `created_at` WHERE `updated_at` = 0;
--> statement-breakpoint
ALTER TABLE `verification` ADD COLUMN `updated_at` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
UPDATE `verification` SET `updated_at` = `created_at` WHERE `updated_at` = 0;
--> statement-breakpoint
CREATE TABLE `account` (
  `id` text PRIMARY KEY NOT NULL,
  `account_id` text NOT NULL,
  `provider_id` text NOT NULL,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `access_token` text,
  `refresh_token` text,
  `id_token` text,
  `access_token_expires_at` integer,
  `refresh_token_expires_at` integer,
  `scope` text,
  `password` text,
  `created_at` integer NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)),
  `updated_at` integer NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))
);
--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `account` (`user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_provider_identity_unique` ON `account` (`provider_id`, `account_id`);
