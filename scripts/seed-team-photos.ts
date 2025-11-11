import { config } from "dotenv"
import { getDb } from "../src/db"
import { teamMembers } from "../src/db/schema/team_members"
import { teamMemberPhotos } from "../src/db/schema/team_member_photos"
import { eq } from "drizzle-orm"

config({ path: ".env.local" })

async function seedTeamMemberPhotos() {
  const db = getDb()

  console.log("🖼️ Starting team member photos seed...")

  // First, clear existing team member photos
  console.log("🧹 Clearing existing team member photos...")
  await db.delete(teamMemberPhotos)

  // Get all active team members
  const members = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.isActive, true))

  console.log(`📋 Found ${members.length} active team members`)

  // Map of team member names to their photos
  const memberPhotos: Record<string, { fileName: string, filePath: string }> = {
    "Emily Rogers": {
      fileName: "emily-rogers.jpeg",
      filePath: "/lashpop-images/team/emily-rogers.jpeg"
    },
    "Rachel Edwards": {
      fileName: "rachel-edwards.jpeg",
      filePath: "/lashpop-images/team/rachel-edwards.jpeg"
    },
    "Ryann Alcorn": {
      fileName: "ryann-alcorn.png",
      filePath: "/lashpop-images/team/ryann-alcorn.png"
    },
    "Ashley Petersen": {
      fileName: "ashley-petersen.jpg",
      filePath: "/lashpop-images/team/ashley-petersen.jpg"
    },
    "Ava Mata": {
      fileName: "ava-mata.jpg",
      filePath: "/lashpop-images/team/ava-mata.jpg"
    },
    "Savannah Scherer": {
      fileName: "savannah-scherer.jpeg",
      filePath: "/lashpop-images/team/savannah-scherer.jpeg"
    },
    "Renee Belton": {
      fileName: "renee-belton.jpg",
      filePath: "/lashpop-images/team/renee-belton.jpg"
    },
    "Grace Ramos": {
      fileName: "grace-ramos.jpg",
      filePath: "/lashpop-images/team/grace-ramos.jpg"
    },
    "Evie Ells": {
      fileName: "evie-ells.jpg",
      filePath: "/lashpop-images/team/evie-ells.jpg"
    },
    "Kelly Katona": {
      fileName: "kelly-katona.jpeg",
      filePath: "/lashpop-images/team/kelly-katona.jpeg"
    },
    "Elena Castellanos": {
      fileName: "elena-castellanos.jpeg",
      filePath: "/lashpop-images/team/elena-castellanos.jpeg"
    },
    "Bethany Peterson": {
      fileName: "bethany-peterson.jpeg",
      filePath: "/lashpop-images/team/bethany-peterson.jpeg"
    },
    "Haley Walker": {
      fileName: "haley-walker.jpg",
      filePath: "/lashpop-images/team/haley-walker.jpg"
    },
    "Adrianna Arnaud": {
      fileName: "adrianna-arnaud.jpg",
      filePath: "/lashpop-images/team/adrianna-arnaud.jpg"
    }
  }

  // Insert primary photos for each team member
  for (const member of members) {
    const photoData = memberPhotos[member.name]

    if (!photoData) {
      console.log(`⚠️  No photo found for ${member.name}`)
      continue
    }

    try {
      await db.insert(teamMemberPhotos).values({
        teamMemberId: member.id,
        fileName: photoData.fileName,
        filePath: photoData.filePath,
        isPrimary: true,
        // Default crop for close-up circle (can be adjusted later in UI)
        cropCloseUpCircle: {
          x: 50,  // Center horizontally
          y: 25,  // 25% from top
          scale: 2.0  // 200% zoom
        }
      })

      console.log(`✅ Added primary photo for ${member.name}`)
    } catch (error) {
      console.error(`❌ Failed to add photo for ${member.name}:`, error)
    }
  }

  console.log("✨ Team member photos seeding complete!")
  process.exit(0)
}

seedTeamMemberPhotos().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})