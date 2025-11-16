import { getDb } from "@/db"
import { resourceShares } from "@/db/schema/resource_shares"
import { assets } from "@/db/schema/assets"
import { sets } from "@/db/schema/sets"
import { tagCategories } from "@/db/schema/tag_categories"
import { user as userSchema } from "@/db/schema/auth_user"
import { session as sessionSchema } from "@/db/schema/auth_session"
import { eq, and, or, inArray, gt } from "drizzle-orm"
import { cookies } from "next/headers"

export type ResourceType = "asset" | "set" | "collection"
export type Permission = "viewer" | "editor" | "owner"

/**
 * Get the current user from the session cookie
 * @returns User ID if authenticated, null otherwise
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get("auth_token")

    if (!authToken) return null

    const db = getDb()
    const result = await db
      .select({ userId: sessionSchema.userId })
      .from(sessionSchema)
      .innerJoin(userSchema, eq(sessionSchema.userId, userSchema.id))
      .where(
        and(
          eq(sessionSchema.token, authToken.value),
          gt(sessionSchema.expiresAt, new Date())
        )
      )
      .limit(1)

    return result[0]?.userId || null
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

/**
 * Check if a user has a specific permission on a resource
 * @param userId - The user ID to check permissions for
 * @param resourceType - Type of resource ('asset', 'set', 'collection')
 * @param resourceId - ID of the resource
 * @param requiredPermission - Required permission level ('viewer', 'editor', 'owner')
 * @returns true if user has the required permission or higher
 */
export async function checkPermission(
  userId: string | null,
  resourceType: ResourceType,
  resourceId: string,
  requiredPermission: Permission
): Promise<boolean> {
  if (!userId) return false

  const db = getDb()

  // Check if user is the owner of the resource
  let isOwner = false

  if (resourceType === "asset") {
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, resourceId))
      .limit(1)
    isOwner = asset?.ownerId === userId
  } else if (resourceType === "set") {
    const [set] = await db
      .select()
      .from(sets)
      .where(eq(sets.id, resourceId))
      .limit(1)
    isOwner = set?.ownerId === userId
  } else if (resourceType === "collection") {
    const [collection] = await db
      .select()
      .from(tagCategories)
      .where(eq(tagCategories.id, resourceId))
      .limit(1)
    isOwner = collection?.ownerId === userId
  }

  // Owners have all permissions
  if (isOwner) return true

  // Check for shared permissions
  const [share] = await db
    .select()
    .from(resourceShares)
    .where(
      and(
        eq(resourceShares.resourceType, resourceType),
        eq(resourceShares.resourceId, resourceId),
        eq(resourceShares.userId, userId)
      )
    )
    .limit(1)

  if (!share) return false

  // Permission hierarchy: owner > editor > viewer
  const permissionLevel = {
    viewer: 1,
    editor: 2,
    owner: 3,
  }

  return permissionLevel[share.permission as Permission] >= permissionLevel[requiredPermission]
}

/**
 * Get all resource IDs of a specific type that a user can access
 * @param userId - The user ID to check access for
 * @param resourceType - Type of resource ('asset', 'set', 'collection')
 * @param minPermission - Minimum permission level required (defaults to 'viewer')
 * @returns Array of resource IDs the user can access
 */
