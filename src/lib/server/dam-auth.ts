/**
 * DAM Authentication Middleware and Permission Helpers
 *
 * Provides authentication and authorization functions for the Digital Asset Management system.
 * These functions validate sessions, check roles and permissions, and enforce access control.
 */

import { cookies } from 'next/headers'
import { getDb } from '@/db'
import { user as userSchema } from '@/db/schema/auth_user'
import { session as sessionSchema } from '@/db/schema/auth_session'
import { tagCategories } from '@/db/schema/tag_categories'
import { permissionAudit } from '@/db/schema/permission_audit'
import { eq, and, gt } from 'drizzle-orm'
import type {
  AuthenticatedUser,
  Role,
  UserPermissions
} from '@/types/permissions'
import { ROLE_HIERARCHY } from '@/types/permissions'

/**
 * Custom error class for authentication failures
 */
export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized - Authentication required') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

/**
 * Custom error class for authorization/permission failures
 */
export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden - Insufficient permissions') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

/**
 * Validates session token and returns authenticated user
 *
 * @throws {UnauthorizedError} If not authenticated or session expired
 * @returns Authenticated user object with id, role, permissions, teamMemberId, isActive
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const cookieStore = await cookies()
  const authToken = cookieStore.get('auth_token')

  if (!authToken) {
    throw new UnauthorizedError('No authentication token provided')
  }

  const db = getDb()
  const result = await db
    .select({
      id: userSchema.id,
      role: userSchema.role,
      permissions: userSchema.permissions,
      teamMemberId: userSchema.teamMemberId,
      isActive: userSchema.isActive,
      phone: userSchema.phoneNumber,
      email: userSchema.email,
      name: userSchema.name
    })
    .from(sessionSchema)
    .innerJoin(userSchema, eq(sessionSchema.userId, userSchema.id))
    .where(
      and(
        eq(sessionSchema.token, authToken.value),
        gt(sessionSchema.expiresAt, new Date())
      )
    )
    .limit(1)

  if (!result || result.length === 0) {
    throw new UnauthorizedError('Invalid or expired session')
  }

  const userData = result[0]

  // Ensure permissions is properly typed
  const permissions = (userData.permissions || {}) as UserPermissions

  return {
    id: userData.id,
    role: (userData.role || 'viewer') as Role,
    permissions,
    teamMemberId: userData.teamMemberId || null,
    isActive: userData.isActive ?? true,
    phone: userData.phone,
    email: userData.email,
    name: userData.name
  }
}

/**
 * Ensures user has minimum role level
 *
 * Role hierarchy: viewer < editor < admin < super_admin
 *
 * @param minRole - Minimum required role
 * @throws {UnauthorizedError} If not authenticated
 * @throws {ForbiddenError} If user doesn't have sufficient role or is inactive
 * @returns Authenticated user object
 */
export async function requireRole(minRole: Role): Promise<AuthenticatedUser> {
  const user = await requireAuth()

  // Check if user is active
  if (!user.isActive) {
    throw new ForbiddenError('User account is inactive')
  }

  // Check role hierarchy
  const userRoleLevel = ROLE_HIERARCHY[user.role]
  const requiredRoleLevel = ROLE_HIERARCHY[minRole]

  if (userRoleLevel < requiredRoleLevel) {
    throw new ForbiddenError(
      `Insufficient role - ${minRole} or higher required, user has ${user.role}`
    )
  }

  return user
}

/**
 * Check if user has specific permission
 *
 * Admins and super_admins have all permissions by default.
 *
 * @param permission - Permission key to check
 * @throws {UnauthorizedError} If not authenticated
 * @throws {ForbiddenError} If permission denied or user is inactive
 * @returns Authenticated user object
 */
export async function requirePermission(
  permission: keyof Omit<UserPermissions, 'allowedCollections'>
): Promise<AuthenticatedUser> {
  const user = await requireAuth()

  // Check if user is active
  if (!user.isActive) {
    throw new ForbiddenError('User account is inactive')
  }

  // Admins and super_admins have all permissions by default
  if (user.role === 'admin' || user.role === 'super_admin') {
    return user
  }

  // Check if user has the specific permission
  if (user.permissions[permission] !== true) {
    throw new ForbiddenError(
      `Permission denied - ${String(permission)} permission required`
    )
  }

  return user
}

