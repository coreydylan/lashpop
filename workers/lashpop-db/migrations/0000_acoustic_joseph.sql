CREATE TABLE `admin_audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`surface` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text,
	`target_id` text,
	`diff` text,
	`notes` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `admin_audit_log_actor_idx` ON `admin_audit_log` (`actor_user_id`);--> statement-breakpoint
CREATE INDEX `admin_audit_log_surface_idx` ON `admin_audit_log` (`surface`);--> statement-breakpoint
CREATE INDEX `admin_audit_log_action_idx` ON `admin_audit_log` (`action`);--> statement-breakpoint
CREATE INDEX `admin_audit_log_target_idx` ON `admin_audit_log` (`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `admin_audit_log_created_at_idx` ON `admin_audit_log` (`created_at`);--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`booked_by_user_id` text,
	`is_friend_booking` integer DEFAULT false,
	`friend_booking_request_id` text,
	`vagaro_appointment_id` text NOT NULL,
	`vagaro_data` text,
	`vagaro_customer_id` text,
	`vagaro_service_provider_id` text,
	`vagaro_service_id` text,
	`vagaro_business_id` text,
	`service_title` text NOT NULL,
	`service_category` text,
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	`booking_status` text NOT NULL,
	`event_type` text,
	`amount` real,
	`online_vs_inhouse` text,
	`appointment_type_code` text,
	`appointment_type_name` text,
	`booking_source` text,
	`calendar_event_id` text,
	`form_response_ids` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`last_synced_at` integer,
	`vagaro_created_at` integer,
	`vagaro_modified_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `appointments_vagaro_appointment_id_unique` ON `appointments` (`vagaro_appointment_id`);--> statement-breakpoint
CREATE TABLE `asset_services` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`service_id` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `asset_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`tag_id` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`file_type` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`width` integer,
	`height` integer,
	`blur_data_url` text,
	`team_member_id` text,
	`color` text,
	`length` text,
	`curl` text,
	`alt_text` text,
	`caption` text,
	`external_id` text,
	`source` text,
	`source_metadata` text,
	`recovery_status` text,
	`recovery_note` text,
	`uploaded_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`team_member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assets_external_id_unique` ON `assets` (`external_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`phone_number` text,
	`phone_number_verified` integer DEFAULT false,
	`email` text,
	`email_verified` integer DEFAULT false,
	`name` text,
	`image` text,
	`dam_access` integer DEFAULT false,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_phone_number_unique` ON `user` (`phone_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `business_locations` (
	`id` text PRIMARY KEY NOT NULL,
	`vagaro_business_id` text NOT NULL,
	`vagaro_business_group_id` text,
	`vagaro_data` text,
	`business_name` text NOT NULL,
	`business_group_name` text,
	`business_alias` text,
	`business_phone` text,
	`business_email` text,
	`business_website` text,
	`vagaro_listing_url` text,
	`street_address` text,
	`city` text,
	`region_code` text,
	`region_name` text,
	`country_code` text,
	`country_name` text,
	`postal_code` text,
	`show_contact_information` integer,
	`show_vagaro_connect` integer,
	`service_location` text,
	`listed_on_vagaro` integer,
	`listed_on_google` integer,
	`listed_on_apple_maps` integer,
	`use_employee_hours` integer,
	`children_policy` text,
	`walk_ins_accepted` integer,
	`payment_methods` text,
	`parking` text,
	`amenities` text,
	`online_gc_store` integer,
	`spoken_languages` text,
	`business_hours` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`last_synced_at` integer,
	`vagaro_created_at` integer,
	`vagaro_modified_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `business_locations_vagaro_business_id_unique` ON `business_locations` (`vagaro_business_id`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`membership` text DEFAULT 'free' NOT NULL,
	`stripe_customer_id` text,
	`stripe_subscription_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_user_id_unique` ON `customers` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_stripe_customer_id_unique` ON `customers` (`stripe_customer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_stripe_subscription_id_unique` ON `customers` (`stripe_subscription_id`);--> statement-breakpoint
CREATE TABLE `dam_user_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action_type` text NOT NULL,
	`action_data` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `dam_user_actions_user_id_idx` ON `dam_user_actions` (`user_id`);--> statement-breakpoint
CREATE INDEX `dam_user_actions_action_type_idx` ON `dam_user_actions` (`action_type`);--> statement-breakpoint
CREATE INDEX `dam_user_actions_created_at_idx` ON `dam_user_actions` (`created_at`);--> statement-breakpoint
CREATE TABLE `dam_user_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`settings` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dam_user_settings_user_id_unique` ON `dam_user_settings` (`user_id`);--> statement-breakpoint
CREATE TABLE `faq_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`description` text,
	`display_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `faq_categories_name_unique` ON `faq_categories` (`name`);--> statement-breakpoint
CREATE TABLE `faq_items` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `faq_categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `form_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`vagaro_response_id` text NOT NULL,
	`vagaro_form_id` text NOT NULL,
	`vagaro_customer_id` text,
	`vagaro_business_id` text,
	`vagaro_appointment_id` text,
	`vagaro_membership_id` text,
	`vagaro_data` text,
	`form_title` text NOT NULL,
	`form_published_date` integer,
	`business_alias` text,
	`business_group_id` text,
	`questions_and_answers` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`last_synced_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `form_responses_vagaro_response_id_unique` ON `form_responses` (`vagaro_response_id`);--> statement-breakpoint
CREATE TABLE `friend_booking_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`requester_user_id` text NOT NULL,
	`requester_phone` text NOT NULL,
	`friend_phone` text NOT NULL,
	`friend_user_id` text,
	`friend_name` text,
	`service_id` text,
	`team_member_id` text,
	`requested_date_time` integer,
	`status` text DEFAULT 'pending',
	`consent_token` text NOT NULL,
	`consent_token_expires_at` integer NOT NULL,
	`consented_at` integer,
	`declined_at` integer,
	`declined_reason` text,
	`appointment_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`requester_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`friend_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `friend_booking_requests_consent_token_unique` ON `friend_booking_requests` (`consent_token`);--> statement-breakpoint
CREATE TABLE `newsletter_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`subscribed_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`source` text DEFAULT 'footer_form'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_subscriptions_email_unique` ON `newsletter_subscriptions` (`email`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`date_of_birth` text,
	`sms_marketing_opt_in` integer DEFAULT false,
	`email_marketing_opt_in` integer DEFAULT false,
	`preferred_location_id` text,
	`preferred_team_member_id` text,
	`lash_type` text,
	`lash_curl` text,
	`lash_length` text,
	`allergies` text,
	`notes` text,
	`loyalty_points` integer DEFAULT 0,
	`tier` text DEFAULT 'standard',
	`knowledge_data` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`onboarding_completed` integer DEFAULT false,
	`profile_completion_percentage` integer DEFAULT 0,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`preferred_location_id`) REFERENCES `business_locations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`preferred_team_member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_user_id_unique` ON `profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `punchlist_activity` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`old_value` text,
	`new_value` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `punchlist_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `punchlist_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `punchlist_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `punchlist_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `punchlist_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `punchlist_items` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'open' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`category` text,
	`created_by_id` text NOT NULL,
	`assigned_to_id` text,
	`closed_at` integer,
	`closed_by_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`created_by_id`) REFERENCES `punchlist_users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to_id`) REFERENCES `punchlist_users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`closed_by_id`) REFERENCES `punchlist_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `punchlist_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `punchlist_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `punchlist_sessions_token_unique` ON `punchlist_sessions` (`token`);--> statement-breakpoint
