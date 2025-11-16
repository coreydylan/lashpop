-- ============================================================================
-- Data Migration: Migrate Existing Users to Role-Based Permission System
-- Description: Converts damAccess boolean field to role-based permissions
-- Created: 2025-11-16
-- ============================================================================

-- This migration:
-- 1. Migrates users from damAccess boolean to role-based system
-- 2. Sets appropriate default permissions based on role
-- 3. Logs all migrations to permission_audit table
-- 4. Preserves damAccess field for backward compatibility

-- IMPORTANT: Run this AFTER running add-permissions-system.sql
-- IMPORTANT: Back up your database before running this script!

BEGIN;

-- ============================================================================
-- SECTION 1: Pre-Migration Validation
-- ============================================================================

DO $$
DECLARE
    total_users integer;
    users_with_dam_access integer;
    users_without_dam_access integer;
BEGIN
    SELECT COUNT(*) INTO total_users FROM "user";
    SELECT COUNT(*) INTO users_with_dam_access FROM "user" WHERE dam_access = true;
    SELECT COUNT(*) INTO users_without_dam_access FROM "user" WHERE dam_access = false OR dam_access IS NULL;

    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Pre-Migration Statistics:';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Total users: %', total_users;
    RAISE NOTICE 'Users with dam_access=true: %', users_with_dam_access;
    RAISE NOTICE 'Users with dam_access=false or NULL: %', users_without_dam_access;
    RAISE NOTICE '=================================================================';
END $$;


-- ============================================================================
-- SECTION 2: Create System User for Audit Logging
-- ============================================================================
-- We need a system user to attribute automated migrations

