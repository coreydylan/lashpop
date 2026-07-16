import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assetTags } from "@/db/schema/asset_tags"
import { and, inArray, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireAdminApi } from "@/lib/admin/auth"
import { recordAdminAction } from "@/lib/admin/audit"

// Remove a specific tag from multiple assets
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(["owner", "publisher"])
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const assetIds: string[] = Array.isArray(body.assetIds)
      ? Array.from(new Set<string>(body.assetIds.filter((assetId: unknown): assetId is string => typeof assetId === "string" && assetId.length > 0)))
      : []
    const tagId = typeof body.tagId === "string" ? body.tagId : ""

    if (assetIds.length === 0 || !tagId) {
      return NextResponse.json(
        { error: "Asset IDs and tag ID required" },
        { status: 400 }
      )
    }

    const db = getDb()
    const removed = await db
      .select({ assetId: assetTags.assetId, tagId: assetTags.tagId })
      .from(assetTags)
      .where(
        and(
          inArray(assetTags.assetId, assetIds),
          eq(assetTags.tagId, tagId)
        )
      )

    // Delete the specific tag from these assets
    await db
      .delete(assetTags)
      .where(
        and(
          inArray(assetTags.assetId, assetIds),
          eq(assetTags.tagId, tagId)
        )
      )

    await recordAdminAction({
      action: "dam.asset.tag.remove",
      surface: "dam",
      targetType: assetIds.length === 1 ? "dam_asset" : "dam_asset_batch",
      targetId: assetIds.length === 1 ? assetIds[0] : undefined,
      actorUserId: auth.userId,
      diff: { assetIds, tagId, removed },
    })

    // Revalidate the DAM page cache
    revalidatePath('/admin/assets')

    return NextResponse.json({ success: true }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate'
      }
    })
  } catch (error) {
    console.error("Error removing tag:", error)
    return NextResponse.json(
      { error: "Failed to remove tag" },
      { status: 500 }
    )
  }
}