export async function getAccessibleResources(
  userId: string | null,
  resourceType: ResourceType,
  minPermission: Permission = "viewer"
): Promise<string[]> {
  if (!userId) return []

  const db = getDb()
  const permissionLevel = {
    viewer: 1,
    editor: 2,
    owner: 3,
  }

  // Get resources owned by the user
  let ownedIds: string[] = []

  if (resourceType === "asset") {
    const ownedAssets = await db
      .select({ id: assets.id })
      .from(assets)
      .where(eq(assets.ownerId, userId))
    ownedIds = ownedAssets.map(a => a.id)
  } else if (resourceType === "set") {
    const ownedSets = await db
      .select({ id: sets.id })
      .from(sets)
      .where(eq(sets.ownerId, userId))
    ownedIds = ownedSets.map(s => s.id)
  } else if (resourceType === "collection") {
    const ownedCollections = await db
      .select({ id: tagCategories.id })
      .from(tagCategories)
      .where(eq(tagCategories.ownerId, userId))
    ownedIds = ownedCollections.map(c => c.id)
  }

  // Get resources shared with the user (with sufficient permission)
  const sharedResources = await db
    .select({ resourceId: resourceShares.resourceId, permission: resourceShares.permission })
    .from(resourceShares)
    .where(
      and(
        eq(resourceShares.resourceType, resourceType),
        eq(resourceShares.userId, userId)
      )
    )

  const sharedIds = sharedResources
    .filter(share => permissionLevel[share.permission as Permission] >= permissionLevel[minPermission])
    .map(share => share.resourceId)

  // Combine owned and shared IDs, removing duplicates
  return Array.from(new Set([...ownedIds, ...sharedIds]))
}

/**
 * Get sharing information for resources owned by a user
 * @param userId - The owner user ID
 * @param resourceType - Type of resource ('asset', 'set', 'collection')
 * @param resourceIds - Optional array of specific resource IDs to get shares for
 * @returns Map of resource ID to array of shares
 */
export async function getResourceShares(
  userId: string,
  resourceType: ResourceType,
  resourceIds?: string[]
): Promise<Map<string, Array<{ userId: string; permission: Permission; sharedBy: string | null }>>> {
  const db = getDb()

  const conditions = [
    eq(resourceShares.resourceType, resourceType),
    eq(resourceShares.sharedBy, userId)
  ]

  if (resourceIds && resourceIds.length > 0) {
    conditions.push(inArray(resourceShares.resourceId, resourceIds))
  }

  const shares = await db
    .select()
    .from(resourceShares)
    .where(and(...conditions))

  const sharesMap = new Map<string, Array<{ userId: string; permission: Permission; sharedBy: string | null }>>()

  shares.forEach(share => {
    if (!sharesMap.has(share.resourceId)) {
      sharesMap.set(share.resourceId, [])
    }
    sharesMap.get(share.resourceId)!.push({
      userId: share.userId,
      permission: share.permission as Permission,
      sharedBy: share.sharedBy
    })
  })

  return sharesMap
}

/**
 * Share a resource with another user
 * @param ownerId - The owner user ID (person sharing)
 * @param targetUserId - The user to share with
 * @param resourceType - Type of resource
 * @param resourceId - ID of the resource
 * @param permission - Permission level to grant
 */
export async function shareResource(
  ownerId: string,
  targetUserId: string,
  resourceType: ResourceType,
  resourceId: string,
  permission: Permission
): Promise<void> {
  const db = getDb()

  // Verify the owner has permission to share
  const canShare = await checkPermission(ownerId, resourceType, resourceId, "owner")
  if (!canShare) {
    throw new Error("You don't have permission to share this resource")
  }

  // Insert or update the share
  await db
    .insert(resourceShares)
    .values({
      resourceType,
      resourceId,
      userId: targetUserId,
      permission,
      sharedBy: ownerId,
    })
    .onConflictDoUpdate({
      target: [resourceShares.resourceType, resourceShares.resourceId, resourceShares.userId],
      set: {
        permission,
        sharedBy: ownerId,
        updatedAt: new Date(),
      },
    })
}

/**
 * Remove a share
 * @param ownerId - The owner user ID
 * @param targetUserId - The user to remove sharing from
 * @param resourceType - Type of resource
 * @param resourceId - ID of the resource
 */
export async function unshareResource(
  ownerId: string,
  targetUserId: string,
  resourceType: ResourceType,
  resourceId: string
): Promise<void> {
  const db = getDb()

  // Verify the owner has permission to unshare
  const canShare = await checkPermission(ownerId, resourceType, resourceId, "owner")
  if (!canShare) {
    throw new Error("You don't have permission to modify sharing for this resource")
  }

  await db
    .delete(resourceShares)
    .where(
      and(
        eq(resourceShares.resourceType, resourceType),
        eq(resourceShares.resourceId, resourceId),
        eq(resourceShares.userId, targetUserId)
      )
    )
}
