ALTER TABLE `reviews` ADD `source_urls` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` ADD `bio_override` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` ADD `image_override` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` ADD `is_off_vagaro` integer DEFAULT false NOT NULL;