CREATE TABLE "team_member_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_member_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"crop_full_vertical" jsonb,
	"crop_full_horizontal" jsonb,
	"crop_medium_circle" jsonb,
	"crop_close_up_circle" jsonb,
	"crop_square" jsonb,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "team_member_photos" ADD CONSTRAINT "team_member_photos_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;