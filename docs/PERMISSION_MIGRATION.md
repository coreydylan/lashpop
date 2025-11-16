# Permission System Migration Guide

This guide provides step-by-step instructions for migrating your Digital Asset Management (DAM) system from the legacy `damAccess` boolean field to a comprehensive role-based permission system.

## Table of Contents

- [Overview](#overview)
- [What's Changing](#whats-changing)
- [Pre-Migration Checklist](#pre-migration-checklist)
- [Migration Steps](#migration-steps)
- [Testing Checklist](#testing-checklist)
- [Rollback Procedure](#rollback-procedure)
- [Post-Migration Tasks](#post-migration-tasks)
- [Common Issues and Solutions](#common-issues-and-solutions)
- [Deprecation Timeline](#deprecation-timeline)

## Overview

The new permission system replaces the simple `damAccess` boolean with a hierarchical role-based access control (RBAC) system that provides:

- **4 user roles**: Super Admin, Admin, Editor, Viewer
- **Granular permissions**: Fine-grained control over assets, tags, collections, and users
- **Audit logging**: Complete history of all permission changes
- **Asset tracking**: Track who uploaded and modified each asset
- **Active status**: Deactivate users without deletion

## What's Changing

### Database Schema Changes

#### User Table (`user`)
| Field | Type | Description | Migration |
|-------|------|-------------|-----------|
| `role` | enum | User's role (super_admin, admin, editor, viewer) | **NEW** |
| `permissions` | jsonb | Granular permissions object | **NEW** |
| `team_member_id` | uuid | Link to team member profile | **NEW** |
| `is_active` | boolean | Whether user account is active | **NEW** |
| `dam_access` | boolean | Legacy field | **KEPT** for backward compatibility |

#### Assets Table (`assets`)
| Field | Type | Description | Migration |
|-------|------|-------------|-----------|
| `uploaded_by` | text | User ID who uploaded the asset | **NEW** |
| `modified_by` | text | User ID who last modified | **NEW** |
| `modified_at` | timestamp | When last modified | **NEW** |

#### New Tables
- **`permission_audit`**: Logs all permission and role changes

### Migration Logic

The migration follows this logic:

```
damAccess = true  → role = 'admin', is_active = true, full permissions
damAccess = false → role = 'viewer', is_active = false, read-only permissions
damAccess = null  → role = 'viewer', is_active = false, read-only permissions
```

## Pre-Migration Checklist

### 1. Database Backup (CRITICAL!)

```bash
# Full database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lh backup_*.sql
```

### 2. Document Current State

```sql
-- Count users by dam_access status
SELECT
    dam_access,
    COUNT(*) as count
FROM "user"
GROUP BY dam_access;

-- List all users with dam_access = true (these will become admins)
SELECT id, name, phone_number, email, dam_access
FROM "user"
WHERE dam_access = true;
```

Save this output for comparison after migration.

### 3. Verify Prerequisites

- [ ] Database backup completed and verified
- [ ] Current user counts documented
- [ ] PostgreSQL version 12+ (for enum support)
- [ ] Application code updated to support new permission system
- [ ] Staging environment tested (if available)
- [ ] Maintenance window scheduled
- [ ] Team notified of migration

### 4. Review Schema Files

The TypeScript schema files have already been updated:
- `/src/db/schema/auth_user.ts` - User roles and permissions
- `/src/db/schema/assets.ts` - Asset modification tracking
- `/src/db/schema/permission_audit.ts` - Audit logging

## Migration Steps

### Step 1: Set Maintenance Mode (Optional)

If possible, put your application in maintenance mode to prevent changes during migration.

```bash
# Example: Set environment variable
export MAINTENANCE_MODE=true
```

### Step 2: Run Schema Migration

This creates the new columns, tables, and indexes.

```bash
# Method 1: Using psql directly
psql $DATABASE_URL -f migrations/add-permissions-system.sql

# Method 2: Using Docker (if database is in container)
docker exec -i your-db-container psql -U postgres -d your_database < migrations/add-permissions-system.sql
```

**Expected output:**
```
CREATE TYPE
ALTER TABLE
COMMENT
CREATE TABLE
...
CREATE INDEX
COMMIT
```

### Step 3: Run Data Migration

This migrates existing users from `damAccess` to roles and permissions.

```bash
# Run data migration
psql $DATABASE_URL -f migrations/migrate-existing-users.sql
```

**Expected output:**
```
NOTICE: =================================================================
NOTICE: Pre-Migration Statistics:
NOTICE: =================================================================
NOTICE: Total users: 42
NOTICE: Users with dam_access=true: 5
NOTICE: Users with dam_access=false or NULL: 37
...
NOTICE: Migration completed successfully!
```

### Step 4: Verify Migration

```sql
-- Check role distribution
SELECT role, COUNT(*) as count
FROM "user"
WHERE id != 'system-migration'
GROUP BY role;

-- Check active status distribution
SELECT is_active, COUNT(*) as count
FROM "user"
WHERE id != 'system-migration'
GROUP BY is_active;

-- Verify permission audit logs were created
SELECT COUNT(*) FROM permission_audit;

-- View recent audit entries
SELECT
    u.name,
    pa.action,
    pa.old_value->>'role' as old_role,
    pa.new_value->>'role' as new_role,
    pa.timestamp
FROM permission_audit pa
JOIN "user" u ON pa.user_id = u.id
ORDER BY pa.timestamp DESC
LIMIT 10;
```

### Step 5: Manually Promote Super Admins

The migration sets all `damAccess=true` users to `admin` role. You need to manually promote specific users to `super_admin`.

```sql
-- Promote a user to super_admin
UPDATE "user"
SET
    role = 'super_admin',
    permissions = jsonb_build_object(
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
    ),
    updated_at = now()
WHERE email = 'admin@example.com'; -- Replace with actual admin email

-- Log the manual promotion
INSERT INTO permission_audit (user_id, changed_by, action, old_value, new_value, reason)
SELECT
    id,
    id, -- Self-promotion
    'role_changed',
    jsonb_build_object('role', 'admin'),
    jsonb_build_object('role', 'super_admin'),
    'Manual promotion to super_admin during initial migration'
FROM "user"
WHERE email = 'admin@example.com';
```

### Step 6: Generate Drizzle Migration (Optional)

If using Drizzle ORM's migration tracking:

```bash
# Generate migration from schema
npm run db:generate

# This should create a new migration file in /drizzle folder
# The migration will be named something like: 0015_xxx_yyy.sql
```

### Step 7: Exit Maintenance Mode

```bash
# Remove maintenance mode
export MAINTENANCE_MODE=false
```

## Testing Checklist

After migration, verify the following:

### User Authentication & Roles
- [ ] Super admins can log in
- [ ] Admins can log in
- [ ] Editors can log in (if any)
- [ ] Viewers can log in
- [ ] Inactive users cannot access DAM

### Permission Enforcement
- [ ] Super admin can manage all users
- [ ] Admin can manage assets but not users
- [ ] Editor can upload/edit assets
- [ ] Viewer can only view/download assets
- [ ] Permission checks work in UI

### Asset Management
- [ ] Asset uploads are tracked with `uploaded_by`
- [ ] Asset edits update `modified_by` and `modified_at`
- [ ] Asset metadata shows who uploaded/modified

### Audit Logging
- [ ] Permission changes are logged
- [ ] Role changes are logged
- [ ] Audit log is queryable
- [ ] Audit log shows meaningful data

### Backward Compatibility
- [ ] `damAccess` field still exists
- [ ] Legacy code (if any) still functions
- [ ] No breaking changes to existing features

## Rollback Procedure

If you encounter critical issues, you can rollback the migration.

### When to Rollback

Consider rollback if:
- Permission checks are failing critically
- Data corruption is detected
- User access is completely broken
- Critical business operations are blocked

### Rollback Steps

**WARNING:** This will delete all role and permission data!

```bash
# 1. Restore from backup (safest option)
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# OR 2. Run rollback script (if no other changes were made)
psql $DATABASE_URL -f migrations/rollback-permissions-system.sql
```

### After Rollback

1. Verify users can access system with `damAccess` field
2. Investigate root cause of migration failure
3. Fix issues in staging environment
4. Plan re-migration when ready

## Post-Migration Tasks

### Immediate (Week 1)

1. **Monitor Application Logs**
   - Watch for permission-related errors
   - Check authentication issues
   - Monitor user complaints

2. **Verify Audit Trail**
   ```sql
   -- Check audit log growth
   SELECT
       DATE(timestamp) as date,
       COUNT(*) as changes
   FROM permission_audit
   GROUP BY DATE(timestamp)
   ORDER BY date DESC;
   ```

3. **User Communication**
   - Notify users of new permission system
   - Update documentation
   - Provide training if needed

### Short-term (Month 1)

1. **Code Cleanup**
   - Update frontend to use new permission checks
   - Remove legacy `damAccess` checks from codebase
   - Update API documentation

2. **Permission Refinement**
   - Review if role assignments are correct
   - Adjust permissions based on user feedback
   - Create custom permission sets if needed

3. **Performance Monitoring**
   - Monitor query performance with new indexes
   - Check if additional indexes are needed
   - Optimize slow queries

### Long-term (Month 3+)

1. **Deprecate `damAccess` Field**
   - Verify all code uses new permission system
   - Plan deprecation timeline
   - Create migration to remove `damAccess` column

2. **Advanced Features**
   - Implement permission groups/teams
   - Add time-limited permissions
   - Create permission templates

## Common Issues and Solutions

### Issue: Migration fails with "relation does not exist"

**Cause:** The schema migration wasn't run first.

**Solution:**
```bash
# Run schema migration first
psql $DATABASE_URL -f migrations/add-permissions-system.sql

# Then run data migration
psql $DATABASE_URL -f migrations/migrate-existing-users.sql
```

### Issue: All users are viewers

**Cause:** Data migration didn't run or failed silently.

**Solution:**
```sql
-- Check if migration ran
SELECT COUNT(*) FROM permission_audit WHERE changed_by = 'system-migration';

-- If 0, re-run data migration
psql $DATABASE_URL -f migrations/migrate-existing-users.sql
```

### Issue: Permission checks failing in application

**Cause:** Application code not updated to check new permission fields.

**Solution:**
- Update application code to read `role` and `permissions` fields
- Implement permission checking utilities
- Update middleware/guards

### Issue: Cannot find system-migration user

**Cause:** Expected behavior - this is created during migration.

**Solution:**
- The system-migration user is created automatically
- It's used for audit logging
- Can be safely deleted after migration if desired

### Issue: Slow queries after migration

**Cause:** Need to analyze tables for query planner.

**Solution:**
```sql
-- Analyze tables to update statistics
ANALYZE "user";
ANALYZE permission_audit;
ANALYZE assets;

-- Vacuum if needed
VACUUM ANALYZE "user";
```

### Issue: Want to change user's role after migration

**Solution:**
```sql
-- Update user role
UPDATE "user"
SET
    role = 'editor',
    permissions = (get appropriate permissions object),
    updated_at = now()
WHERE id = 'user-id';

-- Log the change
INSERT INTO permission_audit (user_id, changed_by, action, old_value, new_value, reason)
VALUES (
    'user-id',
    'admin-user-id',
    'role_changed',
    jsonb_build_object('role', 'viewer'),
    jsonb_build_object('role', 'editor'),
    'Promoted to editor for project work'
);
```

## Deprecation Timeline

### Phase 1: Dual Support (Current - Month 3)
- Both `damAccess` and `role`/`permissions` are maintained
- Application uses new permission system
- `damAccess` kept for backward compatibility

### Phase 2: Deprecation Warning (Month 3-6)
- Add deprecation warnings to code using `damAccess`
- Update all internal code to use new system
- Notify external API users if applicable

### Phase 3: Remove Legacy Field (Month 6+)
- Create migration to drop `damAccess` column
- Remove all references from codebase
- Update documentation

### Migration to Remove damAccess (Future)

```sql
-- When ready to completely remove damAccess
BEGIN;

-- Drop the column
ALTER TABLE "user" DROP COLUMN IF EXISTS dam_access;

-- Update comments
COMMENT ON TABLE "user" IS 'User authentication table with role-based permissions';

COMMIT;
```

## Support and Questions

If you encounter issues not covered in this guide:

1. Check the permission audit logs for clues
2. Review application logs for permission errors
3. Verify database state matches expected post-migration state
4. Contact the development team with specific error messages

## Additional Resources

- **Schema Files**: `/src/db/schema/`
- **Migration Files**: `/migrations/`
- **Permission Constants**: Check your application code for permission definitions
- **Drizzle Documentation**: https://orm.drizzle.team/docs/migrations

---

**Document Version**: 1.0
**Last Updated**: 2025-11-16
**Tested On**: PostgreSQL 14+
