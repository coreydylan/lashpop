import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assets } from "@/db/schema/assets"
import { assetServices } from "@/db/schema/asset_services"
import { assetTags } from "@/db/schema/asset_tags"
import { inArray } from "drizzle-orm"
import { deleteObject } from "@/lib/dam/r2-client"
import { requireAdminApi } from "@/lib/admin/auth"
import { recordAdminAction } from "@/lib/admin/audit"

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(["owner", "publisher"])
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const assetIds: string[] = Array.isArray(body.assetIds)
      ? Array.from(new Set<string>(body.assetIds.filter((assetId: unknown): assetId is string => typeof assetId === "string" && assetId.length > 0)))
      : []

    if (assetIds.length === 0) {
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
    const serviceAssignments = await db
      .select({ assetId: assetServices.assetId, serviceId: assetServices.serviceId })
      .from(assetServices)
      .where(inArray(assetServices.assetId, assetIds))
    const tagAssignments = await db
      .select({ assetId: assetTags.assetId, tagId: assetTags.tagId })
      .from(assetTags)
      .where(inArray(assetTags.assetId, assetIds))
    const storageDeleteFailures: string[] = []
    const storageDeletedAssetIds: string[] = []

    // Delete from R2
    for (const asset of assetsToDelete) {
      try {
        // Extract key from filePath
        const url = new URL(asset.filePath)
        const key = url.pathname.substring(1) // Remove leading slash
        await deleteObject(key)
        storageDeletedAssetIds.push(asset.id)
      } catch (error) {
        console.error("Failed to delete from R2:", error)
        storageDeleteFailures.push(asset.id)
        // Continue with database deletion even if R2 delete fails
      }
    }

    // Delete metadata only for objects whose public delivery and source were
    // both removed. Failed rows remain visible to admins for a safe retry.
    if (storageDeletedAssetIds.length > 0) {
      await db
        .delete(assetServices)
        .where(inArray(assetServices.assetId, storageDeletedAssetIds))
      await db
        .delete(assets)
        .where(inArray(assets.id, storageDeletedAssetIds))
    }

    const deletedAssetIds = storageDeletedAssetIds
    await recordAdminAction({
      action: "dam.asset.delete",
      surface: "dam",
      targetType: assetIds.length === 1 ? "dam_asset" : "dam_asset_batch",
      targetId: assetIds.length === 1 ? assetIds[0] : undefined,
      actorUserId: auth.userId,
      diff: {
        requestedAssetIds: assetIds,
        before: assetsToDelete.map((asset) => ({
          assetId: asset.id,
          fileName: asset.fileName,
          fileType: asset.fileType,
          teamMemberId: asset.teamMemberId,
        })),
        after: [],
        deletedAssetIds,
        missingAssetIds: assetIds.filter((assetId) => !deletedAssetIds.includes(assetId)),
        tagAssignments,
        serviceAssignments,
        storageDeleteFailures,
      },
    })

    return NextResponse.json({
      success: storageDeleteFailures.length === 0,
      message: storageDeleteFailures.length === 0
        ? `Deleted ${deletedAssetIds.length} asset(s)`
        : `Deleted ${deletedAssetIds.length} asset(s); ${storageDeleteFailures.length} require retry`,
      deletedAssetIds,
      failedAssetIds: storageDeleteFailures,
    }, { status: storageDeleteFailures.length === 0 ? 200 : 207 })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json(
      { error: "Failed to delete assets" },
      { status: 500 }
    )
  }
}
