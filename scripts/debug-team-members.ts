import { getDb } from '../src/db'
import { teamMembers } from '../src/db/schema/team_members'
import { services } from '../src/db/schema/services'
import { eq } from 'drizzle-orm'

async function debugTeamMembers() {
  const db = getDb()

  console.log('=== Checking Team Members ===')
  const allMembers = await db.select().from(teamMembers)
  console.log(`Total team members: ${allMembers.length}`)
  console.log('Active team members:', allMembers.filter(m => m.isActive).length)

  if (allMembers.length > 0) {
    console.log('\nFirst 3 team members:')
    allMembers.slice(0, 3).forEach(m => {
      console.log(`- ${m.name} (ID: ${m.id}, Vagaro ID: ${m.vagaroEmployeeId}, Active: ${m.isActive})`)
    })
  }

  console.log('\n=== Checking Services ===')
  const allServices = await db.select().from(services)
  console.log(`Total services: ${allServices.length}`)

  if (allServices.length > 0) {
    const firstService = allServices[0]
    console.log(`\nFirst service: ${firstService.name}`)
    console.log(`Vagaro Service ID: ${firstService.vagaroServiceId}`)
    console.log(`Has vagaroData: ${!!firstService.vagaroData}`)

    if (firstService.vagaroData) {
      const data = firstService.vagaroData as any
      console.log(`servicePerformedBy exists: ${!!data.servicePerformedBy}`)
      if (data.servicePerformedBy) {
        console.log(`Number of performers: ${data.servicePerformedBy.length}`)
        if (data.servicePerformedBy.length > 0) {
          console.log('First performer:', data.servicePerformedBy[0])
        }
      }
    }
  }

  process.exit(0)
}

debugTeamMembers()
