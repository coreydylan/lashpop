import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assets } from "@/db/schema/assets"
import { assetServices } from "@/db/schema/asset_services"
import { eq, inArray } from "drizzle-orm"
import { deleteObject } from "@/lib/dam/r2-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assetIds } = body

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        { error: "Asset IDs are required" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Get assets to delete from R2
    const assetsToDelete = await db
      .select()
      .from(assets)
      .where(inArray(assets.id, assetIds))

    // Delete from R2
    for (const asset of assetsToDelete) {
      try {
        // Extract key from filePath
        const url = new URL(asset.filePath)
        const key = url.pathname.substring(1) // Remove leading slash
        await deleteObject(key)
      } catch (error) {
        console.error("Failed to delete from R2:", error)
        // Continue with database deletion even if R2 delete fails
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
    console.error("Delete error:", error)
    return NextResponse.json(
      { error: "Failed to delete assets" },
      { status: 500 }
    )
  }
}
