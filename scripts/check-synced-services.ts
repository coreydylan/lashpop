import { getDb } from '../src/db'
import { services } from '../src/db/schema/services'
import { teamMembers } from '../src/db/schema/team_members'
import { isNotNull } from 'drizzle-orm'

async function checkSyncedServices() {
  const db = getDb()

  const servicesWithData = await db.select().from(services).where(isNotNull(services.vagaroData))
  console.log(`Services with vagaroData: ${servicesWithData.length}`)

  if (servicesWithData.length > 0) {
    console.log('\nFirst 5 services with data:')
    servicesWithData.slice(0, 5).forEach(s => {
      console.log(`\n- ${s.name} (Vagaro ID: ${s.vagaroServiceId})`)
      const data = s.vagaroData as any
      if (data?.servicePerformedBy) {
        console.log(`  Performers: ${data.servicePerformedBy.length}`)
        const employeeIds = data.servicePerformedBy.map((p: any) => p.serviceProviderId || p.employeeId)
        console.log(`  First performer ID: ${employeeIds[0]}`)
      }
    })

    // Check team member matching
    console.log('\n=== Checking Team Member Matching ===')
    const firstService = servicesWithData[0]
    const data = firstService.vagaroData as any

    if (data?.servicePerformedBy) {
      const employeeIds = data.servicePerformedBy.map((p: any) => p.serviceProviderId || p.employeeId)
      console.log(`\nService: ${firstService.name}`)
      console.log(`Employee IDs from service: ${employeeIds.join(', ')}`)

      const allTeamMembers = await db.select().from(teamMembers)
      const matchingMembers = allTeamMembers.filter(m => employeeIds.includes(m.vagaroEmployeeId))

      console.log(`\nTotal team members in DB: ${allTeamMembers.length}`)
      console.log(`Matching team members: ${matchingMembers.length}`)

      if (matchingMembers.length > 0) {
        console.log('\nMatching team members:')
        matchingMembers.forEach(m => {
          console.log(`  - ${m.name} (ID: ${m.vagaroEmployeeId})`)
        })
      } else {
        console.log('\nNo matching team members found!')
        console.log('\nSample team member IDs from DB:')
        allTeamMembers.slice(0, 3).forEach(m => {
          console.log(`  - ${m.name}: ${m.vagaroEmployeeId}`)
        })
      }
    }
  } else {
    console.log('\nNo services have vagaroData!')
  }

  process.exit(0)
}

checkSyncedServices()
