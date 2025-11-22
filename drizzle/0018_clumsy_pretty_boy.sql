CREATE TABLE "review_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"rating" numeric(3, 1) NOT NULL,
	"review_count" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "review_stats_source_unique" UNIQUE("source")
);
