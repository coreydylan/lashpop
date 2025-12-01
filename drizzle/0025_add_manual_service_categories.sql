-- Add manual_service_categories field to team_members
-- This allows manually assigning service category tags for team members
-- whose services aren't in Vagaro (e.g., injectables, wellness services)

ALTER TABLE "team_members" ADD COLUMN "manual_service_categories" jsonb;
