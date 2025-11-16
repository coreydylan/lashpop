import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { permissionAudit } from "@/db/schema/permission_audit"
import { user as userSchema } from "@/db/schema/auth_user"
import { eq, and, gte, lte, desc } from "drizzle-orm"
import {
  requireRole,
  UnauthorizedError,
  ForbiddenError
} from "@/lib/server/dam-auth"

/**
 * GET - Fetch permission audit logs
 * Requires: admin role or higher
 *
 * Query parameters:
 * - userId: Filter by affected user ID
 * - changedBy: Filter by admin who made the change
 * - action: Filter by action type (e.g., 'role_changed', 'permission_granted')
 * - startDate: Filter by start date (ISO 8601 string)
 * - endDate: Filter by end date (ISO 8601 string)
 * - limit: Max number of results (default: 50, max: 500)
 * - offset: Number of results to skip (default: 0)
 *
 * Returns: Paginated audit log entries with user names
 */
export async function GET(req: NextRequest) {
  try {
    // Require admin role or higher
    await requireRole('admin')

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const changedBy = searchParams.get('changedBy')
    const action = searchParams.get('action')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')

    const db = getDb()

    // Build where conditions
    const conditions: any[] = []

    if (userId) {
      conditions.push(eq(permissionAudit.userId, userId))
    }

    if (changedBy) {
      conditions.push(eq(permissionAudit.changedBy, changedBy))
    }

    if (action) {
      conditions.push(eq(permissionAudit.action, action))
    }

    if (startDate) {
      try {
        const start = new Date(startDate)
        conditions.push(gte(permissionAudit.timestamp, start))
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid startDate format. Use ISO 8601 (e.g., 2025-01-01T00:00:00Z)" },
          { status: 400 }
        )
      }
    }

    if (endDate) {
      try {
        const end = new Date(endDate)
        conditions.push(lte(permissionAudit.timestamp, end))
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid endDate format. Use ISO 8601 (e.g., 2025-01-01T23:59:59Z)" },
          { status: 400 }
        )
      }
    }

    // Query audit logs with affected user info
    const auditLogs = await db
      .select({
        id: permissionAudit.id,
        userId: permissionAudit.userId,
        changedBy: permissionAudit.changedBy,
        action: permissionAudit.action,
        oldValue: permissionAudit.oldValue,
        newValue: permissionAudit.newValue,
        reason: permissionAudit.reason,
        timestamp: permissionAudit.timestamp,
        // Join affected user info
        affectedUserName: userSchema.name,
        affectedUserEmail: userSchema.email,
        affectedUserPhone: userSchema.phoneNumber,
      })
      .from(permissionAudit)
      // Join to get affected user info
      .leftJoin(userSchema, eq(permissionAudit.userId, userSchema.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(permissionAudit.timestamp))
      .limit(limit)
      .offset(offset)

    // Fetch admin user info in a second pass for the "changedBy" field
    // This is necessary because Drizzle doesn't easily support joining the same table twice
    const changedByIds = [...new Set(auditLogs.map(log => log.changedBy))]

    const adminUsersMap = new Map<string, { name: string | null; email: string | null; phone: string | null }>()

    if (changedByIds.length > 0) {
      const allAdminUsers = await Promise.all(
        changedByIds.map(async (id) => {
          const result = await db
            .select({
              id: userSchema.id,
              name: userSchema.name,
              email: userSchema.email,
              phone: userSchema.phoneNumber,
            })
            .from(userSchema)
            .where(eq(userSchema.id, id))
            .limit(1)
          return result[0]
        })
      )

      // Build admin user map
      allAdminUsers.forEach(user => {
        if (user) {
          adminUsersMap.set(user.id, {
            name: user.name,
            email: user.email,
            phone: user.phone
          })
        }
      })
    }

    // Enhance audit logs with admin user info
    const enhancedLogs = auditLogs.map(log => {
      const adminInfo = adminUsersMap.get(log.changedBy)
      return {
        ...log,
        changedByName: adminInfo?.name || null,
        changedByEmail: adminInfo?.email || null,
        changedByPhone: adminInfo?.phone || null,
      }
    })

    // Get total count for pagination (optional, can be expensive for large datasets)
    const countResult = await db
      .select({ count: permissionAudit.id })
      .from(permissionAudit)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    const total = countResult.length

    return NextResponse.json({
      logs: enhancedLogs,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    console.error("Error fetching audit logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    )
  }
}
