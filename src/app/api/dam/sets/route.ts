import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { sets } from "@/db/schema/sets"
import { requireAdminApi } from "@/lib/admin/auth"
import { recordAdminAction } from "@/lib/admin/audit"

// Get all sets
export async function GET() {
  try {
    const db = getDb()
    const allSets = await db.select().from(sets)

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
  const auth = await requireAdminApi(["owner", "publisher"])
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const teamMemberId = typeof body.teamMemberId === "string" ? body.teamMemberId : ""
    const name = typeof body.name === "string" && body.name.length > 0 ? body.name : null

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
        name
      })
      .returning()

    await recordAdminAction({
      action: "dam.set.create",
      surface: "dam",
      targetType: "set",
      targetId: newSet.id,
      actorUserId: auth.userId,
      diff: {
        teamMemberId,
        before: null,
        after: newSet,
      },
    })

    return NextResponse.json({ set: newSet })
  } catch (error) {
    console.error("Error creating set:", error)
    return NextResponse.json(
      { error: "Failed to create set" },
      { status: 500 }
    )
  }
}
