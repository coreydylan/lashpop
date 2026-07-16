import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assetTags } from "@/db/schema/asset_tags"
import { eq } from "drizzle-orm"
import { getRouteParam } from "@/lib/server/getRouteParam"
import { requireAdminApi } from "@/lib/admin/auth"
import { recordAdminAction } from "@/lib/admin/audit"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ assetId: string }> },
) {
  const auth = await requireAdminApi(["owner", "publisher"])
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const tagIds: string[] = Array.isArray(body.tagIds)
      ? Array.from(new Set<string>(body.tagIds.filter((tagId: unknown): tagId is string => typeof tagId === "string" && tagId.length > 0)))
      : []
    const assetId = await getRouteParam(context, "assetId")

    if (!assetId) {
      return NextResponse.json(
        { error: "Missing assetId" },
        { status: 400 }
      )
    }

    const db = getDb()
    const before = await db
      .select({ tagId: assetTags.tagId })
      .from(assetTags)
      .where(eq(assetTags.assetId, assetId))

    // Delete existing tags for this asset
    await db.delete(assetTags).where(eq(assetTags.assetId, assetId))

    // Insert new tags
    if (tagIds.length > 0) {
      await db.insert(assetTags).values(
        tagIds.map((tagId: string) => ({
          assetId,
          tagId
        }))
      )
    }

    const after = await db
      .select({ tagId: assetTags.tagId })
      .from(assetTags)
      .where(eq(assetTags.assetId, assetId))

    await recordAdminAction({
      action: "dam.asset.tags.replace",
      surface: "dam",
      targetType: "dam_asset",
      targetId: assetId,
      actorUserId: auth.userId,
      diff: {
        assetId,
        before: before.map((row) => row.tagId),
        after: after.map((row) => row.tagId),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating asset tags:", error)
    return NextResponse.json(
      { error: "Failed to update tags" },
      { status: 500 }
    )
  }
}
