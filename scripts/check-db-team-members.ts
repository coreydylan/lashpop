import "dotenv/config"
import { getDb } from "../src/db"
import { teamMembers } from "../src/db/schema/team_members"
import { services } from "../src/db/schema/services"
import { isNotNull, and, eq } from "drizzle-orm"

async function checkDbTeamMembers() {
  const db = getDb()

  console.log("=== DATABASE TEAM MEMBERS STATUS ===\n")

  // Get all team members
  const allMembers = await db.select().from(teamMembers).orderBy(teamMembers.name)
  
  console.log(`Total team members: ${allMembers.length}\n`)

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

  console.log("--- TEAM MEMBER DETAILS ---\n")

  for (const member of allMembers) {
    console.log(`${member.name}`)
    console.log(`  Active: ${member.isActive ? 'Yes' : 'No'}`)
    console.log(`  Vagaro Employee ID: ${member.vagaroEmployeeId || 'NOT SET'}`)
    console.log(`  Type: ${member.type}`)
    console.log(`  Business Name: ${member.businessName || 'N/A'}`)
    
    // Check service assignments
    if (member.vagaroEmployeeId) {
      const memberServices: string[] = []
      
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
        console.log(`  Service Categories: ${cleanedCategories.join(', ')}`)
      } else {
        console.log(`  Service Categories: NONE FOUND (employee ID exists but no service matches)`)
      }
    } else {
      console.log(`  Service Categories: Cannot determine (no Vagaro ID)`)
    }
    
    // Show specialties fallback
    if (member.specialties && Array.isArray(member.specialties) && member.specialties.length > 0) {
      console.log(`  Specialties (fallback): ${(member.specialties as string[]).join(', ')}`)
    }
    
    console.log('')
  }

  // Summary
  const withVagaroId = allMembers.filter(m => m.vagaroEmployeeId).length
  const withoutVagaroId = allMembers.filter(m => !m.vagaroEmployeeId).length
  const activeMembers = allMembers.filter(m => m.isActive).length

  console.log("\n--- SUMMARY ---")
  console.log(`Active members: ${activeMembers}`)
  console.log(`With Vagaro ID: ${withVagaroId}`)
  console.log(`Without Vagaro ID: ${withoutVagaroId}`)

  console.log("\nMembers WITHOUT Vagaro ID:")
  allMembers.filter(m => !m.vagaroEmployeeId).forEach(m => {
    console.log(`  - ${m.name}`)
  })

  process.exit(0)
}

checkDbTeamMembers()


