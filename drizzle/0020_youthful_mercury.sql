CREATE TABLE "punchlist_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "punchlist_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "punchlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"category" text,
	"created_by_id" uuid NOT NULL,
	"assigned_to_id" uuid,
	"closed_at" timestamp,
	"closed_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "punchlist_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "punchlist_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "punchlist_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'team' NOT NULL,
	"avatar_color" text DEFAULT 'sage' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "punchlist_users_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "team_quick_facts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_member_id" uuid NOT NULL,
	"fact_type" text NOT NULL,
	"custom_label" text,
	"value" text NOT NULL,
	"custom_icon" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "show_on_website" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "include_in_schema" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "service_categories" ADD COLUMN "tagline" text;--> statement-breakpoint
ALTER TABLE "service_categories" ADD COLUMN "key_image_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "service_subcategories" ADD COLUMN "key_image_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "key_image_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "use_demo_photos" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tag_categories" ADD COLUMN "selection_mode" text DEFAULT 'multi' NOT NULL;--> statement-breakpoint
ALTER TABLE "tag_categories" ADD COLUMN "selection_limit" integer;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "parent_tag_id" uuid;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "service_category_id" uuid;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "service_id" uuid;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "manual_service_categories" jsonb;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "credentials" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "punchlist_activity" ADD CONSTRAINT "punchlist_activity_item_id_punchlist_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."punchlist_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punchlist_activity" ADD CONSTRAINT "punchlist_activity_user_id_punchlist_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."punchlist_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punchlist_comments" ADD CONSTRAINT "punchlist_comments_item_id_punchlist_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."punchlist_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punchlist_comments" ADD CONSTRAINT "punchlist_comments_user_id_punchlist_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."punchlist_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punchlist_items" ADD CONSTRAINT "punchlist_items_created_by_id_punchlist_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."punchlist_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punchlist_items" ADD CONSTRAINT "punchlist_items_assigned_to_id_punchlist_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."punchlist_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punchlist_items" ADD CONSTRAINT "punchlist_items_closed_by_id_punchlist_users_id_fk" FOREIGN KEY ("closed_by_id") REFERENCES "public"."punchlist_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punchlist_sessions" ADD CONSTRAINT "punchlist_sessions_user_id_punchlist_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."punchlist_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_quick_facts" ADD CONSTRAINT "team_quick_facts_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_subcategories" ADD CONSTRAINT "service_subcategories_key_image_asset_id_assets_id_fk" FOREIGN KEY ("key_image_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_key_image_asset_id_assets_id_fk" FOREIGN KEY ("key_image_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_service_category_id_service_categories_id_fk" FOREIGN KEY ("service_category_id") REFERENCES "public"."service_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;