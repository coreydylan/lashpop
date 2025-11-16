import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { sets } from "@/db/schema/sets"
import { setPhotos } from "@/db/schema/set_photos"
import { eq, inArray } from "drizzle-orm"
import { getCurrentUserId, getAccessibleResources, checkPermission } from "@/lib/permissions"

// Get all sets
export async function GET() {
  try {
    // Get current user and their accessible sets
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const accessibleSetIds = await getAccessibleResources(userId, "set")

    // If user has no accessible sets, return empty array
    if (accessibleSetIds.length === 0) {
      return NextResponse.json({ sets: [] })
    }

    const db = getDb()
    const allSets = await db
      .select()
      .from(sets)
      .where(inArray(sets.id, accessibleSetIds))

    return NextResponse.json({ sets: allSets })
  } catch (error) {
    console.error("Error fetching sets:", error)
    return NextResponse.json(
      { error: "Failed to fetch sets" },
      { status: 500 }
    )
  }
}

// Create a new set
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
    const { teamMemberId, name } = body

    if (!teamMemberId) {
      return NextResponse.json(
        { error: "Team member ID required" },
        { status: 400 }
      )
    }

    const db = getDb()

    const [newSet] = await db
      .insert(sets)
      .values({
        teamMemberId,
        name: name || null,
        ownerId: userId, // Set current user as owner
      })
      .returning()

    return NextResponse.json({ set: newSet })
  } catch (error) {
    console.error("Error creating set:", error)
    return NextResponse.json(
      { error: "Failed to create set" },
      { status: 500 }
    )
  }
}

// Update a set
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
    const { setId, ...updates } = body

    if (!setId) {
      return NextResponse.json(
        { error: "setId is required" },
        { status: 400 }
      )
    }

    // Check if user has editor permission
    const canEdit = await checkPermission(userId, "set", setId, "editor")
    if (!canEdit) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to edit this set" },
        { status: 403 }
      )
    }

    const db = getDb()

    // Update the set
    const [updatedSet] = await db
      .update(sets)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(sets.id, setId))
      .returning()

    return NextResponse.json({ set: updatedSet })
  } catch (error) {
    console.error("Error updating set:", error)
    return NextResponse.json(
      { error: "Failed to update set" },
      { status: 500 }
    )
  }
}

// Delete a set
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
    const setId = searchParams.get("id")

    if (!setId) {
      return NextResponse.json(
        { error: "Set ID is required" },
        { status: 400 }
      )
    }

    // Check if user is the owner
    const canDelete = await checkPermission(userId, "set", setId, "owner")
    if (!canDelete) {
      return NextResponse.json(
        { error: "Forbidden - Only the owner can delete this set" },
        { status: 403 }
      )
    }

    const db = getDb()

    // Delete the set
    await db.delete(sets).where(eq(sets.id, setId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting set:", error)
    return NextResponse.json(
      { error: "Failed to delete set" },
      { status: 500 }
    )
  }
}
