import "dotenv/config"
import { db } from "@/db"
import { teamMembers } from "@/db/schema/team_members"

async function analyzeDuplicates() {
  const allMembers = await db.select().from(teamMembers).orderBy(teamMembers.name)

  console.log("Potential duplicates and matches:")
  console.log("=================================\n")

  // Check for similar names
  const potentialMatches = [
    { bio: "Kelly R", vagaro: "Kelly Richter" },
    { bio: "Nancy", vagaro: "Nancy Greidanus" },
    { bio: "Kim Starnes", vagaro: "Kimberly Starnes" },
    { bio: "Adrianna Arnaud", vagaro: "Adrianna Payne" }
  ]

  for (const match of potentialMatches) {
    console.log(`Checking: ${match.bio} vs ${match.vagaro}`)

    const bioMember = allMembers.find(m => m.name === match.bio)
    const vagaroMember = allMembers.find(m => m.name === match.vagaro)

    if (bioMember && vagaroMember) {
      console.log(`  ⚠️  Both exist as separate entries:`)
      console.log(`      ${match.bio}: Type=${bioMember.type}, Business=${bioMember.businessName}, Has Bio=${!!bioMember.bio}`)
      console.log(`      ${match.vagaro}: Type=${vagaroMember.type}, Vagaro ID=${vagaroMember.vagaroEmployeeId}`)
      console.log(`      -> These might be the same person!`)
    } else if (bioMember && !vagaroMember) {
      console.log(`  ✅ Only ${match.bio} exists`)
    } else if (!bioMember && vagaroMember) {
      console.log(`  ✅ Only ${match.vagaro} exists`)
    }
    console.log()
  }

  // Check Renee Belton duplicates
  console.log("Renee Belton entries:")
  console.log("====================")
  const reneeEntries = allMembers.filter(m => m.name === "Renee Belton")
  reneeEntries.forEach((entry, i) => {
    console.log(`${i + 1}. ID: ${entry.id}`)
    console.log(`   Type: ${entry.type}`)
    console.log(`   Business: ${entry.businessName || 'N/A'}`)
    console.log(`   Vagaro ID: ${entry.vagaroEmployeeId || 'None'}`)
    console.log(`   Has Bio: ${!!entry.bio}`)
    console.log()
  })

  console.log("Recommendation:")
  console.log("==============")
  console.log("1. Merge Kelly R with Kelly Richter (if same person)")
  console.log("2. Merge Nancy with Nancy Greidanus (if same person)")
  console.log("3. Merge Kim Starnes with Kimberly Starnes (if same person)")
  console.log("4. Merge Adrianna Arnaud with Adrianna Payne (if same person)")
  console.log("5. Keep only one Renee Belton entry (the one with bio and business name)")
}

analyzeDuplicates().catch(console.error)