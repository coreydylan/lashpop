import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assets } from "@/db/schema/assets"
import { assetServices } from "@/db/schema/asset_services"
import { eq, inArray } from "drizzle-orm"
import { requireAuth, UnauthorizedError, ForbiddenError } from "@/lib/server/dam-auth"

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()

    const body = await request.json()
    const { assetIds, tags } = body

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        { error: "Asset IDs are required" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Update asset metadata (color, length, curl, team member)
    const updateData: any = {
      modifiedBy: user.id,
      modifiedAt: new Date(),
      updatedAt: new Date()
    }

    if (tags.teamMemberId) {
      updateData.teamMemberId = tags.teamMemberId
    }

    if (tags.color) {
      updateData.color = tags.color
    }

    if (tags.length) {
      updateData.length = tags.length
    }

    if (tags.curl) {
      updateData.curl = tags.curl
    }

    // Update each asset
    for (const assetId of assetIds) {
      await db
        .update(assets)
        .set(updateData)
        .where(eq(assets.id, assetId))

      // Handle service tags (many-to-many)
      if (tags.serviceIds && Array.isArray(tags.serviceIds)) {
        // Remove existing service associations
        await db
          .delete(assetServices)
          .where(eq(assetServices.assetId, assetId))

        // Add new service associations
        if (tags.serviceIds.length > 0) {
          await db.insert(assetServices).values(
            tags.serviceIds.map((serviceId: string) => ({
              assetId,
              serviceId
            }))
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Tagged ${assetIds.length} asset(s)`
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Tagging error:", error)
    return NextResponse.json(
      { error: "Failed to tag assets" },
      { status: 500 }
    )
  }
}
