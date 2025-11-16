import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/db'
import { session as sessionSchema } from '@/db/schema/auth_session'
import { user as userSchema } from '@/db/schema/auth_user'
import { eq, and, gt } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dam/sharing/my-shared
 * Fetches all resources (assets, sets, collections) shared with the current user
 *
 * TODO: This endpoint requires a sharing system to be implemented in the database.
 * Required database tables:
 * 1. shared_resources - tracks sharing relationships
 *    Columns:
 *    - id (uuid, primary key)
 *    - resource_type (enum: 'asset', 'set', 'collection')
 *    - resource_id (uuid, references the specific resource)
 *    - shared_by_user_id (uuid, references users table)
 *    - shared_with_user_id (uuid, references users table)
 *    - permission (enum: 'view', 'edit', 'comment')
 *    - shared_at (timestamp)
 *    - created_at (timestamp)
 *    - updated_at (timestamp)
 *
 * Once the database schema is implemented, this endpoint should:
 * 1. Validate the user's session
 * 2. Query shared_resources where shared_with_user_id = current user
 * 3. Join with the respective resource tables (assets, sets, collections)
 * 4. Join with users table to get sharer information
 * 5. Return formatted results with thumbnails and metadata
 */

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = getDb()

    // Verify session and get user ID
    const result = await db
      .select({
        userId: userSchema.id,
        damAccess: userSchema.damAccess,
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

    const session = result[0]

    if (!session || !session.damAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // TODO: Replace this mock data with actual database queries once sharing schema is implemented
    // For now, return empty array to allow UI to function
    const mockResources = [] as any[]

    /*
    Example of what the real query would look like once schema is implemented:

    const sharedResources = await db
      .select({
        id: sharedResourcesTable.id,
        resourceType: sharedResourcesTable.resourceType,
        resourceId: sharedResourcesTable.resourceId,
        permission: sharedResourcesTable.permission,
        sharedAt: sharedResourcesTable.sharedAt,
        sharedByUserId: sharedResourcesTable.sharedByUserId,
        sharedByUserName: userSchema.name,
        sharedByUserImage: userSchema.imageUrl,
        // Join with respective resource tables based on resourceType
        resourceName: sql`CASE
          WHEN ${sharedResourcesTable.resourceType} = 'asset' THEN ${assets.fileName}
          WHEN ${sharedResourcesTable.resourceType} = 'set' THEN ${sets.name}
          WHEN ${sharedResourcesTable.resourceType} = 'collection' THEN ${collections.name}
        END`,
        resourceThumbnail: sql`CASE
          WHEN ${sharedResourcesTable.resourceType} = 'asset' THEN ${assets.filePath}
          WHEN ${sharedResourcesTable.resourceType} = 'set' THEN (SELECT filePath FROM assets WHERE id = (SELECT asset_id FROM set_photos WHERE set_id = ${sets.id} LIMIT 1))
          WHEN ${sharedResourcesTable.resourceType} = 'collection' THEN (SELECT filePath FROM assets WHERE id IN (SELECT id FROM asset_tags WHERE tag_id = ${collections.id}) LIMIT 1)
        END`,
        itemCount: sql`CASE
          WHEN ${sharedResourcesTable.resourceType} = 'set' THEN (SELECT COUNT(*) FROM set_photos WHERE set_id = ${sets.id})
          WHEN ${sharedResourcesTable.resourceType} = 'collection' THEN (SELECT COUNT(*) FROM asset_tags WHERE tag_id = ${collections.id})
          ELSE NULL
        END`
      })
      .from(sharedResourcesTable)
      .where(eq(sharedResourcesTable.sharedWithUserId, session.userId))
      .leftJoin(userSchema, eq(sharedResourcesTable.sharedByUserId, userSchema.id))
      .leftJoin(assets, and(
        eq(sharedResourcesTable.resourceType, 'asset'),
        eq(sharedResourcesTable.resourceId, assets.id)
      ))
      .leftJoin(sets, and(
        eq(sharedResourcesTable.resourceType, 'set'),
        eq(sharedResourcesTable.resourceId, sets.id)
      ))
      .orderBy(desc(sharedResourcesTable.sharedAt))

    // Format the results
    const formattedResources = sharedResources.map(resource => ({
      id: resource.id,
      resourceType: resource.resourceType,
      resourceId: resource.resourceId,
      sharedBy: {
        id: resource.sharedByUserId,
        name: resource.sharedByUserName,
        imageUrl: resource.sharedByUserImage
      },
      sharedAt: resource.sharedAt,
      permission: resource.permission,
      resource: {
        id: resource.resourceId,
        name: resource.resourceName,
        thumbnailUrl: resource.resourceThumbnail,
        itemCount: resource.itemCount
      }
    }))
    */

    return NextResponse.json({
      resources: mockResources,
    })
  } catch (error) {
    console.error('Error fetching shared resources:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
