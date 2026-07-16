ALTER TABLE `newsletter_subscriptions` ADD `status` text DEFAULT 'active' NOT NULL;
--> statement-breakpoint
ALTER TABLE `newsletter_subscriptions` ADD `notes` text;
--> statement-breakpoint
ALTER TABLE `newsletter_subscriptions` ADD `unsubscribed_at` integer;
--> statement-breakpoint
ALTER TABLE `newsletter_subscriptions` ADD `updated_at` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE `newsletter_subscriptions`
SET `updated_at` = COALESCE(
  `subscribed_at`,
  CAST((julianday('now') - 2440587.5) * 86400000 AS integer)
)
WHERE `updated_at` = 0;
--> statement-breakpoint
CREATE INDEX `newsletter_subscriptions_status_idx`
ON `newsletter_subscriptions` (`status`);
--> statement-breakpoint
CREATE INDEX `newsletter_subscriptions_subscribed_at_idx`
ON `newsletter_subscriptions` (`subscribed_at`);
