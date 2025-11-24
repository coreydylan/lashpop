import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { teamMembers } from '@/db/schema/team_members'
import { eq, asc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// GET - Fetch all team members (including inactive)
export async function GET() {
  try {
    const db = getDb()

    const members = await db
      .select()
      .from(teamMembers)
      .orderBy(asc(teamMembers.displayOrder))

    return NextResponse.json({
      members: members.map(member => ({
        ...member,
        specialties: member.specialties || [],
      }))
    })
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}

// PUT - Update team member visibility and order
export async function PUT(request: NextRequest) {
  try {
    const db = getDb()
    const { updates } = await request.json()

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Update each member's isActive and displayOrder
    for (const update of updates) {
      if (!update.id) continue

      await db
        .update(teamMembers)
        .set({
          isActive: update.isActive,
          displayOrder: update.displayOrder,
          updatedAt: new Date()
        })
        .where(eq(teamMembers.id, update.id))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating team members:', error)
    return NextResponse.json(
      { error: 'Failed to update team members' },
      { status: 500 }
    )
  }
}