CREATE TABLE `punchlist_users` (
	`id` text PRIMARY KEY NOT NULL,
	`phone_number` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'team' NOT NULL,
	`avatar_color` text DEFAULT 'sage' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `punchlist_users_phone_number_unique` ON `punchlist_users` (`phone_number`);--> statement-breakpoint
CREATE TABLE `quiz_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`lash_style` text NOT NULL,
	`crop_data` text,
	`crop_url` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quiz_result_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`lash_style` text NOT NULL,
	`result_image_asset_id` text,
	`result_image_crop_data` text,
	`result_image_crop_url` text,
	`display_name` text NOT NULL,
	`description` text NOT NULL,
	`best_for` text DEFAULT '[]' NOT NULL,
	`recommended_service` text NOT NULL,
	`booking_label` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`result_image_asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quiz_result_settings_lash_style_unique` ON `quiz_result_settings` (`lash_style`);--> statement-breakpoint
CREATE TABLE `review_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`rating` real NOT NULL,
	`review_count` integer NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `review_stats_source_unique` ON `review_stats` (`source`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text DEFAULT 'vagaro' NOT NULL,
	`source_url` text NOT NULL,
	`reviewer_name` text NOT NULL,
	`subject` text,
	`team_member_id` text,
	`review_text` text NOT NULL,
	`rating` integer DEFAULT 5 NOT NULL,
	`review_date` integer,
	`response_text` text,
	`response_date` integer,
	`raw_payload` text,
	`show_on_website` integer DEFAULT true,
	`include_in_schema` integer DEFAULT true,
	`homepage_dismissed` integer DEFAULT false NOT NULL,
	`hidden_reason` text,
	`quality_score` integer,
	`quality_scored_at` integer,
	`editor_notes` text,
	`admin_locked_fields` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`team_member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `reviews_team_member_id_idx` ON `reviews` (`team_member_id`);--> statement-breakpoint
CREATE TABLE `scrollytelling_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`composition_id` text,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`metadata` text DEFAULT '{}',
	`is_template` integer DEFAULT false,
	`locale` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`composition_id`) REFERENCES `scrollytelling_compositions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scrollytelling_clips` (
	`id` text PRIMARY KEY NOT NULL,
	`track_id` text NOT NULL,
	`composition_id` text NOT NULL,
	`name` text,
	`start_position` real NOT NULL,
	`end_position` real NOT NULL,
	`properties` text NOT NULL,
	`easing` text DEFAULT 'linear',
	`is_locked` integer DEFAULT false,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`track_id`) REFERENCES `scrollytelling_tracks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`composition_id`) REFERENCES `scrollytelling_compositions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scrollytelling_collision_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`composition_id` text NOT NULL,
	`layer_a_id` text NOT NULL,
	`layer_b_id` text NOT NULL,
	`rule_type` text NOT NULL,
	`priority_winner` text,
	`metadata` text DEFAULT '{}',
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`composition_id`) REFERENCES `scrollytelling_compositions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`layer_a_id`) REFERENCES `scrollytelling_layers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`layer_b_id`) REFERENCES `scrollytelling_layers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`priority_winner`) REFERENCES `scrollytelling_layers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scrollytelling_compositions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`duration` real DEFAULT 1000,
	`viewport_width` integer DEFAULT 1920,
	`viewport_height` integer DEFAULT 1080,
	`version` integer DEFAULT 1,
	`is_published` integer DEFAULT false,
	`is_draft` integer DEFAULT true,
	`parent_id` text,
	`locale` text DEFAULT 'en-US',
	`metadata` text DEFAULT '{}',
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`published_at` integer
);
--> statement-breakpoint
CREATE TABLE `scrollytelling_cue_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`cue_id` text NOT NULL,
	`target_layer_id` text,
	`target_selector` text,
	`action_type` text NOT NULL,
	`value` text NOT NULL,
	`priority` integer DEFAULT 0,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`cue_id`) REFERENCES `scrollytelling_cues`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_layer_id`) REFERENCES `scrollytelling_layers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scrollytelling_cues` (
	`id` text PRIMARY KEY NOT NULL,
	`composition_id` text NOT NULL,
	`name` text,
	`position` real NOT NULL,
	`duration` real DEFAULT 0,
	`is_marker` integer DEFAULT false,
	`color` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`composition_id`) REFERENCES `scrollytelling_compositions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scrollytelling_drawer_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`layer_id` text NOT NULL,
	`dock_position` text NOT NULL,
	`dock_height_px` integer DEFAULT 60,
	`open_height_percent` integer DEFAULT 100,
	`is_modal` integer DEFAULT false,
	`has_backdrop` integer DEFAULT true,
	`backdrop_opacity` real DEFAULT 0.5,
	`transition_duration` integer DEFAULT 300,
	`scroll_contained` integer DEFAULT true,
	`docked_widget_block_id` text,
	`main_content_block_id` text,
	`collision_priority` integer DEFAULT 0,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`layer_id`) REFERENCES `scrollytelling_layers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`docked_widget_block_id`) REFERENCES `scrollytelling_blocks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`main_content_block_id`) REFERENCES `scrollytelling_blocks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scrollytelling_drawer_configs_layer_id_unique` ON `scrollytelling_drawer_configs` (`layer_id`);--> statement-breakpoint
CREATE TABLE `scrollytelling_drawer_states` (
	`id` text PRIMARY KEY NOT NULL,
	`drawer_config_id` text NOT NULL,
	`clip_id` text,
	`state` text NOT NULL,
	`height_override` integer,
	`transition_duration` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`drawer_config_id`) REFERENCES `scrollytelling_drawer_configs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`clip_id`) REFERENCES `scrollytelling_clips`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scrollytelling_header_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`layer_id` text NOT NULL,
	`height_px` integer DEFAULT 60,
	`is_sticky` integer DEFAULT true,
	`hide_on_scroll_down` integer DEFAULT false,
	`transparent_at_top` integer DEFAULT false,
	`navigation_block_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`layer_id`) REFERENCES `scrollytelling_layers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`navigation_block_id`) REFERENCES `scrollytelling_blocks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scrollytelling_header_configs_layer_id_unique` ON `scrollytelling_header_configs` (`layer_id`);--> statement-breakpoint
