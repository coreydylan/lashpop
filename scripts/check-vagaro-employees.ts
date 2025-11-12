/**
 * Check what employees Vagaro is returning
 */

import { getVagaroClient } from '@/lib/vagaro-client'

async function checkVagaroEmployees() {
  console.log('🔍 Fetching employees from Vagaro API...\n')

  const client = getVagaroClient()

  // Check with status: 'active'
  console.log('--- Employees with status="active" ---')
  const activeEmployees = await client.getEmployees({ status: 'active' })
  console.log(`Found ${activeEmployees?.length || 0} active employees`)

  if (Array.isArray(activeEmployees)) {
    activeEmployees.forEach((emp: any) => {
      const firstName = emp.firstName || emp.first_name || ''
      const lastName = emp.lastName || emp.last_name || ''
      const name = `${firstName} ${lastName}`.trim()
      const id = emp.serviceProviderId || emp.employee_id
      console.log(`  - ${name} (ID: ${id})`)
    })
  }

  // Check without status filter
  console.log('\n--- All employees (no status filter) ---')
  const allEmployees = await client.getEmployees({})
  console.log(`Found ${allEmployees?.length || 0} total employees`)

  if (Array.isArray(allEmployees)) {
    allEmployees.forEach((emp: any) => {
      const firstName = emp.firstName || emp.first_name || ''
      const lastName = emp.lastName || emp.last_name || ''
      const name = `${firstName} ${lastName}`.trim()
      const id = emp.serviceProviderId || emp.employee_id
      const status = emp.status || 'unknown'
      console.log(`  - ${name} (ID: ${id}, Status: ${status})`)
    })
  }

  console.log(`\n📊 Summary:`)
  console.log(`  Active employees: ${activeEmployees?.length || 0}`)
  console.log(`  Total employees: ${allEmployees?.length || 0}`)
  console.log(`  Expected: 17`)
}

checkVagaroEmployees()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
