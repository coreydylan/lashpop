# Database Migrations

This directory contains manual SQL migration scripts for the permission system.

## Files

### 1. `add-permissions-system.sql`
**Purpose**: Creates the schema for the role-based permission system

**What it does**:
- Creates `user_role` enum type
- Adds `role`, `permissions`, `team_member_id`, `is_active` to user table
- Creates `permission_audit` table for audit logging
- Adds `uploaded_by`, `modified_by`, `modified_at` to assets table
- Creates performance indexes

**Run this first**: This must be run before the data migration.

```bash
psql $DATABASE_URL -f migrations/add-permissions-system.sql
```

### 2. `migrate-existing-users.sql`
**Purpose**: Migrates existing user data to the new permission system

**What it does**:
- Converts `damAccess=true` users to `admin` role with full permissions
- Converts `damAccess=false/null` users to `viewer` role with read-only permissions
- Creates audit log entries for all migrations
- Validates migration success

**Run this second**: After the schema migration completes.

```bash
psql $DATABASE_URL -f migrations/migrate-existing-users.sql
```

### 3. `rollback-permissions-system.sql`
**Purpose**: Reverses all permission system changes

**What it does**:
- Drops all indexes
- Drops `permission_audit` table
- Removes all new columns from user and assets tables
- Drops `user_role` enum type
- Restores database to pre-migration state

**Use only if needed**: This is your safety net if something goes wrong.

```bash
# WARNING: This deletes all permission data!
psql $DATABASE_URL -f migrations/rollback-permissions-system.sql
```

## Migration Process

### Quick Start

```bash
# 1. Backup your database (CRITICAL!)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run schema migration
psql $DATABASE_URL -f migrations/add-permissions-system.sql

# 3. Run data migration
psql $DATABASE_URL -f migrations/migrate-existing-users.sql

# 4. Verify migration succeeded
psql $DATABASE_URL -c "SELECT role, COUNT(*) FROM \"user\" GROUP BY role;"
```

### Detailed Instructions

See `/docs/PERMISSION_MIGRATION.md` for comprehensive migration guide including:
- Pre-migration checklist
- Testing procedures
- Rollback procedures
- Common issues and solutions
- Post-migration tasks

## Important Notes

1. **Always backup first**: These migrations modify your database schema and data
2. **Run in order**: Schema migration must run before data migration
3. **Test in staging**: If possible, test the migration in a staging environment first
4. **Review the guide**: Read `/docs/PERMISSION_MIGRATION.md` before running migrations
5. **Keep damAccess**: The legacy field is preserved for backward compatibility

## Using with Drizzle ORM

If you're using Drizzle ORM, the schema files have already been updated:
- `/src/db/schema/auth_user.ts`
- `/src/db/schema/assets.ts`
- `/src/db/schema/permission_audit.ts`

You can also generate Drizzle migrations:

```bash
# Generate migration from schema files
npm run db:generate

# Run Drizzle migrations
npm run db:migrate
```

Note: The manual SQL scripts in this folder provide more control and detailed comments. Use whichever approach fits your workflow.

## Rollback

If you need to rollback the migration:

```bash
# Option 1: Restore from backup (safest)
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# Option 2: Run rollback script
psql $DATABASE_URL -f migrations/rollback-permissions-system.sql
```

## Support

For issues or questions, see:
- `/docs/PERMISSION_MIGRATION.md` - Comprehensive migration guide
- Common Issues section in the migration guide
- Permission audit logs: `SELECT * FROM permission_audit ORDER BY timestamp DESC;`
