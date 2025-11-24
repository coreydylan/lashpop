import "dotenv/config"
import { getDb } from "../src/db"
import { teamMembers } from "../src/db/schema/team_members"
import { eq } from "drizzle-orm"

async function check() {
  const db = getDb()
  
  // Check who has these IDs - the ones with facial/plasma services
  const ids = [
    'FvhyEymQRTKo9-nRndP75A==',  // Fibroblast, Jet Plasma
    'aIIWzGWdsxtJHz1TR7f6xQ==',  // Facials
    'ZipXlWazgkJdp2WGMrneEg=='   // Lash Lift, Faux Freckles
  ]
  
  console.log("Checking Vagaro provider IDs...\n")
  
  for (const id of ids) {
    const member = await db.select().from(teamMembers).where(eq(teamMembers.vagaroEmployeeId, id))
    if (member.length > 0) {
      console.log(`ID: ${id}`)
      console.log(`  => ${member[0].name} (active: ${member[0].isActive})`)
    } else {
      console.log(`ID: ${id}`)
      console.log(`  => NOT IN DATABASE`)
    }
    console.log('')
  }

  // Also check who is missing Vagaro ID
  console.log("\n--- MEMBERS WITHOUT VAGARO ID ---\n")
  const allMembers = await db.select().from(teamMembers)
  const missing = allMembers.filter(m => !m.vagaroEmployeeId)
  
  for (const m of missing) {
    console.log(`${m.name}`)
    console.log(`  Business: ${m.businessName || 'N/A'}`)
    console.log(`  Specialties: ${(m.specialties as string[])?.join(', ') || 'None'}`)
    console.log('')
  }
  
  process.exit(0)
}

check()

