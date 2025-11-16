/**
 * Sharing Service Types
 *
 * Type definitions for the sharing service
 */

import type {
  SharedResource,
  NewSharedResource
} from "@/db/schema/shared_resources"
import type {
  PublicShareLink,
  NewPublicShareLink
} from "@/db/schema/public_share_links"
import type {
  SelectShareActivityLog as ShareActivityLogSelect,
  InsertShareActivityLog as ShareActivityLogInsert
} from "@/db/schema/share_activity_log"
import type { User } from "@/db/schema/auth_user"

/**
 * Resource types that can be shared
 */
export type ResourceType = "asset" | "set" | "collection"

/**
 * Permission levels for shared resources
 */
export type PermissionLevel = "view" | "edit" | "admin"

/**
 * Activity types for logging
 */
export type ShareActivityType =
  | "share_created"
  | "share_revoked"
  | "permission_updated"
  | "public_link_created"
  | "public_link_accessed"
  | "public_link_revoked"

/**
 * Parameters for sharing a resource with a user
 */
export interface ShareWithUserParams {
  resourceType: ResourceType
  resourceId: string
  sharedWithUserId: string
  permissionLevel: PermissionLevel
  ownerId: string
  expiresAt?: Date
}

/**
 * Parameters for sharing with multiple users
 */
export interface ShareWithMultipleUsersParams {
  resourceType: ResourceType
  resourceId: string
  userIds: string[]
  permissionLevel: PermissionLevel
  ownerId: string
  expiresAt?: Date
}

/**
 * Parameters for revoking access
 */
export interface RevokeAccessParams {
  shareId: string
  requesterId: string
}

/**
 * Parameters for updating permissions
 */
export interface UpdatePermissionParams {
  shareId: string
  newPermissionLevel: PermissionLevel
  requesterId: string
}

/**
 * Parameters for getting shared users
 */
export interface GetSharedUsersParams {
  resourceType: ResourceType
  resourceId: string
}

/**
 * Shared user information
 */
export interface SharedUserInfo {
  userId: string
  userName: string | null
  userEmail: string | null
  userImage: string | null
  permissionLevel: PermissionLevel
  sharedAt: Date
  isOwner: boolean
  shareId?: string
}

/**
 * Parameters for getting resources shared with user
 */
export interface GetResourcesSharedWithUserParams {
  userId: string
  resourceType?: ResourceType
}

/**
 * Resource shared with user information
 */
export interface SharedResourceInfo {
  shareId: string
  resourceType: ResourceType
  resourceId: string
  permissionLevel: PermissionLevel
  ownerId: string
  ownerName: string | null
  ownerEmail: string | null
  sharedAt: Date
  expiresAt: Date | null
}

/**
 * Grouped resources shared with user
 */
export interface GroupedSharedResources {
  asset: SharedResourceInfo[]
  set: SharedResourceInfo[]
  collection: SharedResourceInfo[]
}

/**
 * Parameters for creating a public link
 */
export interface CreatePublicLinkParams {
  resourceType: ResourceType
  resourceId: string
  createdBy: string
  password?: string
  expiresAt?: Date
  maxViews?: number
}

/**
 * Public link creation result
 */
export interface PublicLinkResult {
  id: string
  token: string
  resourceType: ResourceType
  resourceId: string
  createdBy: string
  isActive: boolean
  expiresAt: Date | null
  maxViews: number | null
  viewCount: number
  createdAt: Date
}

/**
 * Parameters for validating a public link
 */
export interface ValidatePublicLinkParams {
  token: string
  password?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Public link validation result
 */
export interface PublicLinkValidationResult {
  isValid: boolean
  link?: PublicShareLink
  error?: string
}

/**
 * Parameters for revoking a public link
 */
export interface RevokePublicLinkParams {
  linkId: string
  requesterId: string
}

/**
 * Parameters for logging activity
 */
export interface LogActivityParams {
  activityType: ShareActivityType
  resourceType: ResourceType
  resourceId: string
  userId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Context information for requests
 */
export interface RequestContext {
  ipAddress?: string
  userAgent?: string
}

// Re-export schema types for convenience
export type {
  SharedResource,
  NewSharedResource,
  PublicShareLink,
  NewPublicShareLink,
  ShareActivityLogSelect as ShareActivityLog,
  ShareActivityLogInsert as NewShareActivityLog,
  User
}