/**
 * Check if user has access to a specific collection
 *
 * @param collectionId - The collection (tag category) ID to check
 * @param level - Access level required: 'view' or 'edit'
 * @throws {UnauthorizedError} If not authenticated
 * @throws {ForbiddenError} If access denied or user is inactive
 * @returns Authenticated user object
 */
export async function requireCollectionAccess(
  collectionId: string,
  level: 'view' | 'edit'
): Promise<AuthenticatedUser> {
  const user = await requireAuth()

  // Check if user is active
  if (!user.isActive) {
    throw new ForbiddenError('User account is inactive')
  }

  // Admins and super_admins have access to all collections
  if (user.role === 'admin' || user.role === 'super_admin') {
    return user
  }

  // Check if user has access to all collections via permissions
  const { allowedCollections } = user.permissions
  if (
    allowedCollections &&
    allowedCollections.length === 1 &&
    allowedCollections[0] === 'all'
  ) {
    return user
  }

  // Query the collection (tag category) to check permissions
  const db = getDb()
  const collection = await db
    .select({
      permissions: tagCategories.permissions
    })
    .from(tagCategories)
    .where(eq(tagCategories.id, collectionId))
    .limit(1)

  if (!collection || collection.length === 0) {
    throw new ForbiddenError('Collection not found')
  }

  const collectionPerms = collection[0].permissions as Record<
    string,
    { viewers?: string[]; editors?: string[] }
  > | null

  // If no specific permissions set on collection, check user's allowedCollections
  if (!collectionPerms) {
    if (
      allowedCollections &&
      (allowedCollections as string[]).includes(collectionId)
    ) {
      return user
    }
    throw new ForbiddenError(
      `Access denied to collection - ${level} access required`
    )
  }

  // Check collection-level permissions
  // Note: The permissions structure is per tag value, so we need to check if user is in any of them
  const hasAccess = Object.values(collectionPerms).some(
    (tagPerms: { viewers?: string[]; editors?: string[] }) => {
      if (level === 'view') {
        // For view access, check both viewers and editors arrays
        return (
          tagPerms.viewers?.includes(user.id) ||
          tagPerms.editors?.includes(user.id)
        )
      } else {
        // For edit access, only check editors array
        return tagPerms.editors?.includes(user.id)
      }
    }
  )

  if (!hasAccess) {
    // Final check: user's global allowedCollections
    if (
      allowedCollections &&
      (allowedCollections as string[]).includes(collectionId)
    ) {
      return user
    }

    throw new ForbiddenError(
      `Access denied to collection - ${level} access required`
    )
  }

  return user
}

/**
 * Log a permission change to the audit table
 *
 * @param params - Audit log parameters
 * @param params.userId - ID of user whose permissions were changed
 * @param params.changedBy - ID of user who made the change
 * @param params.action - Type of action (e.g., 'role_changed', 'permission_granted')
 * @param params.oldValue - Previous value (optional)
 * @param params.newValue - New value (optional)
 * @param params.reason - Reason for the change (optional)
 */
export async function logPermissionChange(params: {
  userId: string
  changedBy: string
  action: string
  oldValue?: Record<string, any>
  newValue?: Record<string, any>
  reason?: string
}): Promise<void> {
  const db = getDb()

  await db.insert(permissionAudit).values({
    userId: params.userId,
    changedBy: params.changedBy,
    action: params.action,
    oldValue: params.oldValue || null,
    newValue: params.newValue || null,
    reason: params.reason || null
  })
}

/**
 * Helper function to check if a user has a minimum role level
 * (can be used without throwing errors)
 *
 * @param user - Authenticated user
 * @param minRole - Minimum required role
 * @returns true if user has sufficient role level
 */
export function hasRole(user: AuthenticatedUser, minRole: Role): boolean {
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole]
}

/**
 * Helper function to check if a user has a specific permission
 * (can be used without throwing errors)
 *
 * @param user - Authenticated user
 * @param permission - Permission to check
 * @returns true if user has the permission
 */
export function hasPermission(
  user: AuthenticatedUser,
  permission: keyof Omit<UserPermissions, 'allowedCollections'>
): boolean {
  // Admins have all permissions
  if (user.role === 'admin' || user.role === 'super_admin') {
    return true
  }
  return user.permissions[permission] === true
}
