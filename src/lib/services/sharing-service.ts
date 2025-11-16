/**
 * Sharing Service
 *
 * Manages resource sharing, public links, and activity logging
 */

import { eq, and, sql } from "drizzle-orm"
import { getDb } from "@/db"
import { sharedResources } from "@/db/schema/shared_resources"
import { publicShareLinks } from "@/db/schema/public_share_links"
import { shareActivityLog } from "@/db/schema/share_activity_log"
import { user } from "@/db/schema/auth_user"
import crypto from "crypto"
import { promisify } from "util"
import type {
  ShareWithUserParams,
  ShareWithMultipleUsersParams,
  RevokeAccessParams,
  UpdatePermissionParams,
  GetSharedUsersParams,
  SharedUserInfo,
  GetResourcesSharedWithUserParams,
  GroupedSharedResources,
  CreatePublicLinkParams,
  PublicLinkResult,
  ValidatePublicLinkParams,
  PublicLinkValidationResult,
  RevokePublicLinkParams,
  LogActivityParams,
  SharedResourceInfo,
  SharedResource,
  PublicShareLink
} from "@/types/sharing"

const pbkdf2 = promisify(crypto.pbkdf2)
const randomBytes = promisify(crypto.randomBytes)

/**
 * Hash a password using PBKDF2
 */
async function hashPassword(password: string): Promise<string> {
  const salt = await randomBytes(16)
  const iterations = 100000
  const keylen = 64
  const digest = "sha512"

  const hash = await pbkdf2(password, salt, iterations, keylen, digest)

  // Return salt + hash as hex string
  return `${salt.toString("hex")}:${hash.toString("hex")}`
}

/**
 * Verify a password against a hash
 */
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const [saltHex, hashHex] = hashedPassword.split(":")
    if (!saltHex || !hashHex) return false

    const salt = Buffer.from(saltHex, "hex")
    const iterations = 100000
    const keylen = 64
    const digest = "sha512"

    const hash = await pbkdf2(password, salt, iterations, keylen, digest)
    return hash.toString("hex") === hashHex
  } catch {
    return false
  }
}

/**
 * Generate a secure random token
 */
async function generateToken(length: number = 32): Promise<string> {
  const buffer = await randomBytes(length)
  return buffer.toString("base64url")
}

export class SharingService {
  private db = getDb()

  /**
   * Share a resource with a specific user
   */
  async shareWithUser(params: ShareWithUserParams): Promise<SharedResource> {
    const {
      resourceType,
      resourceId,
      sharedWithUserId,
      permissionLevel,
      ownerId,
      expiresAt
    } = params

    // Validate inputs
    if (!resourceType || !resourceId || !sharedWithUserId || !permissionLevel || !ownerId) {
      throw new Error("Missing required parameters for sharing")
    }

    if (!["asset", "set", "collection"].includes(resourceType)) {
      throw new Error("Invalid resource type")
    }

    if (!["view", "edit", "admin"].includes(permissionLevel)) {
      throw new Error("Invalid permission level")
    }

    // Verify owner exists and has permission to share
    const ownerExists = await this.db.query.user.findFirst({
      where: eq(user.id, ownerId)
    })

    if (!ownerExists) {
      throw new Error("Owner user not found")
    }

    // Verify shared-with user exists
    const sharedWithUserExists = await this.db.query.user.findFirst({
      where: eq(user.id, sharedWithUserId)
    })

    if (!sharedWithUserExists) {
      throw new Error("Shared-with user not found")
    }

    // Check if already shared
    const existingShare = await this.db.query.sharedResources.findFirst({
      where: and(
        eq(sharedResources.resourceType, resourceType),
        eq(sharedResources.resourceId, resourceId),
        eq(sharedResources.sharedWithUserId, sharedWithUserId)
      )
    })

    if (existingShare) {
      throw new Error("Resource is already shared with this user")
    }

    // Create share in transaction
    return await this.db.transaction(async (tx) => {
      const [share] = await tx
        .insert(sharedResources)
        .values({
          resourceType,
          resourceId,
          ownerId,
          sharedWithUserId,
          permissionLevel,
          createdBy: ownerId,
          expiresAt: expiresAt || null
        })
        .returning()

      // Log activity
      await this.logActivity({
        activityType: "share_created",
        resourceType,
        resourceId,
        userId: ownerId,
        metadata: {
          sharedWithUserId,
          permissionLevel,
          shareId: share.id
        }
      })

      return share
    })
  }

