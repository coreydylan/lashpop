'use server'

import { getVagaroClient } from '@/lib/vagaro-client'

/**
 * Fetch all team members (employees) from Vagaro API
 */
export async function getVagaroTeamMembers() {
  try {
    const client = getVagaroClient()

    // Fetch all active employees
    const employees = await client.getEmployees({ status: 'active' })

    // Transform to frontend format
    return employees.map(employee => ({
      id: employee.employee_id,
      name: `${employee.first_name} ${employee.last_name}`,
      firstName: employee.first_name,
      lastName: employee.last_name,
      email: employee.email,
      phone: employee.phone,
      locations: employee.locations,
      services: employee.services,
    }))
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