INSERT INTO "user" (id, name, role, is_active, created_at, updated_at)
VALUES (
    'system-migration',
    'System Migration',
    'super_admin',
    true,
    now(),
    now()
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- SECTION 3: Define Permission Templates
-- ============================================================================
-- Create a temporary function to generate permission objects

CREATE OR REPLACE FUNCTION get_permissions_for_role(user_role text)
RETURNS jsonb AS $$
BEGIN
    CASE user_role
        -- Super Admin: Full access to everything
        WHEN 'super_admin' THEN
            RETURN jsonb_build_object(
                'assets', jsonb_build_object(
                    'view', true,
                    'upload', true,
                    'edit', true,
                    'delete', true,
                    'download', true,
                    'viewMetadata', true
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
                    'delete', true,
                    'share', true
                ),
                'users', jsonb_build_object(
                    'view', true,
                    'create', true,
                    'edit', true,
                    'delete', true,
                    'manage_permissions', true
                ),
                'settings', jsonb_build_object(
                    'view', true,
                    'edit', true
                )
            );

        -- Admin: Full asset management, limited user management
        WHEN 'admin' THEN
            RETURN jsonb_build_object(
                'assets', jsonb_build_object(
                    'view', true,
                    'upload', true,
                    'edit', true,
                    'delete', true,
                    'download', true,
                    'viewMetadata', true
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
                    'delete', true,
                    'share', true
                ),
                'users', jsonb_build_object(
                    'view', true,
                    'create', false,
                    'edit', false,
                    'delete', false,
                    'manage_permissions', false
                ),
                'settings', jsonb_build_object(
                    'view', false,
                    'edit', false
                )
            );

        -- Editor: Can upload and edit assets, manage tags/collections
        WHEN 'editor' THEN
            RETURN jsonb_build_object(
                'assets', jsonb_build_object(
                    'view', true,
                    'upload', true,
                    'edit', true,
                    'delete', false,
                    'download', true,
                    'viewMetadata', true
                ),
                'tags', jsonb_build_object(
                    'view', true,
                    'create', true,
                    'edit', true,
                    'delete', false
                ),
                'collections', jsonb_build_object(
                    'view', true,
                    'create', true,
                    'edit', true,
                    'delete', false,
                    'share', false
                ),
                'users', jsonb_build_object(
                    'view', false,
                    'create', false,
                    'edit', false,
                    'delete', false,
                    'manage_permissions', false
                ),
                'settings', jsonb_build_object(
                    'view', false,
                    'edit', false
                )
            );

        -- Viewer: Read-only access
        WHEN 'viewer' THEN
            RETURN jsonb_build_object(
                'assets', jsonb_build_object(
                    'view', true,
                    'upload', false,
                    'edit', false,
                    'delete', false,
                    'download', true,
                    'viewMetadata', false
                ),
                'tags', jsonb_build_object(
                    'view', true,
                    'create', false,
                    'edit', false,
                    'delete', false
                ),
                'collections', jsonb_build_object(
                    'view', true,
                    'create', false,
                    'edit', false,
                    'delete', false,
                    'share', false
                ),
                'users', jsonb_build_object(
                    'view', false,
                    'create', false,
                    'edit', false,
                    'delete', false,
                    'manage_permissions', false
                ),
                'settings', jsonb_build_object(
                    'view', false,
                    'edit', false
                )
            );

        ELSE
            RETURN '{}';
    END CASE;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- SECTION 4: Migrate Users with dam_access = true → admin role
-- ============================================================================
-- Users who previously had DAM access become admins with full permissions

WITH updated_users AS (
    UPDATE "user"
    SET
        role = 'admin',
        permissions = get_permissions_for_role('admin'),
        is_active = true,
        updated_at = now()
    WHERE dam_access = true
        AND id != 'system-migration' -- Don't update system user
    RETURNING id, name, phone_number, email
)
INSERT INTO permission_audit (user_id, changed_by, action, old_value, new_value, reason, timestamp)
SELECT
    id,
    'system-migration',
    'role_changed',
    jsonb_build_object(
        'role', 'viewer',
        'dam_access', true,
        'is_active', false
    ),
    jsonb_build_object(
        'role', 'admin',
        'dam_access', true,
        'is_active', true,
        'permissions', get_permissions_for_role('admin')
    ),
    'Automatic migration from dam_access=true to admin role',
    now()
FROM updated_users;


-- ============================================================================
-- SECTION 5: Migrate Users with dam_access = false/NULL → viewer role
-- ============================================================================
-- Users without DAM access become inactive viewers

WITH updated_users AS (
    UPDATE "user"
    SET
        role = 'viewer',
        permissions = get_permissions_for_role('viewer'),
        is_active = COALESCE(dam_access, false), -- If dam_access was NULL, set inactive
        updated_at = now()
    WHERE (dam_access = false OR dam_access IS NULL)
        AND id != 'system-migration' -- Don't update system user
    RETURNING id, name, phone_number, email, dam_access
)
INSERT INTO permission_audit (user_id, changed_by, action, old_value, new_value, reason, timestamp)
SELECT
    id,
    'system-migration',
    'role_changed',
    jsonb_build_object(
        'role', 'viewer',
        'dam_access', COALESCE(dam_access, false),
        'is_active', false
    ),
    jsonb_build_object(
        'role', 'viewer',
        'dam_access', COALESCE(dam_access, false),
        'is_active', COALESCE(dam_access, false),
        'permissions', get_permissions_for_role('viewer')
    ),
    'Automatic migration from dam_access=false/null to viewer role',
    now()
FROM updated_users;


-- ============================================================================
-- SECTION 6: Post-Migration Validation
-- ============================================================================

DO $$
DECLARE
    total_users integer;
    super_admins integer;
    admins integer;
    editors integer;
    viewers integer;
    active_users integer;
    inactive_users integer;
    audit_entries integer;
BEGIN
    SELECT COUNT(*) INTO total_users FROM "user" WHERE id != 'system-migration';
    SELECT COUNT(*) INTO super_admins FROM "user" WHERE role = 'super_admin' AND id != 'system-migration';
    SELECT COUNT(*) INTO admins FROM "user" WHERE role = 'admin';
    SELECT COUNT(*) INTO editors FROM "user" WHERE role = 'editor';
    SELECT COUNT(*) INTO viewers FROM "user" WHERE role = 'viewer';
    SELECT COUNT(*) INTO active_users FROM "user" WHERE is_active = true AND id != 'system-migration';
    SELECT COUNT(*) INTO inactive_users FROM "user" WHERE is_active = false AND id != 'system-migration';
    SELECT COUNT(*) INTO audit_entries FROM permission_audit;

    RAISE NOTICE '';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Post-Migration Statistics:';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Total users (excluding system): %', total_users;
    RAISE NOTICE 'Super Admins: %', super_admins;
    RAISE NOTICE 'Admins: %', admins;
    RAISE NOTICE 'Editors: %', editors;
    RAISE NOTICE 'Viewers: %', viewers;
    RAISE NOTICE 'Active users: %', active_users;
    RAISE NOTICE 'Inactive users: %', inactive_users;
    RAISE NOTICE 'Audit log entries: %', audit_entries;
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Review migrated users in permission_audit table';
    RAISE NOTICE '2. Manually promote specific users to super_admin if needed';
    RAISE NOTICE '3. Test the application with migrated permissions';
    RAISE NOTICE '4. Monitor for any permission-related issues';
    RAISE NOTICE '=================================================================';
END $$;


-- ============================================================================
-- SECTION 7: Cleanup
-- ============================================================================
-- Remove temporary function
DROP FUNCTION IF EXISTS get_permissions_for_role(text);

COMMIT;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Review the permission_audit table to see all changes:
-- SELECT * FROM permission_audit ORDER BY timestamp DESC;
--
-- To manually promote a user to super_admin:
-- UPDATE "user" SET role = 'super_admin',
--   permissions = (see permission template above)
--   WHERE id = 'user-id-here';
-- ============================================================================
