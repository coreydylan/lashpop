-- Dual-mode stylist data architecture
--
-- The team_members.uses_lashpop_booking flag routes ALL fields for a stylist:
--   uses_lashpop_booking = true  → 100% of fields come from Vagaro sync
--   uses_lashpop_booking = false → 100% of fields come from local admin entry
-- There is never a merge or fallback between the two sources.
--
-- This migration:
--   1. Renames team_members.manual_service_categories -> external_service_categories
--      (the field is the source of service category tags for external-booking
--      stylists; "manual" never fit the dual-mode model).
--   2. Drops team_members.specialties — frontend tags now come from either
--      team_member_services_vagaro (Vagaro stylists) or external_service_categories
--      (external stylists). Specialties was a hand-edited overlap surface that
--      masked sync bugs.
--   3. Creates team_member_services_vagaro — canonical mapping of Vagaro stylists
--      to the services they perform. Populated by the worker via per-stylist
--      composite endpoint calls; truncate-and-replace per sync.

ALTER TABLE "team_members"
  RENAME COLUMN "manual_service_categories" TO "external_service_categories";

ALTER TABLE "team_members" DROP COLUMN IF EXISTS "specialties";

CREATE TABLE "team_member_services_vagaro" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_member_id" uuid NOT NULL REFERENCES "team_members"("id") ON DELETE CASCADE,
  "service_id" uuid NOT NULL REFERENCES "services"("id") ON DELETE CASCADE,
  "vagaro_parent_title" text,
  "synced_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "team_member_services_vagaro_member_service_unique"
    UNIQUE ("team_member_id", "service_id")
);

CREATE INDEX "team_member_services_vagaro_member_idx"
  ON "team_member_services_vagaro" ("team_member_id");
CREATE INDEX "team_member_services_vagaro_service_idx"
  ON "team_member_services_vagaro" ("service_id");