CREATE TABLE `scrollytelling_layers` (
	`id` text PRIMARY KEY NOT NULL,
	`composition_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`z_index` integer NOT NULL,
	`is_visible` integer DEFAULT true,
	`is_locked` integer DEFAULT false,
	`properties` text DEFAULT '{}',
	`responsive_variants` text DEFAULT '{}',
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`composition_id`) REFERENCES `scrollytelling_compositions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scrollytelling_playback_events` (
	`id` text PRIMARY KEY NOT NULL,
	`composition_id` text NOT NULL,
	`session_id` text NOT NULL,
	`event_type` text NOT NULL,
	`progress` real NOT NULL,
	`target_layer_id` text,
	`payload` text DEFAULT '{}',
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`composition_id`) REFERENCES `scrollytelling_compositions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_layer_id`) REFERENCES `scrollytelling_layers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scrollytelling_surface_slides` (
	`id` text PRIMARY KEY NOT NULL,
	`layer_id` text NOT NULL,
	`order_index` integer NOT NULL,
	`content_block_id` text,
	`background_image` text,
	`background_color` text,
	`transition_type` text DEFAULT 'fade',
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`layer_id`) REFERENCES `scrollytelling_layers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`content_block_id`) REFERENCES `scrollytelling_blocks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scrollytelling_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`composition_id` text NOT NULL,
	`layer_id` text NOT NULL,
	`name` text,
	`track_index` integer NOT NULL,
	`is_solo` integer DEFAULT false,
	`is_muted` integer DEFAULT false,
	`color` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`composition_id`) REFERENCES `scrollytelling_compositions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`layer_id`) REFERENCES `scrollytelling_layers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scrollytelling_triggers` (
	`id` text PRIMARY KEY NOT NULL,
	`composition_id` text NOT NULL,
	`type` text NOT NULL,
	`selector` text,
	`range_start` real NOT NULL,
	`range_end` real NOT NULL,
	`policy` text DEFAULT '{}',
	`is_active` integer DEFAULT true,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`composition_id`) REFERENCES `scrollytelling_compositions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `service_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`tagline` text,
	`icon` text,
	`display_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`key_image_asset_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `service_categories_name_unique` ON `service_categories` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `service_categories_slug_unique` ON `service_categories` (`slug`);--> statement-breakpoint
