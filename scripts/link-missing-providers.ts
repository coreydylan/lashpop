import "dotenv/config"
import { getDb } from "../src/db"
import { teamMembers } from "../src/db/schema/team_members"
import { eq } from "drizzle-orm"

async function linkMissingProviders() {
  const db = getDb()
  
  console.log("Linking missing providers to their Vagaro IDs...\n")
  
  // Elena Castellanos = FvhyEymQRTKo9-nRndP75A== (Fibroblast, Jet Plasma)
  console.log("1. Linking Elena Castellanos to Vagaro ID FvhyEymQRTKo9-nRndP75A==")
  
  // First, delete the placeholder "Provider FvhyEymQ" entry
  await db.delete(teamMembers).where(eq(teamMembers.name, "Provider FvhyEymQ"))
  console.log("   Deleted placeholder 'Provider FvhyEymQ'")
  
  // Update Elena with the Vagaro ID
  await db.update(teamMembers)
    .set({ vagaroEmployeeId: "FvhyEymQRTKo9-nRndP75A==" })
    .where(eq(teamMembers.name, "Elena Castellanos"))
  console.log("   Updated Elena Castellanos with Vagaro ID")
  
  // Check if ZipXlWazgkJdp2WGMrneEg== might be Renee (has brow services)
  // Note: That ID has "Lash Lift, Faux Freckles, Brow Shaping" which could match Renee's brow services
  console.log("\n2. Checking if ZipXlWazgkJdp2WGMrneEg== could be Renee Belton...")
  console.log("   Renee does: Microblading, Brow Lamination, Brow Shaping, Facial Waxing")
  console.log("   This Vagaro ID has: Lash Lift, Faux Freckles, Brow Shaping")
  console.log("   Could be a partial match - needs manual verification")
  
  // Let's check the Provider aIIWzGWd (facials) 
  console.log("\n3. Provider aIIWzGWd has Facials services - might be another person or unused")
  
  // Verify the changes
  console.log("\n--- VERIFICATION ---\n")
  const elena = await db.select().from(teamMembers).where(eq(teamMembers.name, "Elena Castellanos"))
  console.log(`Elena Castellanos: Vagaro ID = ${elena[0]?.vagaroEmployeeId || 'NOT SET'}`)
  
  const remaining = await db.select().from(teamMembers).orderBy(teamMembers.name)
  const withoutId = remaining.filter(m => !m.vagaroEmployeeId && m.isActive)
  
  console.log(`\nTeam members still without Vagaro ID:`)
  withoutId.forEach(m => {
    console.log(`  - ${m.name} (${m.businessName || 'N/A'})`)
  })
  
  console.log("\n✅ Done!")
  process.exit(0)
}

linkMissingProviders()

