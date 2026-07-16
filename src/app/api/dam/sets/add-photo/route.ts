import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { setPhotos } from "@/db/schema/set_photos"
import { and, eq } from "drizzle-orm"
import { requireAdminApi } from "@/lib/admin/auth"
import { recordAdminAction } from "@/lib/admin/audit"

// Add or update a photo to a set stage
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(["owner", "publisher"])
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const setId = typeof body.setId === "string" ? body.setId : ""
    const assetId = typeof body.assetId === "string" ? body.assetId : ""
    const stage = typeof body.stage === "string" ? body.stage : ""

    if (!setId || !assetId || !stage) {
      return NextResponse.json(
        { error: "Set ID, asset ID, and stage required" },
        { status: 400 }
      )
    }

    if (!["before", "during", "after"].includes(stage)) {
      return NextResponse.json(
        { error: "Stage must be 'before', 'during', or 'after'" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Check if this asset is already in this set
    const existing = await db
      .select()
      .from(setPhotos)
      .where(
        and(
          eq(setPhotos.setId, setId),
          eq(setPhotos.assetId, assetId)
        )
      )

    if (existing.length > 0) {
      // Update the stage
      await db
        .update(setPhotos)
        .set({ stage })
        .where(
          and(
            eq(setPhotos.setId, setId),
            eq(setPhotos.assetId, assetId)
          )
        )
    } else {
      // Insert new
      await db.insert(setPhotos).values({
        setId,
        assetId,
        stage
      })
    }

    const after = await db
      .select()
      .from(setPhotos)
      .where(
        and(
          eq(setPhotos.setId, setId),
          eq(setPhotos.assetId, assetId)
        )
      )

    await recordAdminAction({
      action: existing.length > 0 ? "dam.set.photo.stage.update" : "dam.set.photo.add",
      surface: "dam",
      targetType: "set_photo",
      targetId: after[0]?.id,
      actorUserId: auth.userId,
      diff: {
        setId,
        assetId,
        before: existing,
        after,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error adding photo to set:", error)
    return NextResponse.json(
      { error: "Failed to add photo to set" },
      { status: 500 }
    )
  }
}
