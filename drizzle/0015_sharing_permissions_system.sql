-- Sharing Permissions System Migration
-- Creates new tables and updates existing tables for sharing functionality

-- ============================================================================
-- New Tables
-- ============================================================================

-- User Roles Table
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Shared Resources Table
CREATE TABLE "shared_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"shared_with_user_id" text NOT NULL,
	"permission_level" text NOT NULL,
	"created_by" text NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Public Share Links Table
CREATE TABLE "public_share_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" uuid NOT NULL,
	"created_by" text NOT NULL,
	"permission_level" text NOT NULL,
	"password_hash" text,
	"expires_at" timestamp,
	"max_views" integer,
	"view_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_accessed_at" timestamp,
	CONSTRAINT "public_share_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint

-- Share Activity Log Table
CREATE TABLE "share_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" uuid NOT NULL,
	"action" text NOT NULL,
	"actor_id" text,
	"target_user_id" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- ============================================================================
-- Foreign Key Constraints for New Tables
-- ============================================================================

ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "shared_resources" ADD CONSTRAINT "shared_resources_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shared_resources" ADD CONSTRAINT "shared_resources_shared_with_user_id_user_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shared_resources" ADD CONSTRAINT "shared_resources_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "public_share_links" ADD CONSTRAINT "public_share_links_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "share_activity_log" ADD CONSTRAINT "share_activity_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "share_activity_log" ADD CONSTRAINT "share_activity_log_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

-- ============================================================================
-- Indexes for New Tables
-- ============================================================================

-- User Roles Indexes
CREATE INDEX "user_roles_user_id_idx" ON "user_roles" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "user_roles_role_idx" ON "user_roles" USING btree ("role");
--> statement-breakpoint

-- Shared Resources Indexes
CREATE INDEX "shared_resources_resource_type_idx" ON "shared_resources" USING btree ("resource_type");
--> statement-breakpoint
CREATE INDEX "shared_resources_resource_id_idx" ON "shared_resources" USING btree ("resource_id");
--> statement-breakpoint
CREATE INDEX "shared_resources_owner_id_idx" ON "shared_resources" USING btree ("owner_id");
--> statement-breakpoint
CREATE INDEX "shared_resources_shared_with_user_id_idx" ON "shared_resources" USING btree ("shared_with_user_id");
--> statement-breakpoint
CREATE INDEX "shared_resources_resource_composite_idx" ON "shared_resources" USING btree ("resource_type", "resource_id");
--> statement-breakpoint

-- Public Share Links Indexes
CREATE INDEX "public_share_links_token_idx" ON "public_share_links" USING btree ("token");
--> statement-breakpoint
CREATE INDEX "public_share_links_resource_type_idx" ON "public_share_links" USING btree ("resource_type");
--> statement-breakpoint
CREATE INDEX "public_share_links_resource_id_idx" ON "public_share_links" USING btree ("resource_id");
--> statement-breakpoint
CREATE INDEX "public_share_links_created_by_idx" ON "public_share_links" USING btree ("created_by");
--> statement-breakpoint
CREATE INDEX "public_share_links_is_active_idx" ON "public_share_links" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX "public_share_links_resource_composite_idx" ON "public_share_links" USING btree ("resource_type", "resource_id");
--> statement-breakpoint

-- Share Activity Log Indexes
CREATE INDEX "share_activity_log_resource_type_idx" ON "share_activity_log" USING btree ("resource_type");
--> statement-breakpoint
CREATE INDEX "share_activity_log_resource_id_idx" ON "share_activity_log" USING btree ("resource_id");
--> statement-breakpoint
CREATE INDEX "share_activity_log_action_idx" ON "share_activity_log" USING btree ("action");
--> statement-breakpoint
CREATE INDEX "share_activity_log_actor_id_idx" ON "share_activity_log" USING btree ("actor_id");
--> statement-breakpoint
CREATE INDEX "share_activity_log_target_user_id_idx" ON "share_activity_log" USING btree ("target_user_id");
--> statement-breakpoint
CREATE INDEX "share_activity_log_created_at_idx" ON "share_activity_log" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "share_activity_log_resource_composite_idx" ON "share_activity_log" USING btree ("resource_type", "resource_id");
--> statement-breakpoint

-- ============================================================================
-- Alter Existing Tables
-- ============================================================================

-- Add columns to assets table (owner_id already exists)
ALTER TABLE "assets" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "visibility" text DEFAULT 'private' NOT NULL;
--> statement-breakpoint

-- Add columns to sets table (owner_id already exists)
ALTER TABLE "sets" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "sets" ADD COLUMN "visibility" text DEFAULT 'private' NOT NULL;
--> statement-breakpoint

-- Add column to tag_categories table (owner_id already exists)
ALTER TABLE "tag_categories" ADD COLUMN "visibility" text DEFAULT 'private' NOT NULL;
--> statement-breakpoint

-- ============================================================================
-- Data Migration
-- ============================================================================

-- Set default owner for existing assets (set to the first user with DAM access)
-- If no users exist, this will do nothing
UPDATE "assets"
SET "owner_id" = (
  SELECT "id"
  FROM "user"
  WHERE "dam_access" = true
  LIMIT 1
)
WHERE "owner_id" IS NULL;
--> statement-breakpoint

-- Set default owner for existing sets
UPDATE "sets"
SET "owner_id" = (
  SELECT "id"
  FROM "user"
  WHERE "dam_access" = true
  LIMIT 1
)
WHERE "owner_id" IS NULL;
--> statement-breakpoint

-- Set default owner for existing tag_categories
UPDATE "tag_categories"
SET "owner_id" = (
  SELECT "id"
  FROM "user"
  WHERE "dam_access" = true
  LIMIT 1
)
WHERE "owner_id" IS NULL;
--> statement-breakpoint

-- ============================================================================
-- Create Indexes for Existing Tables (for new columns)
-- ============================================================================

CREATE INDEX "assets_owner_id_idx" ON "assets" USING btree ("owner_id");
--> statement-breakpoint
CREATE INDEX "assets_visibility_idx" ON "assets" USING btree ("visibility");
--> statement-breakpoint
CREATE INDEX "assets_is_public_idx" ON "assets" USING btree ("is_public");
--> statement-breakpoint

CREATE INDEX "sets_owner_id_idx" ON "sets" USING btree ("owner_id");
--> statement-breakpoint
CREATE INDEX "sets_visibility_idx" ON "sets" USING btree ("visibility");
--> statement-breakpoint
CREATE INDEX "sets_is_public_idx" ON "sets" USING btree ("is_public");
--> statement-breakpoint

CREATE INDEX "tag_categories_owner_id_idx" ON "tag_categories" USING btree ("owner_id");
--> statement-breakpoint
CREATE INDEX "tag_categories_visibility_idx" ON "tag_categories" USING btree ("visibility");
