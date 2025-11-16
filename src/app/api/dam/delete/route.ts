import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assets } from "@/db/schema/assets"
import { assetServices } from "@/db/schema/asset_services"
import { eq, inArray } from "drizzle-orm"
import { deleteFromS3 } from "@/lib/dam/s3-client"
import { requireAuth, requirePermission, UnauthorizedError, ForbiddenError } from "@/lib/server/dam-auth"

export async function POST(request: NextRequest) {
  try {
    // Require authentication and delete permission
    const user = await requireAuth()
    await requirePermission('canDelete')

    const body = await request.json()
    const { assetIds } = body

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        { error: "Asset IDs are required" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Get assets to delete from S3
    const assetsToDelete = await db
      .select()
      .from(assets)
      .where(inArray(assets.id, assetIds))

    // Log deletion to audit trail
    console.log('Asset deletion audit:', {
      deletedBy: user.id,
      deletedByEmail: user.email,
      deletedByName: user.name,
      assetIds,
      assetCount: assetsToDelete.length,
      timestamp: new Date().toISOString(),
      assets: assetsToDelete.map(a => ({ id: a.id, fileName: a.fileName, filePath: a.filePath }))
    })

    // Delete from S3
    for (const asset of assetsToDelete) {
      try {
        // Extract key from filePath
        const url = new URL(asset.filePath)
        const key = url.pathname.substring(1) // Remove leading slash
        await deleteFromS3(key)
      } catch (error) {
        console.error("Failed to delete from S3:", error)
        // Continue with database deletion even if S3 fails
      }
    }

    // Delete asset-service relationships
    await db
      .delete(assetServices)
      .where(inArray(assetServices.assetId, assetIds))

    // Delete assets from database
    await db
      .delete(assets)
      .where(inArray(assets.id, assetIds))

    return NextResponse.json({
      success: true,
      message: `Deleted ${assetIds.length} asset(s)`
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Delete error:", error)
    return NextResponse.json(
      { error: "Failed to delete assets" },
      { status: 500 }
    )
  }
}