  /**
   * Share a resource with multiple users
   */
  async shareWithMultipleUsers(
    params: ShareWithMultipleUsersParams
  ): Promise<SharedResource[]> {
    const { resourceType, resourceId, userIds, permissionLevel, ownerId, expiresAt } = params

    // Validate inputs
    if (!resourceType || !resourceId || !userIds || !permissionLevel || !ownerId) {
      throw new Error("Missing required parameters for bulk sharing")
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error("User IDs must be a non-empty array")
    }

    if (!["asset", "set", "collection"].includes(resourceType)) {
      throw new Error("Invalid resource type")
    }

    if (!["view", "edit", "admin"].includes(permissionLevel)) {
      throw new Error("Invalid permission level")
    }

    // Verify owner exists
    const ownerExists = await this.db.query.user.findFirst({
      where: eq(user.id, ownerId)
    })

    if (!ownerExists) {
      throw new Error("Owner user not found")
    }

    // Share with all users in a transaction
    return await this.db.transaction(async (tx) => {
      const shares: SharedResource[] = []

      for (const userId of userIds) {
        // Check if user exists
        const userExists = await tx.query.user.findFirst({
          where: eq(user.id, userId)
        })

        if (!userExists) {
          console.warn(`User ${userId} not found, skipping`)
          continue
        }

        // Check if already shared
        const existingShare = await tx.query.sharedResources.findFirst({
          where: and(
            eq(sharedResources.resourceType, resourceType),
            eq(sharedResources.resourceId, resourceId),
            eq(sharedResources.sharedWithUserId, userId)
          )
        })

        if (existingShare) {
          console.warn(`Resource already shared with user ${userId}, skipping`)
          continue
        }

        // Create share
        const [share] = await tx
          .insert(sharedResources)
          .values({
            resourceType,
            resourceId,
            ownerId,
            sharedWithUserId: userId,
            permissionLevel,
            createdBy: ownerId,
            expiresAt: expiresAt || null
          })
          .returning()

        shares.push(share)

        // Log activity
        await this.logActivity({
          activityType: "share_created",
          resourceType,
          resourceId,
          userId: ownerId,
          metadata: {
            sharedWithUserId: userId,
            permissionLevel,
            shareId: share.id
          }
        })
      }

      return shares
    })
  }

  /**
   * Revoke a user's access to a resource
   */
  async revokeAccess(params: RevokeAccessParams): Promise<void> {
    const { shareId, requesterId } = params

    // Validate inputs
    if (!shareId || !requesterId) {
      throw new Error("Missing required parameters for revoking access")
    }

    // Get the share
    const share = await this.db.query.sharedResources.findFirst({
      where: eq(sharedResources.id, shareId)
    })

    if (!share) {
      throw new Error("Share not found")
    }

    // Verify requester has permission (must be owner or admin)
    if (share.ownerId !== requesterId) {
      throw new Error("Only the resource owner can revoke access")
    }

    // Delete share in transaction
    await this.db.transaction(async (tx) => {
      await tx.delete(sharedResources).where(eq(sharedResources.id, shareId))

      // Log activity
      await this.logActivity({
        activityType: "share_revoked",
        resourceType: share.resourceType,
        resourceId: share.resourceId,
        userId: requesterId,
        metadata: {
          revokedUserId: share.sharedWithUserId,
          shareId
        }
      })
    })
  }

  /**
   * Update permission level for an existing share
   */
  async updatePermission(params: UpdatePermissionParams): Promise<SharedResource> {
    const { shareId, newPermissionLevel, requesterId } = params

    // Validate inputs
    if (!shareId || !newPermissionLevel || !requesterId) {
      throw new Error("Missing required parameters for updating permission")
    }

    if (!["view", "edit", "admin"].includes(newPermissionLevel)) {
      throw new Error("Invalid permission level")
    }

    // Get the share
    const share = await this.db.query.sharedResources.findFirst({
      where: eq(sharedResources.id, shareId)
    })

    if (!share) {
      throw new Error("Share not found")
    }

    // Verify requester has permission (must be owner or admin)
    if (share.ownerId !== requesterId) {
      throw new Error("Only the resource owner can update permissions")
    }

    // Update permission in transaction
    return await this.db.transaction(async (tx) => {
      const [updatedShare] = await tx
        .update(sharedResources)
        .set({
          permissionLevel: newPermissionLevel,
          updatedAt: new Date()
        })
        .where(eq(sharedResources.id, shareId))
        .returning()

      // Log activity
      await this.logActivity({
        activityType: "permission_updated",
        resourceType: share.resourceType,
        resourceId: share.resourceId,
        userId: requesterId,
        metadata: {
          shareId,
          oldPermission: share.permissionLevel,
          newPermission: newPermissionLevel
        }
      })

      return updatedShare
    })
  }

