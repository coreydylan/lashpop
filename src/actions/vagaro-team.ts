'use server'

import { getVagaroClient } from '@/lib/vagaro-client'

/**
 * Fetch all team members (employees) from Vagaro API
 */
export async function getVagaroTeamMembers() {
  try {
    const client = getVagaroClient()

    // First get locations to iterate through
    const locations = await client.getLocations()

    // Fetch employees for each location and deduplicate
    const allEmployees = new Map()

    for (const location of locations) {
      try {
        const employees = await client.getEmployees(location.location_id)

        for (const employee of employees) {
          if (employee.status === 'active' && !allEmployees.has(employee.employee_id)) {
            allEmployees.set(employee.employee_id, {
              id: employee.employee_id,
              name: `${employee.first_name} ${employee.last_name}`,
              firstName: employee.first_name,
              lastName: employee.last_name,
              email: employee.email,
              phone: employee.phone,
              locations: employee.locations,
              services: employee.services,
            })
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch employees for location ${location.location_id}:`, error)
        // Continue with other locations
      }
    }

    return Array.from(allEmployees.values())
  } catch (error) {
    console.error('Failed to fetch Vagaro team members:', error)
    throw new Error('Failed to fetch team members from Vagaro')
  }
}

/**
 * Fetch a specific team member by ID
 */
export async function getVagaroTeamMember(employeeId: string) {
  try {
    const client = getVagaroClient()
    const employee = await client.getEmployee(employeeId)

    return {
      id: employee.employee_id,
      name: `${employee.first_name} ${employee.last_name}`,
      firstName: employee.first_name,
      lastName: employee.last_name,
      email: employee.email,
      phone: employee.phone,
      locations: employee.locations,
      services: employee.services,
      status: employee.status,
    }
  } catch (error) {
    console.error(`Failed to fetch Vagaro team member ${employeeId}:`, error)
    throw new Error(`Failed to fetch team member from Vagaro`)
  }
}

/**
 * Get team members who can perform a specific service
 */
export async function getVagaroTeamMembersByService(serviceId: string) {
  try {
    const allMembers = await getVagaroTeamMembers()
    return allMembers.filter(member => member.services.includes(serviceId))
  } catch (error) {
    console.error(`Failed to fetch team members for service ${serviceId}:`, error)
    throw new Error('Failed to fetch team members for service')
  }
}
