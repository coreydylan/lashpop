"use server"

import { getDb } from "@/db"
import { teamMembers } from "@/db/schema/team_members"
import { teamQuickFacts } from "@/db/schema/team_quick_facts"
import { teamMemberPhotos } from "@/db/schema/team_member_photos"
import { services } from "@/db/schema/services"
import { and, eq, inArray, isNotNull, asc } from "drizzle-orm"

export async function getTeamMembers() {
  const db = getDb()

  const members = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.isActive, true))
    .orderBy(teamMembers.displayOrder)

  return members
}

/**
 * Get services that a team member can perform based on Vagaro data
 * Returns an array of unique main categories (e.g., "Lash Services", "Brow Services")
 */
export async function getServicesForTeamMember(vagaroEmployeeId: string | null): Promise<string[]> {
  if (!vagaroEmployeeId) return []
  
  const db = getDb()
  
  // Get all services that have Vagaro data
  const allServices = await db
    .select()
    .from(services)
    .where(
      and(
        isNotNull(services.vagaroData),
        eq(services.isActive, true)
      )
    )
  
  // Find services where this employee is in the servicePerformedBy array
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
  
  // Return unique categories, cleaned up
  const uniqueCategories = Array.from(new Set(memberServices))
  
  // Clean up category names and format nicely
  return uniqueCategories.map(cat => {
    let cleaned = cat.replace(' Services', '').replace(' Service', '')
    // "Lash" should be "Lashes"
    if (cleaned === 'Lash') cleaned = 'Lashes'
    return cleaned
  }).slice(0, 4) // Max 4 tags
}

/**
 * Get quick facts for a team member
 */
export async function getQuickFactsForMember(memberId: string) {
  const db = getDb()

  const facts = await db
    .select()
    .from(teamQuickFacts)
    .where(eq(teamQuickFacts.teamMemberId, memberId))
    .orderBy(asc(teamQuickFacts.displayOrder))

  return facts
}

/**
 * Get team members with their service categories
 * Merges Vagaro-derived categories with manually set categories
 *
 * OPTIMIZED: Single query for all services instead of N+1 queries
 */
