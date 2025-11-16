import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assets } from "@/db/schema/assets"
import { assetTags } from "@/db/schema/asset_tags"
import { tags } from "@/db/schema/tags"
import { tagCategories } from "@/db/schema/tag_categories"
import { eq, desc, inArray } from "drizzle-orm"
import { getCurrentUserId, getAccessibleResources, checkPermission } from "@/lib/permissions"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamMemberId = searchParams.get("teamMemberId")

    // Get current user and their accessible assets
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const accessibleAssetIds = await getAccessibleResources(userId, "asset")

    // If user has no accessible assets, return empty array
    if (accessibleAssetIds.length === 0) {
      return NextResponse.json({ assets: [] })
    }

    const db = getDb()
    const allAssets = await db
      .select()
      .from(assets)
      .where(inArray(assets.id, accessibleAssetIds))
      .orderBy(desc(assets.uploadedAt))

    // Fetch all asset tags
    const allAssetTags = await db
      .select({
        assetId: assetTags.assetId,
        tagId: assetTags.tagId,
        tagName: tags.name,
        tagDisplayName: tags.displayName,
        categoryId: tags.categoryId,
        categoryName: tagCategories.name,
        categoryDisplayName: tagCategories.displayName,
        categoryColor: tagCategories.color
      })
      .from(assetTags)
      .leftJoin(tags, eq(assetTags.tagId, tags.id))
      .leftJoin(tagCategories, eq(tags.categoryId, tagCategories.id))

    // Group tags by asset
    const assetTagsMap = new Map<string, any[]>()
    allAssetTags.forEach((row) => {
      if (!assetTagsMap.has(row.assetId)) {
        assetTagsMap.set(row.assetId, [])
      }
      assetTagsMap.get(row.assetId)!.push({
        id: row.tagId,
        name: row.tagName,
        displayName: row.tagDisplayName,
        category: {
          id: row.categoryId,
          name: row.categoryName,
          displayName: row.categoryDisplayName,
          color: row.categoryColor
        }
      })
    })

    // Attach tags to assets
    const assetsWithTags = allAssets.map((asset) => ({
      ...asset,
      tags: assetTagsMap.get(asset.id) || []
    }))

    // Apply filters
    let filteredAssets = assetsWithTags

    if (teamMemberId) {
      filteredAssets = filteredAssets.filter(
        (asset) => asset.teamMemberId === teamMemberId
      )
    }

    return NextResponse.json({ assets: filteredAssets })
  } catch (error) {
    console.error("Error fetching assets:", error)
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { fileName, filePath, fileType, mimeType, fileSize, teamMemberId } = body

    if (!fileName || !filePath || !fileType || !mimeType || fileSize === undefined) {
      return NextResponse.json(
        { error: "fileName, filePath, fileType, mimeType, and fileSize are required" },
        { status: 400 }
      )
    }

    const db = getDb()

    // Insert asset metadata with current user as owner
    const [asset] = await db
      .insert(assets)
      .values({
        fileName,
        filePath,
        fileType,
        mimeType,
        fileSize,
        teamMemberId: teamMemberId || null,
        ownerId: userId, // Set current user as owner
      })
      .returning()

    return NextResponse.json({ asset })
  } catch (error) {
    console.error("Error saving asset metadata:", error)
    return NextResponse.json(
      { error: "Failed to save asset metadata" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get current user
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { assetId, ...updates } = body

    if (!assetId) {
      return NextResponse.json(
        { error: "assetId is required" },
        { status: 400 }
      )
    }

    // Check if user has editor permission
    const canEdit = await checkPermission(userId, "asset", assetId, "editor")
    if (!canEdit) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to edit this asset" },
        { status: 403 }
      )
    }

    const db = getDb()

    // Update the asset
    const [updatedAsset] = await db
      .update(assets)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(assets.id, assetId))
      .returning()

    return NextResponse.json({ asset: updatedAsset })
  } catch (error) {
    console.error("Error updating asset:", error)
    return NextResponse.json(
      { error: "Failed to update asset" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get current user
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get("id")

    if (!assetId) {
      return NextResponse.json(
        { error: "Asset ID is required" },
        { status: 400 }
      )
    }

    // Check if user is the owner
    const canDelete = await checkPermission(userId, "asset", assetId, "owner")
    if (!canDelete) {
      return NextResponse.json(
        { error: "Forbidden - Only the owner can delete this asset" },
        { status: 403 }
      )
    }

    const db = getDb()

    // Delete the asset
    await db.delete(assets).where(eq(assets.id, assetId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting asset:", error)
    return NextResponse.json(
      { error: "Failed to delete asset" },
      { status: 500 }
    )
  }
}
