"use server"

import { getDb } from "@/db"
import { teamMembers } from "@/db/schema/team_members"
import { teamQuickFacts } from "@/db/schema/team_quick_facts"
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
 */
export async function getTeamMembersWithServices() {
  const db = getDb()

  const members = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.isActive, true))
    .orderBy(teamMembers.displayOrder)

  // Fetch all quick facts for all members in one query
  const memberIds = members.map(m => m.id)
  const allQuickFacts = memberIds.length > 0
    ? await db
        .select()
        .from(teamQuickFacts)
        .where(inArray(teamQuickFacts.teamMemberId, memberIds))
        .orderBy(asc(teamQuickFacts.displayOrder))
    : []

  // Group quick facts by member ID
  const quickFactsByMember = allQuickFacts.reduce((acc, fact) => {
    if (!acc[fact.teamMemberId]) {
      acc[fact.teamMemberId] = []
    }
    acc[fact.teamMemberId].push(fact)
    return acc
  }, {} as Record<string, typeof allQuickFacts>)

  // Fetch service categories for all members in parallel
  const membersWithServices = await Promise.all(
    members.map(async (member) => {
      // Get Vagaro-derived categories
      const vagaroCategories = await getServicesForTeamMember(member.vagaroEmployeeId)

      // Get manual categories (for services not in Vagaro like injectables)
      const manualCategories = (member.manualServiceCategories as string[]) || []

      // Merge and dedupe, keeping order: Vagaro first, then manual
      const allCategories = [...vagaroCategories]
      for (const cat of manualCategories) {
        if (!allCategories.includes(cat)) {
          allCategories.push(cat)
        }
      }

      return {
        ...member,
        serviceCategories: allCategories.slice(0, 4), // Max 4 tags
        vagaroServiceCategories: vagaroCategories, // Keep track of which came from Vagaro
        manualServiceCategories: manualCategories, // Keep track of manual ones
        quickFacts: quickFactsByMember[member.id] || [] // Add quick facts
      }
    })
  )

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
