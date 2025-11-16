# Permission System Migration - Quick Start

This is a condensed guide for experienced developers. For detailed instructions, see `/docs/PERMISSION_MIGRATION.md`.

## Prerequisites

- [ ] PostgreSQL 12+
- [ ] Database backup completed
- [ ] Application code updated for new permission system
- [ ] Database URL available as `$DATABASE_URL`

## Migration in 4 Steps

### 1. Backup Database

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Run Schema Migration

```bash
psql $DATABASE_URL -f migrations/add-permissions-system.sql
```

Creates:
- `user_role` enum
- New columns: `role`, `permissions`, `team_member_id`, `is_active`
- `permission_audit` table
- Asset tracking columns
- Performance indexes

### 3. Run Data Migration

```bash
psql $DATABASE_URL -f migrations/migrate-existing-users.sql
```

Converts:
- `damAccess=true` → `role='admin'`, `is_active=true`
- `damAccess=false/null` → `role='viewer'`, `is_active=false`

### 4. Promote Super Admins

```sql
UPDATE "user"
SET role = 'super_admin'
WHERE email = 'your-admin@example.com';
```

## Verification

```sql
-- Check role distribution
SELECT role, COUNT(*) FROM "user" GROUP BY role;

-- Check active users
SELECT is_active, COUNT(*) FROM "user" GROUP BY is_active;

-- View audit log
SELECT * FROM permission_audit ORDER BY timestamp DESC LIMIT 10;
```

## Rollback (if needed)

```bash
# Option 1: Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# Option 2: Run rollback script
psql $DATABASE_URL -f migrations/rollback-permissions-system.sql
```

## Common Commands

```bash
# Connect to database
psql $DATABASE_URL

# Check migration status
psql $DATABASE_URL -c "SELECT COUNT(*) FROM permission_audit;"

# View users by role
psql $DATABASE_URL -c "SELECT role, is_active, COUNT(*) FROM \"user\" GROUP BY role, is_active;"

# Generate Drizzle migration (optional)
npm run db:generate
```

## Roles & Permissions

| Role | Assets | Tags/Collections | Users | Settings |
|------|--------|------------------|-------|----------|
| **super_admin** | Full | Full | Full | Full |
| **admin** | Full | Full | View only | None |
| **editor** | Edit (no delete) | Edit (no delete) | None | None |
| **viewer** | View/Download | View only | None | None |

## Need Help?

See `/docs/PERMISSION_MIGRATION.md` for:
- Detailed migration guide
- Testing checklist
- Common issues and solutions
- Post-migration tasks
