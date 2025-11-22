CREATE TABLE "instagram_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"internal_id" text NOT NULL,
	"username" text NOT NULL,
	"caption" text,
	"permalink" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"media_type" text NOT NULL,
	"media_url" text NOT NULL,
	"original_url" text,
	"thumbnail_url" text,
	"is_pinned" boolean DEFAULT false,
	"children" jsonb,
	"likes_count" integer DEFAULT 0,
	"comments_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
