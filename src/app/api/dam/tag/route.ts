import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assets } from "@/db/schema/assets"
import { assetServices } from "@/db/schema/asset_services"
import { eq, inArray } from "drizzle-orm"
import { requireAdminApi } from "@/lib/admin/auth"
import { recordAdminAction } from "@/lib/admin/audit"

type AssetMetadataUpdate = {
  teamMemberId?: string
  color?: "brown" | "black"
  length?: "S" | "M" | "L"
  curl?: "1" | "2" | "3" | "4"
}

const COLORS = new Set(["brown", "black"])
const LENGTHS = new Set(["S", "M", "L"])
const CURLS = new Set(["1", "2", "3", "4"])

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(["owner", "publisher"])
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const assetIds: string[] = Array.isArray(body.assetIds)
      ? Array.from(new Set<string>(body.assetIds.filter((assetId: unknown): assetId is string => typeof assetId === "string" && assetId.length > 0)))
      : []
    const tagInput = body.tags && typeof body.tags === "object"
      ? body.tags as Record<string, unknown>
      : null

    if (assetIds.length === 0) {
      return NextResponse.json(
        { error: "Asset IDs are required" },
        { status: 400 }
      )
    }
    if (!tagInput) {
      return NextResponse.json(
        { error: "Tags are required" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Update asset metadata (color, length, curl, team member)
    const updateData: AssetMetadataUpdate = {}

    if (typeof tagInput.teamMemberId === "string" && tagInput.teamMemberId.length > 0) {
      updateData.teamMemberId = tagInput.teamMemberId
    }

    if (typeof tagInput.color === "string" && COLORS.has(tagInput.color)) {
      updateData.color = tagInput.color as AssetMetadataUpdate["color"]
    }

    if (typeof tagInput.length === "string" && LENGTHS.has(tagInput.length)) {
      updateData.length = tagInput.length as AssetMetadataUpdate["length"]
    }

    if (typeof tagInput.curl === "string" && CURLS.has(tagInput.curl)) {
      updateData.curl = tagInput.curl as AssetMetadataUpdate["curl"]
    }

    const rawServiceIds: unknown[] | null = Array.isArray(tagInput.serviceIds)
      ? tagInput.serviceIds
      : null
    const replacesServices = rawServiceIds !== null
    const serviceIds: string[] = rawServiceIds
      ? Array.from(new Set<string>(rawServiceIds.filter((serviceId): serviceId is string => typeof serviceId === "string" && serviceId.length > 0)))
      : []

    const beforeAssets = await db
      .select({
        assetId: assets.id,
        teamMemberId: assets.teamMemberId,
        color: assets.color,
        length: assets.length,
        curl: assets.curl,
      })
      .from(assets)
      .where(inArray(assets.id, assetIds))
    const beforeServices = await db
      .select({ assetId: assetServices.assetId, serviceId: assetServices.serviceId })
      .from(assetServices)
      .where(inArray(assetServices.assetId, assetIds))

    // Update each asset
    for (const assetId of assetIds) {
      await db
        .update(assets)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(assets.id, assetId))

      // Handle service tags (many-to-many)
      if (replacesServices) {
        // Remove existing service associations
        await db
          .delete(assetServices)
          .where(eq(assetServices.assetId, assetId))

        // Add new service associations
        if (serviceIds.length > 0) {
          await db.insert(assetServices).values(
            serviceIds.map((serviceId) => ({
              assetId,
              serviceId
            }))
          )
        }
      }
    }

    const afterAssets = await db
      .select({
        assetId: assets.id,
        teamMemberId: assets.teamMemberId,
        color: assets.color,
        length: assets.length,
        curl: assets.curl,
      })
      .from(assets)
      .where(inArray(assets.id, assetIds))
    const afterServices = await db
      .select({ assetId: assetServices.assetId, serviceId: assetServices.serviceId })
      .from(assetServices)
      .where(inArray(assetServices.assetId, assetIds))

    await recordAdminAction({
      action: "dam.asset.metadata.update",
      surface: "dam",
      targetType: assetIds.length === 1 ? "asset" : "asset_batch",
      targetId: assetIds.length === 1 ? assetIds[0] : undefined,
      actorUserId: auth.userId,
      diff: {
        assetIds,
        requested: {
          ...updateData,
          serviceIds: replacesServices ? serviceIds : undefined,
        },
        before: { assets: beforeAssets, services: beforeServices },
        after: { assets: afterAssets, services: afterServices },
      },
    })

    return NextResponse.json({
      success: true,
      message: `Tagged ${assetIds.length} asset(s)`
    })
  } catch (error) {
    console.error("Tagging error:", error)
    return NextResponse.json(
      { error: "Failed to tag assets" },
      { status: 500 }
    )
  }
}
