import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { user as userSchema } from "@/db/schema/auth_user"
import { teamMembers } from "@/db/schema/team_members"
import { eq, desc, sql } from "drizzle-orm"
import {
  requireRole,
  logPermissionChange,
  UnauthorizedError,
  ForbiddenError,
  hasRole
} from "@/lib/server/dam-auth"
import { ROLE_HIERARCHY, type Role, type UserPermissions } from "@/types/permissions"

/**
 * GET - List all DAM users with permissions and team member info
 * Requires: admin role or higher
 * Returns: Users sorted by role hierarchy (desc) then name (asc)
 */
export async function GET(req: NextRequest) {
  try {
    // Require admin role or higher
    await requireRole('admin')

    const db = getDb()

    // Query users with optional team member join
    const users = await db
      .select({
        id: userSchema.id,
        phoneNumber: userSchema.phoneNumber,
        email: userSchema.email,
        name: userSchema.name,
        role: userSchema.role,
        permissions: userSchema.permissions,
        teamMemberId: userSchema.teamMemberId,
        isActive: userSchema.isActive,
        createdAt: userSchema.createdAt,
        updatedAt: userSchema.updatedAt,
        // Team member info (if linked)
        teamMemberName: teamMembers.name,
        teamMemberPhoto: teamMembers.imageUrl,
      })
      .from(userSchema)
      .leftJoin(teamMembers, eq(userSchema.teamMemberId, teamMembers.id))
      .orderBy(
        // Sort by role hierarchy (descending - highest first)
        desc(sql`CASE
          WHEN ${userSchema.role} = 'super_admin' THEN 3
          WHEN ${userSchema.role} = 'admin' THEN 2
          WHEN ${userSchema.role} = 'editor' THEN 1
          ELSE 0
        END`),
        // Then by name (ascending)
        userSchema.name
      )

    return NextResponse.json({ users })
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
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

/**
 * POST - Update user permissions, role, team member link, or active status
 * Requires: admin role (super_admin for certain actions)
 *
 * Actions:
 * - update_role: Change user role (super_admin only for super_admin role)
 * - update_permissions: Modify specific permissions
 * - link_team_member: Link/unlink team member
 * - toggle_active: Activate/deactivate user
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userId,
      action,
      role,
      permissions,
      teamMemberId,
      isActive,
      reason
    } = body

    // Validate required fields
    if (!userId || !action) {
      return NextResponse.json(
        { error: "userId and action are required" },
        { status: 400 }
      )
    }

    // Validate action type
    const validActions = ['update_role', 'update_permissions', 'link_team_member', 'toggle_active']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    // Get current user (the one making the change)
    const currentUser = await requireRole('admin')
    const db = getDb()

    // Fetch the target user's current state
    const targetUserResult = await db
      .select({
        id: userSchema.id,
        role: userSchema.role,
        permissions: userSchema.permissions,
        teamMemberId: userSchema.teamMemberId,
        isActive: userSchema.isActive,
        name: userSchema.name,
        email: userSchema.email,
        phoneNumber: userSchema.phoneNumber,
      })
      .from(userSchema)
      .where(eq(userSchema.id, userId))
      .limit(1)

    if (!targetUserResult || targetUserResult.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const targetUser = targetUserResult[0]

    // Handle different actions
    let updateData: any = { updatedAt: new Date() }
    let auditAction: string
    let oldValue: Record<string, any> | undefined
    let newValue: Record<string, any> | undefined

    switch (action) {
      case 'update_role':
        if (!role) {
          return NextResponse.json(
            { error: "role is required for update_role action" },
            { status: 400 }
          )
        }

        // Validate role value
        const validRoles: Role[] = ['viewer', 'editor', 'admin', 'super_admin']
        if (!validRoles.includes(role as Role)) {
          return NextResponse.json(
            { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
            { status: 400 }
          )
        }

        // Only super_admin can create or modify super_admin users
        if (role === 'super_admin' || targetUser.role === 'super_admin') {
          if (!hasRole(currentUser, 'super_admin')) {
            throw new ForbiddenError('Only super_admin can create or modify super_admin users')
          }
        }

        updateData.role = role
        auditAction = 'role_changed'
        oldValue = { role: targetUser.role }
        newValue = { role }
        break

      case 'update_permissions':
        if (!permissions || typeof permissions !== 'object') {
          return NextResponse.json(
            { error: "permissions object is required for update_permissions action" },
            { status: 400 }
          )
        }

        // Prevent modifying super_admin permissions without super_admin role
        if (targetUser.role === 'super_admin' && !hasRole(currentUser, 'super_admin')) {
          throw new ForbiddenError('Only super_admin can modify super_admin permissions')
        }

        updateData.permissions = permissions
        auditAction = 'permission_granted' // Or 'permission_revoked' - simplified here
        oldValue = { permissions: targetUser.permissions }
        newValue = { permissions }
        break

      case 'link_team_member':
        // teamMemberId can be null to unlink
        if (teamMemberId !== null && teamMemberId !== undefined) {
          // Verify team member exists
          const tmResult = await db
            .select({ id: teamMembers.id })
            .from(teamMembers)
            .where(eq(teamMembers.id, teamMemberId))
            .limit(1)

          if (!tmResult || tmResult.length === 0) {
            return NextResponse.json(
              { error: "Team member not found" },
              { status: 404 }
            )
          }
        }

        updateData.teamMemberId = teamMemberId || null
        auditAction = 'team_member_linked'
        oldValue = { teamMemberId: targetUser.teamMemberId }
        newValue = { teamMemberId: teamMemberId || null }
        break

      case 'toggle_active':
        if (typeof isActive !== 'boolean') {
          return NextResponse.json(
            { error: "isActive (boolean) is required for toggle_active action" },
            { status: 400 }
          )
        }

        // Prevent deactivating super_admin without super_admin role
        if (targetUser.role === 'super_admin' && !hasRole(currentUser, 'super_admin')) {
          throw new ForbiddenError('Only super_admin can deactivate super_admin users')
        }

        updateData.isActive = isActive
        auditAction = isActive ? 'user_activated' : 'user_deactivated'
        oldValue = { isActive: targetUser.isActive }
        newValue = { isActive }
        break

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

    // Update the user
    await db
      .update(userSchema)
      .set(updateData)
      .where(eq(userSchema.id, userId))

    // Log the permission change
    await logPermissionChange({
      userId,
      changedBy: currentUser.id,
      action: auditAction,
      oldValue,
      newValue,
      reason
    })

    // Fetch and return the updated user
    const updatedUser = await db
      .select({
        id: userSchema.id,
        phoneNumber: userSchema.phoneNumber,
        email: userSchema.email,
        name: userSchema.name,
        role: userSchema.role,
        permissions: userSchema.permissions,
        teamMemberId: userSchema.teamMemberId,
        isActive: userSchema.isActive,
        createdAt: userSchema.createdAt,
        updatedAt: userSchema.updatedAt,
        teamMemberName: teamMembers.name,
        teamMemberPhoto: teamMembers.imageUrl,
      })
      .from(userSchema)
      .leftJoin(teamMembers, eq(userSchema.teamMemberId, teamMembers.id))
      .where(eq(userSchema.id, userId))
      .limit(1)

    return NextResponse.json({
      success: true,
      user: updatedUser[0]
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
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}
