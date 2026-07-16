import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assets } from "@/db/schema/assets"
import { inArray } from "drizzle-orm"
import { requireAdminApi } from "@/lib/admin/auth"
import { recordAdminAction } from "@/lib/admin/audit"

// Assign team member to multiple assets
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(["owner", "publisher"])
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const assetIds: string[] = Array.isArray(body.assetIds)
      ? Array.from(new Set<string>(body.assetIds.filter((assetId: unknown): assetId is string => typeof assetId === "string" && assetId.length > 0)))
      : []
    const teamMemberId = typeof body.teamMemberId === "string" ? body.teamMemberId : ""

    if (assetIds.length === 0 || !teamMemberId) {
      return NextResponse.json(
        { error: "Asset IDs and team member ID required" },
        { status: 400 }
      )
    }

    const db = getDb()
    const before = await db
      .select({ assetId: assets.id, teamMemberId: assets.teamMemberId })
      .from(assets)
      .where(inArray(assets.id, assetIds))

    // Set teamMemberId for these assets
    await db
      .update(assets)
      .set({ teamMemberId })
      .where(inArray(assets.id, assetIds))

    const after = await db
      .select({ assetId: assets.id, teamMemberId: assets.teamMemberId })
      .from(assets)
      .where(inArray(assets.id, assetIds))

    await recordAdminAction({
      action: "dam.asset.team.assign",
      surface: "dam",
      targetType: assetIds.length === 1 ? "dam_asset" : "dam_asset_batch",
      targetId: assetIds.length === 1 ? assetIds[0] : undefined,
      actorUserId: auth.userId,
      diff: { assetIds, teamMemberId, before, after },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error assigning team member:", error)
    return NextResponse.json(
      { error: "Failed to assign team member" },
      { status: 500 }
    )
  }
}
