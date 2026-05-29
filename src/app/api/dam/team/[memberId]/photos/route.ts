import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { assets } from "@/db/schema/assets"
import { and, eq, desc, inArray } from "drizzle-orm"
import { getRouteParam } from "@/lib/server/getRouteParam"
import { requireAdminApi } from "@/lib/admin/auth"

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

    const [albumPhotos, taggedAssets] = await Promise.all([
      db
        .select()
        .from(teamMemberPhotos)
        .where(eq(teamMemberPhotos.teamMemberId, memberId))
        .orderBy(desc(teamMemberPhotos.isPrimary), desc(teamMemberPhotos.uploadedAt)),
      db
        .select({
          id: assets.id,
          fileName: assets.fileName,
          filePath: assets.filePath,
          width: assets.width,
          height: assets.height,
          caption: assets.caption,
          uploadedAt: assets.uploadedAt,
        })
        .from(assets)
        .where(and(eq(assets.teamMemberId, memberId), eq(assets.fileType, "image")))
        .orderBy(desc(assets.uploadedAt)),
    ])

    // Drop the primary headshot — it's already shown as the avatar.
    const portfolioAlbum = albumPhotos
      .filter((p) => !p.isPrimary)
      .map((p) => ({ ...p, source: "album" as const }))

    // Dedupe DAM-tagged assets against album entries by filePath.
    const seenPaths = new Set(albumPhotos.map((p) => p.filePath))
    const taggedShaped = taggedAssets
      .filter((a) => !seenPaths.has(a.filePath))
      .map((a) => ({
        id: a.id,
        fileName: a.fileName,
        filePath: a.filePath,
        width: a.width,
        height: a.height,
        caption: a.caption,
        isPrimary: false,
        uploadedAt: a.uploadedAt,
        source: "dam" as const,
      }))

    const photos = [...portfolioAlbum, ...taggedShaped]

    return NextResponse.json({ photos })
  } catch (error) {
    console.error("Error fetching photos:", error)
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    )
  }
}

// POST - Tag DAM assets to this team member. Same op as the DAM's "assign to team"
// (assets.team_member_id is the single source of truth for portfolio photos).
export async function POST(request: NextRequest, context: any) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

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

    const updated = await db
      .update(assets)
      .set({ teamMemberId: memberId })
      .where(inArray(assets.id, assetIds))
      .returning({ id: assets.id })

    return NextResponse.json({
      success: true,
      added: updated.length,
    })
  } catch (error) {
    console.error("Error tagging assets to team member:", error)
    return NextResponse.json(
      { error: "Failed to add photos" },
      { status: 500 }
    )
  }
}