export async function getTeamMembersWithServices() {
  const db = getDb()

  // Run all initial queries in parallel for better performance
  const [members, allServices] = await Promise.all([
    db.select()
      .from(teamMembers)
      .where(eq(teamMembers.isActive, true))
      .orderBy(teamMembers.displayOrder),
    // Fetch ALL services with Vagaro data once (instead of per-member)
    db.select()
      .from(services)
      .where(
        and(
          isNotNull(services.vagaroData),
          eq(services.isActive, true)
        )
      )
  ])

  const memberIds = members.map(m => m.id)

  // Define types for the query results
  type QuickFact = typeof teamQuickFacts.$inferSelect
  type PhotoCrop = {
    teamMemberId: string
    cropSquareUrl: string | null
    cropCloseUpCircleUrl: string | null
    cropMediumCircleUrl: string | null
    cropFullVerticalUrl: string | null
  }

  // Fetch quick facts and photos in parallel
  const [allQuickFacts, primaryPhotos] = await Promise.all([
    memberIds.length > 0
      ? db.select()
          .from(teamQuickFacts)
          .where(inArray(teamQuickFacts.teamMemberId, memberIds))
          .orderBy(asc(teamQuickFacts.displayOrder))
      : Promise.resolve([] as QuickFact[]),
    memberIds.length > 0
      ? db.select({
          teamMemberId: teamMemberPhotos.teamMemberId,
          cropSquareUrl: teamMemberPhotos.cropSquareUrl,
          cropCloseUpCircleUrl: teamMemberPhotos.cropCloseUpCircleUrl,
          cropMediumCircleUrl: teamMemberPhotos.cropMediumCircleUrl,
          cropFullVerticalUrl: teamMemberPhotos.cropFullVerticalUrl,
        })
        .from(teamMemberPhotos)
        .where(
          and(
            inArray(teamMemberPhotos.teamMemberId, memberIds),
            eq(teamMemberPhotos.isPrimary, true)
          )
        )
      : Promise.resolve([] as PhotoCrop[])
  ])

  // Group quick facts by member ID
  const quickFactsByMember = allQuickFacts.reduce((acc, fact) => {
    if (!acc[fact.teamMemberId]) {
      acc[fact.teamMemberId] = []
    }
    acc[fact.teamMemberId].push(fact)
    return acc
  }, {} as Record<string, typeof allQuickFacts>)

  // Create a map of member ID to photo crops
  const photoCropsByMember = primaryPhotos.reduce((acc, photo) => {
    acc[photo.teamMemberId] = {
      cropSquareUrl: photo.cropSquareUrl,
      cropCloseUpCircleUrl: photo.cropCloseUpCircleUrl,
      cropMediumCircleUrl: photo.cropMediumCircleUrl,
      cropFullVerticalUrl: photo.cropFullVerticalUrl,
    }
    return acc
  }, {} as Record<string, { cropSquareUrl: string | null; cropCloseUpCircleUrl: string | null; cropMediumCircleUrl: string | null; cropFullVerticalUrl: string | null }>)

  // Build a map of vagaroEmployeeId -> service categories (in-memory, no extra queries)
  const serviceCategoriesByEmployee = new Map<string, Set<string>>()
  for (const service of allServices) {
    const vagaroData = service.vagaroData as any
    if (!vagaroData?.servicePerformedBy) continue

    const performers = vagaroData.servicePerformedBy || []
    for (const performer of performers) {
      const employeeId = performer.serviceProviderId || performer.employeeId
      if (!employeeId || !service.mainCategory) continue

      if (!serviceCategoriesByEmployee.has(employeeId)) {
        serviceCategoriesByEmployee.set(employeeId, new Set())
      }
      serviceCategoriesByEmployee.get(employeeId)!.add(service.mainCategory)
    }
  }

  // Process all members (no additional queries - just in-memory operations)
  const membersWithServices = members.map((member) => {
    // Get Vagaro-derived categories from the pre-built map
    const vagaroCategoriesSet = member.vagaroEmployeeId
      ? serviceCategoriesByEmployee.get(member.vagaroEmployeeId) || new Set<string>()
      : new Set<string>()

    // Clean and format category names
    const vagaroCategories = Array.from(vagaroCategoriesSet).map(cat => {
      let cleaned = cat.replace(' Services', '').replace(' Service', '')
      if (cleaned === 'Lash') cleaned = 'Lashes'
      return cleaned
    }).slice(0, 4)

    // Get manual categories (for services not in Vagaro like injectables)
    const manualCategories = (member.manualServiceCategories as string[]) || []

    // Merge and dedupe, keeping order: Vagaro first, then manual
    const allCategories = [...vagaroCategories]
    for (const cat of manualCategories) {
      if (!allCategories.includes(cat)) {
        allCategories.push(cat)
      }
    }

    // Get photo crops for this member
    const photoCrops = photoCropsByMember[member.id] || {}

    return {
      ...member,
      serviceCategories: allCategories.slice(0, 4), // Max 4 tags
      vagaroServiceCategories: vagaroCategories, // Keep track of which came from Vagaro
      manualServiceCategories: manualCategories, // Keep track of manual ones
      quickFacts: quickFactsByMember[member.id] || [], // Add quick facts
      // Photo crop URLs for different formats
      cropSquareUrl: photoCrops.cropSquareUrl || null,
      cropCloseUpCircleUrl: photoCrops.cropCloseUpCircleUrl || null,
      cropMediumCircleUrl: photoCrops.cropMediumCircleUrl || null,
      cropFullVerticalUrl: photoCrops.cropFullVerticalUrl || null,
    }
  })

  return membersWithServices
}

export async function getTeamMembersByType(type: 'employee' | 'independent') {
  const db = getDb()

  const members = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.type, type),
        eq(teamMembers.isActive, true)
      )
    )
    .orderBy(teamMembers.displayOrder)

  return members
}

/**
 * Get team members who can perform a specific service
 * Looks at Vagaro data to find which employees are assigned to the service
 */
export async function getTeamMembersByServiceId(serviceId: string) {
  const db = getDb()

  // First, get the service to access its Vagaro data
  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1)

  if (!service || !service.vagaroData) {
    // If no Vagaro data, return all active team members as fallback
    return await getTeamMembers()
  }

  // Extract employee IDs from Vagaro service data
  const vagaroServiceData = service.vagaroData as any
  const employeeIds: string[] = []

  // Vagaro stores employees in servicePerformedBy array
  if (Array.isArray(vagaroServiceData.servicePerformedBy)) {
    for (const performer of vagaroServiceData.servicePerformedBy) {
      const employeeId = performer.serviceProviderId || performer.employeeId
      if (employeeId) {
        employeeIds.push(employeeId)
      }
    }
  }

  // If no employees found in Vagaro data, return all as fallback
  if (employeeIds.length === 0) {
    return await getTeamMembers()
  }

  // Fetch team members whose Vagaro employee ID is in the list
  const members = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        inArray(teamMembers.vagaroEmployeeId, employeeIds),
        eq(teamMembers.isActive, true)
      )
    )
    .orderBy(teamMembers.displayOrder)

  return members
}
