import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { setPhotos } from "@/db/schema/set_photos"
import { and, eq } from "drizzle-orm"
import { requireAuth, UnauthorizedError, ForbiddenError } from "@/lib/server/dam-auth"

// Add or update a photo to a set stage
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth()

    const body = await request.json()
    const { setId, assetId, stage } = body

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

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Error adding photo to set:", error)
    return NextResponse.json(
      { error: "Failed to add photo to set" },
      { status: 500 }
    )
  }
}
