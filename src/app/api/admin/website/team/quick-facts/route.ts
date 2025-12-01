import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { teamQuickFacts } from '@/db/schema/team_quick_facts'
import { teamMembers } from '@/db/schema/team_members'
import { eq, asc, inArray } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// GET - Fetch quick facts for a team member (or all if no memberId provided)
export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')

    if (memberId) {
      // Get quick facts for a specific member
      const facts = await db
        .select()
        .from(teamQuickFacts)
        .where(eq(teamQuickFacts.teamMemberId, memberId))
        .orderBy(asc(teamQuickFacts.displayOrder))

      return NextResponse.json({ facts })
    }

    // Get all quick facts grouped by member
    const allFacts = await db
      .select()
      .from(teamQuickFacts)
      .orderBy(asc(teamQuickFacts.displayOrder))

    // Group by member ID
    const factsByMember = allFacts.reduce((acc, fact) => {
      if (!acc[fact.teamMemberId]) {
        acc[fact.teamMemberId] = []
      }
      acc[fact.teamMemberId].push(fact)
      return acc
    }, {} as Record<string, typeof allFacts>)

    return NextResponse.json({ factsByMember })
  } catch (error) {
    console.error('Error fetching quick facts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quick facts' },
      { status: 500 }
    )
  }
}

// POST - Create a new quick fact
export async function POST(request: NextRequest) {
  try {
    const db = getDb()
    const body = await request.json()
    const { teamMemberId, factType, value, customLabel, customIcon, displayOrder } = body

    if (!teamMemberId || !factType || !value) {
      return NextResponse.json(
        { error: 'teamMemberId, factType, and value are required' },
        { status: 400 }
      )
    }

    // Verify team member exists
    const [member] = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.id, teamMemberId))
      .limit(1)

    if (!member) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    // Get the highest display order for this member's facts
    const existingFacts = await db
      .select()
      .from(teamQuickFacts)
      .where(eq(teamQuickFacts.teamMemberId, teamMemberId))
      .orderBy(asc(teamQuickFacts.displayOrder))

    const nextOrder = displayOrder ?? (existingFacts.length > 0
      ? Math.max(...existingFacts.map(f => f.displayOrder)) + 1
      : 0)

    const [newFact] = await db
      .insert(teamQuickFacts)
      .values({
        teamMemberId,
        factType,
        value,
        customLabel: customLabel || null,
        customIcon: customIcon || null,
        displayOrder: nextOrder,
      })
      .returning()

    return NextResponse.json({ fact: newFact })
  } catch (error) {
    console.error('Error creating quick fact:', error)
    return NextResponse.json(
      { error: 'Failed to create quick fact' },
      { status: 500 }
    )
  }
}

// PUT - Update an existing quick fact
export async function PUT(request: NextRequest) {
  try {
    const db = getDb()
    const body = await request.json()
    const { id, factType, value, customLabel, customIcon, displayOrder } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Quick fact ID is required' },
        { status: 400 }
      )
    }

    const updateData: Partial<typeof teamQuickFacts.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (factType !== undefined) updateData.factType = factType
    if (value !== undefined) updateData.value = value
    if (customLabel !== undefined) updateData.customLabel = customLabel || null
    if (customIcon !== undefined) updateData.customIcon = customIcon || null
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder

    const [updatedFact] = await db
      .update(teamQuickFacts)
      .set(updateData)
      .where(eq(teamQuickFacts.id, id))
      .returning()

    if (!updatedFact) {
      return NextResponse.json(
        { error: 'Quick fact not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ fact: updatedFact })
  } catch (error) {
    console.error('Error updating quick fact:', error)
    return NextResponse.json(
      { error: 'Failed to update quick fact' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a quick fact
export async function DELETE(request: NextRequest) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Quick fact ID is required' },
        { status: 400 }
      )
    }

    const [deletedFact] = await db
      .delete(teamQuickFacts)
      .where(eq(teamQuickFacts.id, id))
      .returning()

    if (!deletedFact) {
      return NextResponse.json(
        { error: 'Quick fact not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting quick fact:', error)
    return NextResponse.json(
      { error: 'Failed to delete quick fact' },
      { status: 500 }
    )
  }
}

// PATCH - Reorder quick facts for a team member
export async function PATCH(request: NextRequest) {
  try {
    const db = getDb()
    const body = await request.json()
    const { teamMemberId, factIds } = body

    if (!teamMemberId || !Array.isArray(factIds)) {
      return NextResponse.json(
        { error: 'teamMemberId and factIds array are required' },
        { status: 400 }
      )
    }

    // Update display order for each fact
    for (let i = 0; i < factIds.length; i++) {
      await db
        .update(teamQuickFacts)
        .set({
          displayOrder: i,
          updatedAt: new Date(),
        })
        .where(eq(teamQuickFacts.id, factIds[i]))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering quick facts:', error)
    return NextResponse.json(
      { error: 'Failed to reorder quick facts' },
      { status: 500 }
    )
  }
}
