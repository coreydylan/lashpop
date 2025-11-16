/**
 * Permissions system TypeScript types
 *
 * This file defines the core types for the user permissions and role-based access control system.
 */

/**
 * User roles in the system, ordered from least to most privileged
 */
export type Role = 'viewer' | 'editor' | 'admin' | 'super_admin'

/**
 * Role hierarchy for permission checks
 * Higher numbers indicate more privileged roles
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  super_admin: 3
}

/**
 * Individual user permissions
 * These can be granted independently or derived from role
 */
export interface UserPermissions {
  /** Can upload new assets */
  canUpload?: boolean
  /** Can delete assets */
  canDelete?: boolean
  /** Can manage user accounts and permissions */
  canManageUsers?: boolean
  /** Can create, edit, and delete collections */
  canManageCollections?: boolean
  /** Can export assets */
  canExport?: boolean
  /** Collections this user can access. Use ['all'] for unrestricted access */
  allowedCollections?: string[] | ['all']
}

/**
 * Authenticated user information including role and permissions
 */
export interface AuthenticatedUser {
  /** Unique user identifier */
  id: string
  /** User's role determining their base permissions */
  role: Role
  /** Specific permissions granted to this user */
  permissions: UserPermissions
  /** Optional link to team member record (UUID) */
  teamMemberId?: string | null
  /** Whether the user account is active */
  isActive: boolean
  /** User's phone number */
  phone?: string | null
  /** User's email address */
  email?: string | null
  /** User's display name */
  name?: string | null
}

/**
 * Collection-level permissions for controlling access
 * Note: This is distinct from the tag-based CollectionPermissions in collections.ts
 */
export interface CollectionPermissions {
  /** User IDs (strings) with view access to this collection */
  viewers?: string[]
  /** User IDs (strings) with edit access to this collection */
  editors?: string[]
  /** Whether to inherit permissions from parent collection */
  inherit?: boolean
}

/**
 * Audit log action types for permission changes
 */
export type PermissionAuditAction =
  | 'role_changed'
  | 'permission_granted'
  | 'permission_revoked'
  | 'user_activated'
  | 'user_deactivated'
  | 'team_member_linked'

/**
 * Helper type guard to check if a role has sufficient privileges
 * @param userRole - The user's current role
 * @param requiredRole - The minimum required role
 * @returns true if userRole >= requiredRole in hierarchy
 */
export function hasRoleLevel(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Helper type guard to check if a user has a specific permission
 * @param user - The authenticated user
 * @param permission - The permission key to check
 * @returns true if the user has the permission
 */
export function hasPermission(
  user: AuthenticatedUser,
  permission: keyof Omit<UserPermissions, 'allowedCollections'>
): boolean {
  return user.permissions[permission] === true
}

/**
 * Helper to check if a user can access a specific collection
 * @param user - The authenticated user
 * @param collectionId - The collection ID to check
 * @returns true if the user has access
 */
export function canAccessCollection(
  user: AuthenticatedUser,
  collectionId: string
): boolean {
  const { allowedCollections } = user.permissions

  if (!allowedCollections || allowedCollections.length === 0) {
    return false
  }

  // Check for 'all' access
  if (allowedCollections.length === 1 && allowedCollections[0] === 'all') {
    return true
  }

  // Check if specific collection is in allowed list
  return (allowedCollections as string[]).includes(collectionId)
}
