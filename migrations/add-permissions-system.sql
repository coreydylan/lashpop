-- ============================================================================
-- Migration: Add Role-Based Permission System
-- Description: Adds comprehensive role-based access control (RBAC) to the DAM
-- Created: 2025-11-16
-- ============================================================================

-- This migration adds:
-- 1. User role enum and permission fields to auth_user table
-- 2. Permission audit logging table
-- 3. Asset modification tracking fields
-- 4. Performance indexes

BEGIN;

-- ============================================================================
-- SECTION 1: Create User Role Enum
-- ============================================================================
-- Define the hierarchy of user roles for the DAM system
-- super_admin: Full system access, can manage all users and settings
-- admin: Can manage content and most users, but not super admins
-- editor: Can upload, edit, and delete assets
-- viewer: Read-only access to approved assets

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'editor', 'viewer');
    END IF;
END $$;

COMMENT ON TYPE user_role IS 'Hierarchical roles for DAM access control';


-- ============================================================================
-- SECTION 2: Add Permission Fields to User Table
-- ============================================================================

-- Add role field (defaults to viewer for security)
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'viewer';

COMMENT ON COLUMN "user".role IS 'User role determining their permission level in the DAM';


-- Add permissions JSONB field for granular permission control
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}' NOT NULL;

COMMENT ON COLUMN "user".permissions IS 'Granular permissions object for fine-grained access control';


-- Add team member reference for staff association
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS team_member_id uuid;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_team_member_id_team_members_id_fk'
    ) THEN
        ALTER TABLE "user"
        ADD CONSTRAINT user_team_member_id_team_members_id_fk
        FOREIGN KEY (team_member_id)
        REFERENCES team_members(id)
        ON DELETE SET NULL;
    END IF;
END $$;

COMMENT ON COLUMN "user".team_member_id IS 'Links user account to a team member profile for staff users';


-- Add active status flag
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

COMMENT ON COLUMN "user".is_active IS 'Whether the user account is currently active (can be deactivated without deletion)';


-- Keep dam_access for backward compatibility (already exists, just add comment)
COMMENT ON COLUMN "user".dam_access IS 'LEGACY: Kept for backward compatibility. Use role and permissions instead.';


-- ============================================================================
-- SECTION 3: Create Permission Audit Table
-- ============================================================================
-- Tracks all permission and role changes for compliance and debugging

CREATE TABLE IF NOT EXISTS permission_audit (
    id serial PRIMARY KEY,

    -- Who was affected by this change
    user_id text NOT NULL,

    -- Who made this change (admin/super_admin)
    changed_by text NOT NULL,

    -- Type of action performed
    action text NOT NULL,

    -- Change details (stored as JSONB for flexibility)
    old_value jsonb,
    new_value jsonb,

    -- Optional explanation for the change
    reason text,

    -- When the change occurred
    timestamp timestamp DEFAULT now() NOT NULL,

    -- Foreign key constraints
    CONSTRAINT permission_audit_user_id_user_id_fk
        FOREIGN KEY (user_id)
        REFERENCES "user"(id)
        ON DELETE CASCADE,

    CONSTRAINT permission_audit_changed_by_user_id_fk
        FOREIGN KEY (changed_by)
        REFERENCES "user"(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE permission_audit IS 'Audit log for all permission and role changes';
COMMENT ON COLUMN permission_audit.action IS 'Type of change: role_changed, permission_granted, permission_revoked, user_activated, user_deactivated';
COMMENT ON COLUMN permission_audit.old_value IS 'State before the change';
COMMENT ON COLUMN permission_audit.new_value IS 'State after the change';
COMMENT ON COLUMN permission_audit.reason IS 'Optional explanation for why the change was made';


-- ============================================================================
-- SECTION 4: Add Asset Modification Tracking
-- ============================================================================
-- Track who uploaded and modified assets for audit trail

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS uploaded_by text;

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS modified_by text;

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS modified_at timestamp;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'assets_uploaded_by_user_id_fk'
    ) THEN
        ALTER TABLE assets
        ADD CONSTRAINT assets_uploaded_by_user_id_fk
        FOREIGN KEY (uploaded_by)
        REFERENCES "user"(id)
        ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'assets_modified_by_user_id_fk'
    ) THEN
        ALTER TABLE assets
        ADD CONSTRAINT assets_modified_by_user_id_fk
        FOREIGN KEY (modified_by)
        REFERENCES "user"(id)
        ON DELETE SET NULL;
    END IF;
END $$;

COMMENT ON COLUMN assets.uploaded_by IS 'User ID of the person who uploaded this asset';
COMMENT ON COLUMN assets.modified_by IS 'User ID of the person who last modified this asset';
COMMENT ON COLUMN assets.modified_at IS 'Timestamp of last modification';


-- ============================================================================
-- SECTION 5: Create Performance Indexes
-- ============================================================================
-- Indexes to optimize common queries for the permission system

-- Index on user role for filtering by role
CREATE INDEX IF NOT EXISTS user_role_idx ON "user" USING btree (role);

-- Index on user active status for filtering active users
CREATE INDEX IF NOT EXISTS user_is_active_idx ON "user" USING btree (is_active);

-- Index on team member ID for staff lookups
CREATE INDEX IF NOT EXISTS user_team_member_id_idx ON "user" USING btree (team_member_id)
WHERE team_member_id IS NOT NULL;

-- Composite index for common query pattern (active users by role)
CREATE INDEX IF NOT EXISTS user_active_role_idx ON "user" USING btree (is_active, role);

-- Indexes on permission_audit for audit log queries
CREATE INDEX IF NOT EXISTS permission_audit_user_id_idx ON permission_audit USING btree (user_id);
CREATE INDEX IF NOT EXISTS permission_audit_changed_by_idx ON permission_audit USING btree (changed_by);
CREATE INDEX IF NOT EXISTS permission_audit_timestamp_idx ON permission_audit USING btree (timestamp DESC);
CREATE INDEX IF NOT EXISTS permission_audit_action_idx ON permission_audit USING btree (action);

-- Indexes on assets for audit trail queries
CREATE INDEX IF NOT EXISTS assets_uploaded_by_idx ON assets USING btree (uploaded_by);
CREATE INDEX IF NOT EXISTS assets_modified_by_idx ON assets USING btree (modified_by);
CREATE INDEX IF NOT EXISTS assets_modified_at_idx ON assets USING btree (modified_at DESC);


-- ============================================================================
-- SECTION 6: Set Default Permissions for Existing Roles
-- ============================================================================
-- Update permissions JSONB with sensible defaults based on role

-- Note: This section is intentionally commented out to prevent automatic
-- permission assignment. Run the separate data migration script
-- (migrate-existing-users.sql) to migrate existing user data.

/*
UPDATE "user" SET permissions = jsonb_build_object(
    'assets', jsonb_build_object(
        'view', true,
        'upload', true,
        'edit', true,
        'delete', true,
        'download', true
    ),
    'tags', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'delete', true
    ),
    'collections', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'delete', true
    ),
    'users', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'delete', true,
        'manage_permissions', true
    )
) WHERE role IN ('super_admin', 'admin');
*/

COMMIT;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Next steps:
-- 1. Run this migration: psql $DATABASE_URL -f migrations/add-permissions-system.sql
-- 2. Run data migration: psql $DATABASE_URL -f migrations/migrate-existing-users.sql
-- 3. Test the changes with existing users
-- 4. Update application code to use new permission system
-- 5. Plan deprecation timeline for dam_access field
-- ============================================================================