CREATE TABLE `service_subcategories` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`icon` text,
	`display_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`key_image_asset_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `service_categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`key_image_asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `service_subcategories_slug_unique` ON `service_subcategories` (`slug`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`vagaro_service_id` text,
	`vagaro_parent_service_id` text,
	`vagaro_widget_url` text,
	`vagaro_service_code` text,
	`vagaro_data` text,
	`vagaro_image_url` text,
	`category_id` text,
	`subcategory_id` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`subtitle` text,
	`description` text,
	`vagaro_description` text,
	`duration_minutes` integer NOT NULL,
	`price_starting` integer NOT NULL,
	`image_url` text,
	`color` text,
	`display_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`main_category` text NOT NULL,
	`sub_category` text,
	`display_title` text,
	`key_image_asset_id` text,
	`use_demo_photos` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`last_synced_at` integer,
	FOREIGN KEY (`category_id`) REFERENCES `service_categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`subcategory_id`) REFERENCES `service_subcategories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`key_image_asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `services_vagaro_service_id_unique` ON `services` (`vagaro_service_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `services_slug_unique` ON `services` (`slug`);--> statement-breakpoint
CREATE TABLE `set_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`set_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`stage` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`set_id`) REFERENCES `sets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sets` (
	`id` text PRIMARY KEY NOT NULL,
	`team_member_id` text NOT NULL,
	`name` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`team_member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tag_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`description` text,
	`color` text,
	`icon` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`selection_mode` text DEFAULT 'multi' NOT NULL,
	`selection_limit` integer,
	`is_collection` integer DEFAULT false NOT NULL,
	`permissions` text,
	`default_view_config` text,
	`is_rating` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_categories_name_unique` ON `tag_categories` (`name`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`parent_tag_id` text,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`description` text,
	`service_category_id` text,
	`service_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `tag_categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`service_category_id`) REFERENCES `service_categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `team_member_categories` (
	`team_member_id` text NOT NULL,
	`category_id` text NOT NULL,
	PRIMARY KEY(`team_member_id`, `category_id`),
	FOREIGN KEY (`team_member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `service_categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `team_member_highlights` (
	`id` text PRIMARY KEY NOT NULL,
	`team_member_id` text NOT NULL,
	`review_id` text NOT NULL,
	`rank` integer NOT NULL,
	`editor_notes` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`team_member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_member_highlights_team_member_id_review_id_unique` ON `team_member_highlights` (`team_member_id`,`review_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_member_highlights_team_member_id_rank_unique` ON `team_member_highlights` (`team_member_id`,`rank`);--> statement-breakpoint
CREATE TABLE `team_member_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`team_member_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`crop_full_vertical` text,
	`crop_full_horizontal` text,
	`crop_medium_circle` text,
	`crop_close_up_circle` text,
	`crop_square` text,
	`crop_full_vertical_url` text,
	`crop_full_horizontal_url` text,
	`crop_medium_circle_url` text,
	`crop_close_up_circle_url` text,
	`crop_square_url` text,
	`uploaded_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`team_member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `team_member_services_vagaro` (
	`id` text PRIMARY KEY NOT NULL,
	`team_member_id` text NOT NULL,
	`service_id` text NOT NULL,
	`vagaro_parent_title` text,
	`synced_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`team_member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `team_member_services_vagaro_member_idx` ON `team_member_services_vagaro` (`team_member_id`);--> statement-breakpoint
CREATE INDEX `team_member_services_vagaro_service_idx` ON `team_member_services_vagaro` (`service_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_member_services_vagaro_member_service_unique` ON `team_member_services_vagaro` (`team_member_id`,`service_id`);--> statement-breakpoint
CREATE TABLE `team_member_services` (
	`id` text PRIMARY KEY NOT NULL,
	`team_member_id` text NOT NULL,
	`service_id` text NOT NULL,
	`price` text,
	`price_with_tax` text,
	`duration_minutes` text,
	`points_given` text,
	`points_redeem` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`team_member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `team_members` (
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
	`show_on_website` integer DEFAULT true,
	`credentials` text DEFAULT '[]',
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`last_synced_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_members_vagaro_employee_id_unique` ON `team_members` (`vagaro_employee_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_members_vagaro_public_provider_id_unique` ON `team_members` (`vagaro_public_provider_id`);--> statement-breakpoint
CREATE TABLE `team_quick_facts` (
	`id` text PRIMARY KEY NOT NULL,
	`team_member_id` text NOT NULL,
	`fact_type` text NOT NULL,
	`custom_label` text,
	`value` text NOT NULL,
	`custom_icon` text,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`team_member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` text PRIMARY KEY NOT NULL,
	`client_name` text NOT NULL,
	`service_id` text,
	`rating` integer NOT NULL,
	`review_text` text NOT NULL,
	`client_image` text,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_approved` integer DEFAULT false NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`vagaro_transaction_id` text,
	`vagaro_user_payment_id` text NOT NULL,
	`vagaro_user_payments_mst_id` text NOT NULL,
	`vagaro_customer_id` text,
	`vagaro_service_provider_id` text,
	`vagaro_business_id` text NOT NULL,
	`vagaro_appointment_id` text,
	`vagaro_data` text,
	`transaction_date` integer NOT NULL,
	`business_alias` text,
	`business_group_id` text,
	`brand_name` text,
	`item_sold` text NOT NULL,
	`purchase_type` text NOT NULL,
	`service_category` text,
	`quantity` integer NOT NULL,
	`cc_amount` real,
	`cash_amount` real,
	`check_amount` real,
	`ach_amount` real,
	`bank_account_amount` real,
	`vagaro_pay_later_amount` real,
	`other_amount` real,
	`package_redemption` real,
	`gc_redemption` real,
	`points_amount` integer,
	`tax` real,
	`tip` real,
	`discount` real,
	`membership_amount` real,
	`product_discount` real,
	`amount_due` real,
	`cc_type` text,
	`cc_mode` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`last_synced_at` integer,
	`vagaro_created_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_vagaro_user_payment_id_unique` ON `transactions` (`vagaro_user_payment_id`);--> statement-breakpoint
CREATE TABLE `vagaro_customers` (
	`id` text PRIMARY KEY NOT NULL,
	`vagaro_customer_id` text NOT NULL,
	`vagaro_business_ids` text,
	`vagaro_data` text,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text,
	`mobile_phone` text,
	`day_phone` text,
	`night_phone` text,
	`street_address` text,
	`city` text,
	`region_code` text,
	`region_name` text,
	`country_code` text,
	`country_name` text,
	`postal_code` text,
	`business_group_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`last_synced_at` integer,
	`vagaro_created_at` integer,
	`vagaro_modified_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vagaro_customers_vagaro_customer_id_unique` ON `vagaro_customers` (`vagaro_customer_id`);--> statement-breakpoint
CREATE TABLE `vagaro_sync_mappings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`profile_id` text,
	`vagaro_customer_id` text NOT NULL,
	`vagaro_business_ids` text DEFAULT '[]',
	`sync_status` text DEFAULT 'active',
	`last_synced_at` integer,
	`sync_direction` text DEFAULT 'bidirectional',
	`conflict_resolution_strategy` text DEFAULT 'vagaro_wins',
	`last_conflict_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vagaro_sync_mappings_vagaro_customer_id_unique` ON `vagaro_sync_mappings` (`vagaro_customer_id`);--> statement-breakpoint
CREATE TABLE `homepage_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`review_id` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`is_pinned` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `website_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`section` text NOT NULL,
	`config` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `website_settings_section_unique` ON `website_settings` (`section`);--> statement-breakpoint
CREATE TABLE `work_with_us_carousel_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `work_with_us_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`experience` text,
	`specialty` text,
	`message` text,
	`instagram` text,
	`current_business` text,
	`desired_start_date` text,
	`booth_days` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `work_with_us_submissions_created_at_idx` ON `work_with_us_submissions` (`created_at`);--> statement-breakpoint
CREATE INDEX `work_with_us_submissions_path_idx` ON `work_with_us_submissions` (`path`);