-- Add Vagaro linking columns to services table
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "vagaro_service_id" text;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "vagaro_parent_service_id" text;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "vagaro_data" jsonb;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "last_synced_at" timestamp;

-- Add Vagaro linking columns to team_members table
ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "vagaro_employee_id" text;
ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "vagaro_data" jsonb;
ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "last_synced_at" timestamp;

-- Add unique constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_vagaro_service_id_unique') THEN
        ALTER TABLE "services" ADD CONSTRAINT "services_vagaro_service_id_unique" UNIQUE("vagaro_service_id");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_members_vagaro_employee_id_unique') THEN
        ALTER TABLE "team_members" ADD CONSTRAINT "team_members_vagaro_employee_id_unique" UNIQUE("vagaro_employee_id");
    END IF;
END $$;

-- Make category_id nullable
ALTER TABLE "services" ALTER COLUMN "category_id" DROP NOT NULL;
