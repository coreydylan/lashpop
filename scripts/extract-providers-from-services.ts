/**
 * Extract service provider IDs from services
 */

import { config } from 'dotenv'
import { getVagaroClient } from '../src/lib/vagaro-client'

config({ path: '.env.local' })

async function extractProviders() {
  console.log('🔍 Extracting service providers from services...\n')

  try {
    const client = getVagaroClient()

    // Fetch all services
    const services = await client.getServices()
    console.log(`Found ${services?.length || 0} services\n`)

    // Extract unique service provider IDs
    const providerIds = new Set<string>()
    const providerDetails: any[] = []

    services.forEach((service: any) => {
      const performers = service.servicePerformedBy || []
      performers.forEach((performer: any) => {
        const id = performer.serviceProviderId || performer.employeeId
        const firstName = performer.firstName || performer.first_name || ''
        const lastName = performer.lastName || performer.last_name || ''
        const name = `${firstName} ${lastName}`.trim()

        if (id && !providerIds.has(id)) {
          providerIds.add(id)
          providerDetails.push({
            id,
            name,
            ...performer
          })
        }
      })
    })

    console.log(`\n📊 Found ${providerIds.size} unique service providers:\n`)
    providerDetails.forEach(provider => {
      console.log(`  - ${provider.name} (ID: ${provider.id})`)
    })

    // Show full details for first provider
    if (providerDetails.length > 0) {
      console.log(`\n📝 Sample provider data structure:`)
      console.log(JSON.stringify(providerDetails[0], null, 2))
    }

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

extractProviders()
