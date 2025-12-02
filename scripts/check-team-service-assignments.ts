import "dotenv/config"
import { getDb } from "../src/db"
import { teamMembers } from "../src/db/schema/team_members"
import { services } from "../src/db/schema/services"
import { eq, isNotNull, and } from "drizzle-orm"

async function checkTeamServiceAssignments() {
  const db = getDb()

  console.log("Checking team member service assignments from Vagaro data...\n")

  // Get all team members
  const allMembers = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.isActive, true))

  console.log(`Total active team members: ${allMembers.length}\n`)

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

  // For each team member, find their services
  for (const member of allMembers) {
    const memberServices: string[] = []

    if (!member.vagaroEmployeeId) {
      console.log(`❌ ${member.name}: No Vagaro Employee ID`)
      continue
    }

    for (const service of allServices) {
      const vagaroData = service.vagaroData as any
      if (!vagaroData?.servicePerformedBy) continue

      const performers = vagaroData.servicePerformedBy || []
      const isPerformer = performers.some((p: any) => {
        const employeeId = p.serviceProviderId || p.employeeId
        return employeeId === member.vagaroEmployeeId
      })

      if (isPerformer) {
        memberServices.push(service.mainCategory)
      }
    }

    const uniqueCategories = [...new Set(memberServices)]
    const cleanedCategories = uniqueCategories.map(cat =>
      cat.replace(' Services', '').replace(' Service', '')
    )

    if (cleanedCategories.length > 0) {
      console.log(`✅ ${member.name} (ID: ${member.vagaroEmployeeId}):`)
      console.log(`   Services: ${cleanedCategories.join(', ')}`)
      console.log(`   (${memberServices.length} total service assignments)`)
    } else {
      console.log(`⚠️  ${member.name} (ID: ${member.vagaroEmployeeId}): No services assigned`)
    }
  }

  // Also check sample service data structure
  console.log("\n\n--- Sample Service Vagaro Data ---")
  const sampleService = allServices[0]
  if (sampleService?.vagaroData) {
    const data = sampleService.vagaroData as any
    console.log(`Service: ${sampleService.name}`)
    console.log(`Main Category: ${sampleService.mainCategory}`)
    if (data.servicePerformedBy) {
      console.log(`Performers (${data.servicePerformedBy.length}):`)
      data.servicePerformedBy.slice(0, 3).forEach((p: any) => {
        console.log(`  - ID: ${p.serviceProviderId || p.employeeId}`)
      })
    }
  }

  process.exit(0)
}

checkTeamServiceAssignments()






