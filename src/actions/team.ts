"use server"

import { getDb } from "@/db"
import { teamMembers } from "@/db/schema/team_members"
import { services } from "@/db/schema/services"
import { and, eq, inArray } from "drizzle-orm"

export async function getTeamMembers() {
  const db = getDb()

  const members = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.isActive, true))
    .orderBy(teamMembers.displayOrder)

  return members
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
