import "dotenv/config"
import { db } from "@/db"
import { teamMembers } from "@/db/schema/team_members"

async function checkTeamMembers() {
  console.log("Checking team members in database...\n")

  const allMembers = await db.select().from(teamMembers).orderBy(teamMembers.name)

  console.log(`Total team members in database: ${allMembers.length}\n`)

  console.log("Team members list:")
  console.log("==================")
  allMembers.forEach((member, index) => {
    console.log(`${index + 1}. ${member.name}`)
    console.log(`   - Type: ${member.type}`)
    console.log(`   - Business: ${member.businessName || 'N/A'}`)
    console.log(`   - Has Bio: ${member.bio ? 'Yes' : 'No'}`)
    console.log(`   - Vagaro ID: ${member.vagaroEmployeeId || 'None'}`)
    console.log()
  })

  // Check for the specific members that were added
  const namesAdded = ["Grace Ramos", "Kelly R", "Adrianna Arnaud", "Kim Starnes", "Nancy"]

  console.log("\nChecking specifically for members that were added:")
  console.log("==================================================")
  for (const name of namesAdded) {
    const found = allMembers.find(m => m.name === name)
    if (found) {
      console.log(`✅ ${name} - Found (ID: ${found.id})`)
    } else {
      console.log(`❌ ${name} - Not found`)
    }
  }

  // Check for any duplicates
  console.log("\nChecking for duplicates:")
  console.log("========================")
  const nameCount = new Map<string, number>()
  allMembers.forEach(member => {
    const count = nameCount.get(member.name) || 0
    nameCount.set(member.name, count + 1)
  })

  const duplicates = Array.from(nameCount.entries()).filter(([_, count]) => count > 1)
  if (duplicates.length > 0) {
    console.log("Found duplicates:")
    duplicates.forEach(([name, count]) => {
      console.log(`  - ${name}: ${count} entries`)
    })
  } else {
    console.log("No duplicates found")
  }
}

checkTeamMembers().catch(console.error)