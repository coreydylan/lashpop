import "dotenv/config"
import { getDb } from "../src/db"
import { services } from "../src/db/schema/services"
import { isNotNull, and, eq } from "drizzle-orm"

async function findMissingProviders() {
  const db = getDb()

  console.log("=== SEARCHING FOR MISSING PROVIDERS IN SERVICE DATA ===\n")

  // Get all services with Vagaro data
  const allServices = await db
    .select()
    .from(services)
    .where(
      and(
        isNotNull(services.vagaroData),
        eq(services.isActive, true)
      )
    )

  console.log(`Total services with Vagaro data: ${allServices.length}\n`)

  // Collect all unique provider IDs and names
  const providers = new Map<string, { firstName: string, lastName: string, services: string[] }>()

  for (const service of allServices) {
    const vagaroData = service.vagaroData as any
    if (!vagaroData?.servicePerformedBy) continue

    for (const performer of vagaroData.servicePerformedBy) {
      const employeeId = performer.serviceProviderId || performer.employeeId
      const firstName = performer.employeeFirstName || performer.firstName || ''
      const lastName = performer.employeeLastName || performer.lastName || ''

      if (employeeId) {
        if (!providers.has(employeeId)) {
          providers.set(employeeId, { firstName, lastName, services: [] })
        }
        providers.get(employeeId)!.services.push(service.name)
      }
    }
  }

  console.log(`Found ${providers.size} unique providers in service data\n`)

  console.log("--- ALL PROVIDERS IN VAGARO SERVICES ---\n")
  
  // Sort by name
  const sortedProviders = Array.from(providers.entries()).sort((a, b) => {
    const nameA = `${a[1].firstName} ${a[1].lastName}`.toLowerCase()
    const nameB = `${b[1].firstName} ${b[1].lastName}`.toLowerCase()
    return nameA.localeCompare(nameB)
  })

  for (const [id, data] of sortedProviders) {
    console.log(`${data.firstName} ${data.lastName}`)
    console.log(`  ID: ${id}`)
    console.log(`  Services: ${[...new Set(data.services.map(s => s.split(' ').slice(0, 3).join(' ')))].slice(0, 5).join(', ')}...`)
    console.log('')
  }

  // Search for specific names
  console.log("\n--- SEARCHING FOR MISSING TEAM MEMBERS ---\n")
  const searchNames = ['elena', 'kimberly', 'kim', 'grace', 'renee', 'cat']
  
  for (const searchName of searchNames) {
    console.log(`Searching for "${searchName}"...`)
    const matches = sortedProviders.filter(([_, data]) => {
      const fullName = `${data.firstName} ${data.lastName}`.toLowerCase()
      return fullName.includes(searchName)
    })
    
    if (matches.length > 0) {
      matches.forEach(([id, data]) => {
        console.log(`  FOUND: ${data.firstName} ${data.lastName} (ID: ${id})`)
      })
    } else {
      console.log(`  No matches found`)
    }
  }

  process.exit(0)
}

findMissingProviders()

