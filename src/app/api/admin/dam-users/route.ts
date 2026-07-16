import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { executeDatabaseBatch, getDb } from '@/db'
import { user as userSchema } from '@/db/schema/auth_user'
import { requireAdminApi, isAdminRole, type AdminRole } from '@/lib/admin/auth'

export async function GET() {
  const auth = await requireAdminApi(['owner'])
  if (auth instanceof NextResponse) return auth

  try {
    const db = getDb()
    const users = await db
      .select({
        id: userSchema.id,
        phoneNumber: userSchema.phoneNumber,
        email: userSchema.email,
        name: userSchema.name,
        damAccess: userSchema.damAccess,
        adminRole: userSchema.adminRole,
        createdAt: userSchema.createdAt,
      })
      .from(userSchema)
      .orderBy(desc(userSchema.createdAt))

    return NextResponse.json({
      users: users.map((user) => ({
        ...user,
        adminRole: isAdminRole(user.adminRole) ? user.adminRole : user.adminRole == null && user.damAccess ? 'owner' : null,
      })),
      currentUserId: auth.userId,
    })
  } catch (error) {
    console.error('Error fetching admin users:', error)
    return NextResponse.json({ error: 'Failed to fetch admin users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(['owner'])
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json() as { userId?: unknown; adminRole?: unknown }
    const userId = typeof body.userId === 'string' ? body.userId : null
    const role: AdminRole | null = body.adminRole === null
      ? null
      : isAdminRole(body.adminRole)
        ? body.adminRole
        : null

    if (!userId || (body.adminRole !== null && !isAdminRole(body.adminRole))) {
      return NextResponse.json({ error: 'userId and a valid adminRole are required' }, { status: 400 })
    }
    if (userId === auth.userId && role !== 'owner') {
      return NextResponse.json({ error: 'You cannot remove or reduce your own owner access' }, { status: 400 })
    }

    const db = getDb()
    const [target] = await db
      .select({ adminRole: userSchema.adminRole, damAccess: userSchema.damAccess })
      .from(userSchema)
      .where(eq(userSchema.id, userId))
      .limit(1)

    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const previousRole: AdminRole | null = isAdminRole(target.adminRole)
      ? target.adminRole
      : target.adminRole == null && target.damAccess
        ? 'owner'
        : null

    const now = Date.now()
    const diff = JSON.stringify({ before: { role: previousRole }, after: { role } })
    const results = await executeDatabaseBatch([
      {
        sql: `UPDATE "user"
              SET admin_role = ?, dam_access = ?, updated_at = ?
              WHERE id = ?
                AND (
                  ? = 'owner'
                  OR COALESCE(admin_role, CASE WHEN dam_access = 1 THEN 'owner' ELSE NULL END) <> 'owner'
                  OR EXISTS (
                    SELECT 1 FROM "user" other
                    WHERE other.id <> ?
                      AND COALESCE(other.admin_role, CASE WHEN other.dam_access = 1 THEN 'owner' ELSE NULL END) = 'owner'
                  )
                )`,
        params: [role, role !== null, now, userId, role, userId],
        method: 'run',
      },
      {
        sql: `INSERT INTO admin_audit_log
              (id, actor_user_id, surface, action, target_type, target_id, diff, created_at)
              SELECT ?, ?, 'admin', 'access.role.update', 'user', ?, ?, ?
              WHERE changes() = 1`,
        params: [randomUUID(), auth.userId, userId, diff, now],
        method: 'run',
      },
      { sql: 'SELECT changes()', params: [], method: 'get' },
    ])

    if (results[2]?.rows?.[0] !== 1) {
      return NextResponse.json({ error: 'At least one owner must remain' }, { status: 409 })
    }

    return NextResponse.json({ success: true, adminRole: role })
  } catch (error) {
    console.error('Error updating admin role:', error)
    return NextResponse.json({ error: 'Failed to update admin role' }, { status: 500 })
  }
}