  /**
   * Get all users with access to a resource
   */
  async getSharedUsers(params: GetSharedUsersParams): Promise<SharedUserInfo[]> {
    const { resourceType, resourceId } = params

    // Validate inputs
    if (!resourceType || !resourceId) {
      throw new Error("Missing required parameters for getting shared users")
    }

    // Get all shares for this resource
    const shares = await this.db.query.sharedResources.findMany({
      where: and(
        eq(sharedResources.resourceType, resourceType),
        eq(sharedResources.resourceId, resourceId)
      )
    })

    // Get user details for all shared users
    const userInfoPromises = shares.map(async (share) => {
      const userInfo = await this.db.query.user.findFirst({
        where: eq(user.id, share.sharedWithUserId)
      })

      return {
        userId: share.sharedWithUserId,
        userName: userInfo?.name || null,
        userEmail: userInfo?.email || null,
        userImage: userInfo?.image || null,
        permissionLevel: share.permissionLevel as "view" | "edit" | "admin",
        sharedAt: share.createdAt,
        isOwner: false,
        shareId: share.id
      }
    })

    const sharedUsersList = await Promise.all(userInfoPromises)

    // Get owner info and add to list
    const firstShare = shares[0]
    if (firstShare) {
      const ownerInfo = await this.db.query.user.findFirst({
        where: eq(user.id, firstShare.ownerId)
      })

      if (ownerInfo) {
        sharedUsersList.unshift({
          userId: firstShare.ownerId,
          userName: ownerInfo.name || null,
          userEmail: ownerInfo.email || null,
          userImage: ownerInfo.image || null,
          permissionLevel: "admin",
          sharedAt: firstShare.createdAt,
          isOwner: true
        })
      }
    }

    return sharedUsersList
  }

  /**
   * Get all resources shared with a specific user
   */
  async getResourcesSharedWithUser(
    params: GetResourcesSharedWithUserParams
  ): Promise<GroupedSharedResources> {
    const { userId, resourceType } = params

    // Validate inputs
    if (!userId) {
      throw new Error("Missing required parameter: userId")
    }

    // Build query conditions
    const conditions = [eq(sharedResources.sharedWithUserId, userId)]
    if (resourceType) {
      conditions.push(eq(sharedResources.resourceType, resourceType))
    }

    // Get all shares for this user
    const shares = await this.db.query.sharedResources.findMany({
      where: and(...conditions)
    })

    // Get owner details for each share
    const resourceInfoPromises = shares.map(async (share) => {
      const ownerInfo = await this.db.query.user.findFirst({
        where: eq(user.id, share.ownerId)
      })

      return {
        shareId: share.id,
        resourceType: share.resourceType as "asset" | "set" | "collection",
        resourceId: share.resourceId,
        permissionLevel: share.permissionLevel as "view" | "edit" | "admin",
        ownerId: share.ownerId,
        ownerName: ownerInfo?.name || null,
        ownerEmail: ownerInfo?.email || null,
        sharedAt: share.createdAt,
        expiresAt: share.expiresAt
      }
    })

    const resourcesList = await Promise.all(resourceInfoPromises)

    // Group by resource type
    const grouped: GroupedSharedResources = {
      asset: [],
      set: [],
      collection: []
    }

    for (const resource of resourcesList) {
      grouped[resource.resourceType].push(resource)
    }

    return grouped
  }

