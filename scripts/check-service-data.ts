import { getDb } from '../src/db'
import { services } from '../src/db/schema/services'
import { teamMembers } from '../src/db/schema/team_members'
import { like } from 'drizzle-orm'

async function checkServiceData() {
  const db = getDb()

  console.log('=== Checking Service with Lash Extensions ===')
  const lashServices = await db
    .select()
    .from(services)
    .where(like(services.name, '%Full Set%'))
    .limit(1)

  if (lashServices.length > 0) {
    const service = lashServices[0]
    console.log(`\nService: ${service.name}`)
    console.log(`Has vagaroData: ${!!service.vagaroData}`)

    if (service.vagaroData) {
      const data = service.vagaroData as any
      console.log('\nVagaro Data structure:')
      console.log('Keys:', Object.keys(data))

      if (data.servicePerformedBy) {
        console.log(`\nNumber of performers: ${data.servicePerformedBy.length}`)
        console.log('\nFirst 3 performers:')
        data.servicePerformedBy.slice(0, 3).forEach((p: any, i: number) => {
          console.log(`${i + 1}. Provider ID: ${p.serviceProviderId || p.employeeId}`)
          console.log(`   Name: ${p.employeeFirstName} ${p.employeeLastName}`)
        })

        // Extract employee IDs
        const employeeIds = data.servicePerformedBy.map((p: any) => p.serviceProviderId || p.employeeId)
        console.log('\nAll employee IDs from service:')
        console.log(employeeIds)

        // Check which team members match
        console.log('\n=== Checking Team Member Matches ===')
        const allTeamMembers = await db.select().from(teamMembers)
        console.log(`Total team members in DB: ${allTeamMembers.length}`)

        const matchingMembers = allTeamMembers.filter(m =>
          employeeIds.includes(m.vagaroEmployeeId)
        )
        console.log(`Matching team members: ${matchingMembers.length}`)

        if (matchingMembers.length > 0) {
          console.log('\nMatching team members:')
          matchingMembers.forEach(m => {
            console.log(`- ${m.name} (Vagaro ID: ${m.vagaroEmployeeId})`)
          })
        }

        // Show team member IDs for comparison
        console.log('\n=== All Team Member Vagaro IDs (first 5) ===')
        allTeamMembers.slice(0, 5).forEach(m => {
          console.log(`${m.name}: ${m.vagaroEmployeeId}`)
        })
      }
    }
  }

  process.exit(0)
}

checkServiceData()
