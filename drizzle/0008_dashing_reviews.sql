CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text DEFAULT 'vagaro' NOT NULL,
	"source_url" text NOT NULL,
	"reviewer_name" text NOT NULL,
	"subject" text,
	"review_text" text NOT NULL,
	"rating" integer DEFAULT 5 NOT NULL,
	"review_date" timestamp,
	"response_text" text,
	"response_date" timestamp,
	"raw_payload" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "reviews_unique_source_reviewer" ON "reviews" ("source","reviewer_name","review_text");