  /**
   * Create a public shareable link
   */
  async createPublicLink(params: CreatePublicLinkParams): Promise<PublicLinkResult> {
    const { resourceType, resourceId, createdBy, password, expiresAt, maxViews } = params

    // Validate inputs
    if (!resourceType || !resourceId || !createdBy) {
      throw new Error("Missing required parameters for creating public link")
    }

    if (!["asset", "set", "collection"].includes(resourceType)) {
      throw new Error("Invalid resource type")
    }

    // Verify creator exists
    const creator = await this.db.query.user.findFirst({
      where: eq(user.id, createdBy)
    })

    if (!creator) {
      throw new Error("Creator user not found")
    }

    // Generate secure token
    const token = await generateToken(32)

    // Hash password if provided
    let passwordHash: string | null = null
    if (password) {
      passwordHash = await hashPassword(password)
    }

    // Create link in transaction
    return await this.db.transaction(async (tx) => {
      const [link] = await tx
        .insert(publicShareLinks)
        .values({
          resourceType,
          resourceId,
          createdBy,
          token,
          passwordHash,
          expiresAt: expiresAt || null,
          maxViews: maxViews || null,
          permissionLevel: "view"
        })
        .returning()

      // Log activity
      await this.logActivity({
        activityType: "public_link_created",
        resourceType,
        resourceId,
        userId: createdBy,
        metadata: {
          linkId: link.id,
          hasPassword: !!password,
          expiresAt: expiresAt?.toISOString(),
          maxViews
        }
      })

      return {
        id: link.id,
        token: link.token,
        resourceType: link.resourceType as "asset" | "set" | "collection",
        resourceId: link.resourceId,
        createdBy: link.createdBy,
        isActive: link.isActive,
        expiresAt: link.expiresAt,
        maxViews: link.maxViews,
        viewCount: link.viewCount,
        createdAt: link.createdAt
      }
    })
  }

  /**
   * Validate a public link and increment view count
   */
  async validatePublicLink(
    params: ValidatePublicLinkParams
  ): Promise<PublicLinkValidationResult> {
    const { token, password, ipAddress, userAgent } = params

    // Validate inputs
    if (!token) {
      return { isValid: false, error: "Token is required" }
    }

    // Get the link
    const link = await this.db.query.publicShareLinks.findFirst({
      where: eq(publicShareLinks.token, token)
    })

    if (!link) {
      return { isValid: false, error: "Link not found" }
    }

    // Check if active
    if (!link.isActive) {
      return { isValid: false, error: "Link is no longer active" }
    }

    // Check if expired
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return { isValid: false, error: "Link has expired" }
    }

    // Check max views
    if (link.maxViews && link.viewCount >= link.maxViews) {
      return { isValid: false, error: "Link has reached maximum views" }
    }

    // Verify password if required
    if (link.passwordHash) {
      if (!password) {
        return { isValid: false, error: "Password is required" }
      }

      const passwordValid = await verifyPassword(password, link.passwordHash)
      if (!passwordValid) {
        return { isValid: false, error: "Invalid password" }
      }
    }

    // Update view count and last accessed time in transaction
    await this.db.transaction(async (tx) => {
      await tx
        .update(publicShareLinks)
        .set({
          viewCount: sql`${publicShareLinks.viewCount} + 1`,
          lastAccessedAt: new Date()
        })
        .where(eq(publicShareLinks.id, link.id))

      // Log access
      await this.logActivity({
        activityType: "public_link_accessed",
        resourceType: link.resourceType,
        resourceId: link.resourceId,
        metadata: {
          linkId: link.id,
          token
        },
        ipAddress,
        userAgent
      })
    })

    return { isValid: true, link }
  }

  /**
   * Revoke a public link
   */
  async revokePublicLink(params: RevokePublicLinkParams): Promise<void> {
    const { linkId, requesterId } = params

    // Validate inputs
    if (!linkId || !requesterId) {
      throw new Error("Missing required parameters for revoking public link")
    }

    // Get the link
    const link = await this.db.query.publicShareLinks.findFirst({
      where: eq(publicShareLinks.id, linkId)
    })

    if (!link) {
      throw new Error("Link not found")
    }

    // Verify requester has permission
    if (link.createdBy !== requesterId) {
      throw new Error("Only the link creator can revoke it")
    }

    // Deactivate link in transaction
    await this.db.transaction(async (tx) => {
      await tx
        .update(publicShareLinks)
        .set({ isActive: false })
        .where(eq(publicShareLinks.id, linkId))

      // Log activity
      await this.logActivity({
        activityType: "public_link_revoked",
        resourceType: link.resourceType,
        resourceId: link.resourceId,
        userId: requesterId,
        metadata: {
          linkId,
          token: link.token
        }
      })
    })
  }

  /**
   * Log sharing activity
   */
  async logActivity(params: LogActivityParams): Promise<void> {
    const { activityType, resourceType, resourceId, userId, metadata, ipAddress, userAgent } =
      params

    try {
      await this.db.insert(shareActivityLog).values({
        activityType,
        resourceType,
        resourceId,
        userId: userId || null,
        metadata: metadata || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null
      })
    } catch (error) {
      // Log errors but don't fail the operation
      console.error("Failed to log share activity:", error)
    }
  }
}

// Export singleton instance
export const sharingService = new SharingService()
