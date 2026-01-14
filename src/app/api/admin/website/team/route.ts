import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { teamMembers } from '@/db/schema/team_members'
import { services } from '@/db/schema/services'
import { eq, asc, isNotNull, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/**
 * Get Vagaro-derived service categories for a team member
 */
async function getVagaroCategories(vagaroEmployeeId: string | null): Promise<string[]> {
  if (!vagaroEmployeeId) return []

  const db = getDb()

  const allServices = await db
    .select()
    .from(services)
    .where(
      and(
        isNotNull(services.vagaroData),
        eq(services.isActive, true)
      )
    )

  const memberServices: string[] = []

  for (const service of allServices) {
    const vagaroData = service.vagaroData as any
    if (!vagaroData?.servicePerformedBy) continue

    const performers = vagaroData.servicePerformedBy || []
    const isPerformer = performers.some((p: any) => {
      const employeeId = p.serviceProviderId || p.employeeId
      return employeeId === vagaroEmployeeId
    })

    if (isPerformer && service.mainCategory) {
      memberServices.push(service.mainCategory)
    }
  }

  const uniqueCategories = Array.from(new Set(memberServices))

  return uniqueCategories.map(cat => {
    let cleaned = cat.replace(' Services', '').replace(' Service', '')
    if (cleaned === 'Lash') cleaned = 'Lashes'
    return cleaned
  })
}

// GET - Fetch all team members (including inactive) with service categories
export async function GET() {
  try {
    const db = getDb()

    const members = await db
      .select()
      .from(teamMembers)
      .orderBy(asc(teamMembers.displayOrder))

    // Fetch service categories for all members
    const membersWithCategories = await Promise.all(
      members.map(async (member) => {
        const vagaroCategories = await getVagaroCategories(member.vagaroEmployeeId)
        const manualCategories = (member.manualServiceCategories as string[]) || []

        return {
          ...member,
          specialties: member.specialties || [],
          vagaroServiceCategories: vagaroCategories,
          manualServiceCategories: manualCategories,
        }
      })
    )

    return NextResponse.json({
      members: membersWithCategories
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

// PATCH - Update a single team member's details (manual categories, bio, funFact, credentials)
export async function PATCH(request: NextRequest) {
  try {
    const db = getDb()
    const body = await request.json()
    const { memberId, manualServiceCategories, bio, funFact, credentials } = body

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    // Build update object dynamically based on what was provided
    const updateData: Record<string, any> = {
      updatedAt: new Date()
    }

    if (manualServiceCategories !== undefined) {
      if (!Array.isArray(manualServiceCategories)) {
        return NextResponse.json(
          { error: 'manualServiceCategories must be an array' },
          { status: 400 }
        )
      }
      updateData.manualServiceCategories = manualServiceCategories
    }

    if (bio !== undefined) {
      updateData.bio = bio
    }

    if (funFact !== undefined) {
      updateData.funFact = funFact
    }

    // Handle credentials (for SEO structured data)
    if (credentials !== undefined) {
      if (!Array.isArray(credentials)) {
        return NextResponse.json(
          { error: 'credentials must be an array' },
          { status: 400 }
        )
      }
      updateData.credentials = credentials
    }

    await db
      .update(teamMembers)
      .set(updateData)
      .where(eq(teamMembers.id, memberId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    )
  }
}

