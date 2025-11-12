/**
 * Sync service providers by fetching each one individually
 */

import { config } from 'dotenv'
import { getVagaroClient } from '../src/lib/vagaro-client'
import { syncTeamMember } from '../src/lib/vagaro-sync'

config({ path: '.env.local' })

async function syncProvidersIndividually() {
  console.log('🔄 Syncing service providers individually...\n')

  try {
    const client = getVagaroClient()

    // Fetch all services to get provider IDs
    const services = await client.getServices()
    console.log(`Found ${services?.length || 0} services\n`)

    // Extract unique service provider IDs
    const providerIds = new Set<string>()

    services.forEach((service: any) => {
      const performers = service.servicePerformedBy || []
      performers.forEach((performer: any) => {
        const id = performer.serviceProviderId || performer.employeeId
        if (id) {
          providerIds.add(id)
        }
      })
    })

    console.log(`Found ${providerIds.size} unique service provider IDs\n`)

    // Fetch each provider individually
    for (const providerId of Array.from(providerIds)) {
      try {
        console.log(`\nFetching provider: ${providerId}`)
        const employee = await client.getEmployee(providerId)

        // Log the full structure to see what we're getting
        console.log('  Raw data:', JSON.stringify(employee, null, 2))

        const firstName = employee.employeeFirstName || employee.first_name || employee.firstName || ''
        const lastName = employee.employeeLastName || employee.last_name || employee.lastName || ''
        const name = `${firstName} ${lastName}`.trim()

        console.log(`  ✓ Name: ${name}`)

        // Sync to database
        await syncTeamMember(employee)
      } catch (error) {
        console.error(`  ❌ Failed to fetch provider ${providerId}:`, error)
      }
    }

    console.log('\n✅ Provider sync complete')

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

syncProvidersIndividually()
