-- ============================================================================
-- Rollback Migration: Remove Role-Based Permission System
-- Description: Reverses all changes made by add-permissions-system.sql
-- Created: 2025-11-16
-- ============================================================================

-- WARNING: This will permanently delete:
-- - All role and permission data
-- - All permission audit logs
-- - All asset modification tracking data
--
-- The dam_access field will be preserved for backward compatibility
--
-- IMPORTANT: Back up your database before running this script!
-- IMPORTANT: This cannot be undone without restoring from backup!

BEGIN;

-- ============================================================================
-- SECTION 1: Pre-Rollback Confirmation
-- ============================================================================

DO $$
DECLARE
    total_users integer;
    total_audit_entries integer;
BEGIN
    SELECT COUNT(*) INTO total_users FROM "user";
    SELECT COUNT(*) INTO total_audit_entries FROM permission_audit;

    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'PRE-ROLLBACK WARNING';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'This will delete:';
    RAISE NOTICE '- Role data for % users', total_users;
    RAISE NOTICE '- % permission audit log entries', total_audit_entries;
    RAISE NOTICE '- Asset modification tracking data';
    RAISE NOTICE '';
    RAISE NOTICE 'The dam_access field will be preserved.';
    RAISE NOTICE '';
    RAISE NOTICE 'Press Ctrl+C now to cancel if you are not sure!';
    RAISE NOTICE '=================================================================';

    -- Give time to cancel
    PERFORM pg_sleep(5);
END $$;


-- ============================================================================
-- SECTION 2: Back Up Data Before Deletion (Optional)
-- ============================================================================
-- Uncomment these lines to create backup tables before rollback

/*
CREATE TABLE user_backup_before_rollback AS
SELECT id, role, permissions, team_member_id, is_active, updated_at
FROM "user";

CREATE TABLE permission_audit_backup AS
SELECT * FROM permission_audit;

CREATE TABLE assets_backup_modification_tracking AS
SELECT id, uploaded_by, modified_by, modified_at
FROM assets;

RAISE NOTICE 'Backup tables created: user_backup_before_rollback, permission_audit_backup, assets_backup_modification_tracking';
*/


-- ============================================================================
-- SECTION 3: Drop Indexes
-- ============================================================================
-- Remove all performance indexes created for the permission system

DROP INDEX IF EXISTS user_role_idx;
DROP INDEX IF EXISTS user_is_active_idx;
DROP INDEX IF EXISTS user_team_member_id_idx;
DROP INDEX IF EXISTS user_active_role_idx;

DROP INDEX IF EXISTS permission_audit_user_id_idx;
DROP INDEX IF EXISTS permission_audit_changed_by_idx;
DROP INDEX IF EXISTS permission_audit_timestamp_idx;
DROP INDEX IF EXISTS permission_audit_action_idx;

DROP INDEX IF EXISTS assets_uploaded_by_idx;
DROP INDEX IF EXISTS assets_modified_by_idx;
DROP INDEX IF EXISTS assets_modified_at_idx;

RAISE NOTICE 'Indexes dropped successfully';


-- ============================================================================
-- SECTION 4: Drop Permission Audit Table
-- ============================================================================
-- Remove the entire permission audit log table

DROP TABLE IF EXISTS permission_audit CASCADE;

RAISE NOTICE 'permission_audit table dropped';


-- ============================================================================
-- SECTION 5: Remove Asset Modification Tracking Columns
-- ============================================================================
-- Remove uploaded_by, modified_by, and modified_at from assets table

ALTER TABLE assets DROP COLUMN IF EXISTS uploaded_by;
ALTER TABLE assets DROP COLUMN IF EXISTS modified_by;
ALTER TABLE assets DROP COLUMN IF EXISTS modified_at;

RAISE NOTICE 'Asset modification tracking columns removed';


-- ============================================================================
-- SECTION 6: Remove User Permission Columns
-- ============================================================================
-- Remove role, permissions, team_member_id, and is_active from user table

ALTER TABLE "user" DROP COLUMN IF EXISTS is_active;
ALTER TABLE "user" DROP COLUMN IF EXISTS team_member_id;
ALTER TABLE "user" DROP COLUMN IF EXISTS permissions;
ALTER TABLE "user" DROP COLUMN IF EXISTS role;

RAISE NOTICE 'User permission columns removed';


-- ============================================================================
-- SECTION 7: Drop User Role Enum
-- ============================================================================
-- Remove the user_role enum type

DROP TYPE IF EXISTS user_role CASCADE;

RAISE NOTICE 'user_role enum type dropped';


-- ============================================================================
-- SECTION 8: Remove System Migration User (Optional)
-- ============================================================================
-- Remove the system user created for migration if it exists

DELETE FROM "user" WHERE id = 'system-migration';

RAISE NOTICE 'System migration user removed';


-- ============================================================================
-- SECTION 9: Post-Rollback Validation
-- ============================================================================

DO $$
DECLARE
    total_users integer;
    users_with_dam_access integer;
    role_column_exists boolean;
    audit_table_exists boolean;
BEGIN
    SELECT COUNT(*) INTO total_users FROM "user";
    SELECT COUNT(*) INTO users_with_dam_access FROM "user" WHERE dam_access = true;

    -- Check if role column still exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user' AND column_name = 'role'
    ) INTO role_column_exists;

    -- Check if permission_audit table still exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'permission_audit'
    ) INTO audit_table_exists;

    RAISE NOTICE '';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Post-Rollback Validation:';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Total users remaining: %', total_users;
    RAISE NOTICE 'Users with dam_access=true: %', users_with_dam_access;
    RAISE NOTICE '';
    RAISE NOTICE 'Role column exists: %', role_column_exists;
    RAISE NOTICE 'Permission audit table exists: %', audit_table_exists;
    RAISE NOTICE '';

    IF NOT role_column_exists AND NOT audit_table_exists THEN
        RAISE NOTICE 'SUCCESS: Rollback completed successfully!';
        RAISE NOTICE 'The database has been restored to pre-migration state.';
        RAISE NOTICE 'The dam_access field has been preserved.';
    ELSE
        RAISE WARNING 'INCOMPLETE: Some permission system objects still exist.';
        RAISE WARNING 'You may need to run this rollback script again.';
    END IF;

    RAISE NOTICE '=================================================================';
END $$;


COMMIT;

-- ============================================================================
-- Rollback Complete
-- ============================================================================
-- The database has been restored to the state before the permission system
-- migration. The dam_access field remains intact for backward compatibility.
--
-- Next steps:
-- 1. Verify that your application still works with dam_access field
-- 2. Review any backup tables if you created them
-- 3. Drop backup tables when you're confident the rollback was successful:
--    DROP TABLE IF EXISTS user_backup_before_rollback;
--    DROP TABLE IF EXISTS permission_audit_backup;
--    DROP TABLE IF EXISTS assets_backup_modification_tracking;
-- ============================================================================
