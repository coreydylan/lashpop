import "dotenv/config"
import { getDb } from "../src/db"
import { teamMembers } from "../src/db/schema/team_members"
import { getVagaroClient } from "../src/lib/vagaro-client"

async function checkVagaroSyncStatus() {
  const db = getDb()
  const client = getVagaroClient()

  console.log("=== VAGARO SYNC STATUS CHECK ===\n")

  // 1. Get all team members from database
  console.log("--- DATABASE TEAM MEMBERS ---")
  const allDbMembers = await db.select().from(teamMembers)
  
  console.log(`Total in database: ${allDbMembers.length}\n`)
  
  const withVagaroId: any[] = []
  const withoutVagaroId: any[] = []
  
  allDbMembers.forEach(m => {
    if (m.vagaroEmployeeId) {
      withVagaroId.push(m)
    } else {
      withoutVagaroId.push(m)
    }
  })

  console.log("WITH Vagaro Employee ID:")
  withVagaroId.forEach(m => {
    console.log(`  ✅ ${m.name} (ID: ${m.vagaroEmployeeId})`)
  })

  console.log("\nWITHOUT Vagaro Employee ID:")
  withoutVagaroId.forEach(m => {
    console.log(`  ❌ ${m.name}`)
  })

  // 2. Get all employees from Vagaro API
  console.log("\n\n--- VAGARO API EMPLOYEES ---")
  try {
    const employees = await client.getEmployees()
    console.log(`Total from Vagaro API: ${employees?.length || 0}\n`)

    if (employees && employees.length > 0) {
      console.log("Employees in Vagaro:")
      employees.forEach((emp: any) => {
        const firstName = emp.employeeFirstName || emp.firstName || emp.first_name || ''
        const lastName = emp.employeeLastName || emp.lastName || emp.last_name || ''
        const name = `${firstName} ${lastName}`.trim()
        const id = emp.serviceProviderId || emp.employee_id || emp.employeeId
        const status = emp.status || emp.employeeStatus || 'unknown'
        
        // Check if this employee is in our database
        const inDb = withVagaroId.find(m => m.vagaroEmployeeId === id)
        const dbMatch = inDb ? `✅ Linked to: ${inDb.name}` : '❌ NOT in database'
        
        console.log(`  - ${name} (ID: ${id}, Status: ${status})`)
        console.log(`    ${dbMatch}`)
      })
    }
  } catch (error) {
    console.error("Error fetching from Vagaro API:", error)
  }

  // 3. Cross-reference - find missing links
  console.log("\n\n--- POTENTIAL MATCHES FOR UNLINKED MEMBERS ---")
  try {
    const employees = await client.getEmployees()
    
    for (const unlinkedMember of withoutVagaroId) {
      console.log(`\nLooking for: "${unlinkedMember.name}"`)
      
      // Try to find a match by name
      const nameParts = unlinkedMember.name.toLowerCase().split(' ')
      const potentialMatches = employees?.filter((emp: any) => {
        const firstName = (emp.employeeFirstName || emp.firstName || emp.first_name || '').toLowerCase()
        const lastName = (emp.employeeLastName || emp.lastName || emp.last_name || '').toLowerCase()
        
        // Check if any name part matches
        return nameParts.some(part => 
          firstName.includes(part) || lastName.includes(part) ||
          part.includes(firstName) || part.includes(lastName)
        )
      }) || []

      if (potentialMatches.length > 0) {
        console.log("  Potential Vagaro matches:")
        potentialMatches.forEach((emp: any) => {
          const firstName = emp.employeeFirstName || emp.firstName || emp.first_name || ''
          const lastName = emp.employeeLastName || emp.lastName || emp.last_name || ''
          const id = emp.serviceProviderId || emp.employee_id || emp.employeeId
          console.log(`    - ${firstName} ${lastName} (ID: ${id})`)
        })
      } else {
        console.log("  No potential matches found in Vagaro")
      }
    }
  } catch (error) {
    console.error("Error:", error)
  }

  process.exit(0)
}

checkVagaroSyncStatus()






