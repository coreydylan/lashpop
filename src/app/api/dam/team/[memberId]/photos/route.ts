import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { assets } from "@/db/schema/assets"
import { eq, desc, inArray } from "drizzle-orm"
import { getRouteParam } from "@/lib/server/getRouteParam"

export async function GET(request: NextRequest, context: any) {
  try {
    const memberId = await getRouteParam(context, "memberId")
    if (!memberId) {
      return NextResponse.json(
        { error: "Missing memberId" },
        { status: 400 }
      )
    }

    const db = getDb()

    const photos = await db
      .select()
      .from(teamMemberPhotos)
      .where(eq(teamMemberPhotos.teamMemberId, memberId))
      .orderBy(desc(teamMemberPhotos.isPrimary), desc(teamMemberPhotos.uploadedAt))

    return NextResponse.json({ photos })
  } catch (error) {
    console.error("Error fetching photos:", error)
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    )
  }
}

// POST - Add photos from DAM assets to team member's album
export async function POST(request: NextRequest, context: any) {
  try {
    const memberId = await getRouteParam(context, "memberId")
    if (!memberId) {
      return NextResponse.json(
        { error: "Missing memberId" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { assetIds } = body

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        { error: "assetIds array is required" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Fetch the assets to get their file information
    const selectedAssets = await db
      .select()
      .from(assets)
      .where(inArray(assets.id, assetIds))

    if (selectedAssets.length === 0) {
      return NextResponse.json(
        { error: "No valid assets found" },
        { status: 404 }
      )
    }

    // Check if any photos already exist for this member (to avoid duplicates)
    const existingPhotos = await db
      .select({ filePath: teamMemberPhotos.filePath })
      .from(teamMemberPhotos)
      .where(eq(teamMemberPhotos.teamMemberId, memberId))

    const existingPaths = new Set(existingPhotos.map(p => p.filePath))

    // Create team_member_photos entries for each asset (skip duplicates)
    const newPhotos = []
    for (const asset of selectedAssets) {
      // Skip if this file path already exists for this member
      if (existingPaths.has(asset.filePath)) {
        continue
      }

      const [photo] = await db
        .insert(teamMemberPhotos)
        .values({
          teamMemberId: memberId,
          fileName: asset.fileName,
          filePath: asset.filePath,
          isPrimary: false
        })
        .returning()

      newPhotos.push(photo)
    }

    return NextResponse.json({
      success: true,
      added: newPhotos.length,
      skipped: selectedAssets.length - newPhotos.length,
      photos: newPhotos
    })
  } catch (error) {
    console.error("Error adding photos to album:", error)
    return NextResponse.json(
      { error: "Failed to add photos to album" },
      { status: 500 }
    )
  }
}
