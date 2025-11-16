import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { sets } from "@/db/schema/sets"
import { setPhotos } from "@/db/schema/set_photos"
import { eq } from "drizzle-orm"
import { requireAuth, UnauthorizedError, ForbiddenError } from "@/lib/server/dam-auth"

// Get all sets
export async function GET() {
  try {
    // Require authentication to view sets
    await requireAuth()

    const db = getDb()
    const allSets = await db.select().from(sets)

    return NextResponse.json({ sets: allSets })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
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
    // Require authentication to create sets
    await requireAuth()

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
        name: name || null
      })
      .returning()

    return NextResponse.json({ set: newSet })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Error creating set:", error)
    return NextResponse.json(
      { error: "Failed to create set" },
      { status: 500 }
    )
  }
}
