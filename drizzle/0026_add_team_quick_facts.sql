-- Team Quick Facts table for storing individual quick facts per team member
CREATE TABLE IF NOT EXISTS "team_quick_facts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_member_id" uuid NOT NULL REFERENCES "team_members"("id") ON DELETE CASCADE,
  "fact_type" text NOT NULL,
  "custom_label" text,
  "value" text NOT NULL,
  "custom_icon" text,
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Index for faster lookups by team member
CREATE INDEX IF NOT EXISTS "team_quick_facts_team_member_id_idx" ON "team_quick_facts" ("team_member_id");

-- Index for ordering
CREATE INDEX IF NOT EXISTS "team_quick_facts_display_order_idx" ON "team_quick_facts" ("team_member_id", "display_order");
