CREATE TYPE "public"."asset_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."lash_color" AS ENUM('brown', 'black');--> statement-breakpoint
CREATE TYPE "public"."lash_curl" AS ENUM('1', '2', '3', '4');--> statement-breakpoint
CREATE TYPE "public"."lash_length" AS ENUM('S', 'M', 'L');--> statement-breakpoint
CREATE TABLE "asset_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_type" "asset_type" NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"team_member_id" uuid,
	"color" "lash_color",
	"length" "lash_length",
	"curl" "lash_curl",
	"alt_text" text,
	"caption" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asset_services" ADD CONSTRAINT "asset_services_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_services" ADD CONSTRAINT "asset_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;