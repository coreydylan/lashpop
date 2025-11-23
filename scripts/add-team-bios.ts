import { getDb } from "../src/db"
import { teamMembers } from "../src/db/schema/team_members"
import { eq } from "drizzle-orm"

const sampleBios = {
  "Ashley Petersen": "With over 8 years of experience in the lash industry, Ashley has perfected the art of volume lash extensions. Her keen eye for detail and commitment to client satisfaction has made her one of the most sought-after lash artists in the area. She specializes in creating dramatic, full looks that last.",

  "Grace Ramos": "Grace brings elegance and precision to every lash application. Known for her natural, timeless designs, she excels at enhancing each client's unique features. Her calming presence and gentle technique make every appointment a relaxing experience.",

  "Elena Castellanos": "A true lash artist in every sense, Elena creates custom designs tailored to each client's eye shape and personal style. Her expertise in hybrid sets and innovative techniques keeps her at the forefront of lash artistry.",

  "Emily Rogers": "Specializing in lash lifts and tinting, Emily helps clients achieve beautiful, mascara-free looks that enhance their natural lashes. Her precise technique and attention to detail ensure stunning, long-lasting results.",
}

async function addBios() {
  const db = getDb()

  console.log("Adding sample bios to team members...")

  for (const [name, bio] of Object.entries(sampleBios)) {
    try {
      const result = await db
        .update(teamMembers)
        .set({ bio })
        .where(eq(teamMembers.name, name))
        .returning()

      if (result.length > 0) {
        console.log(`✓ Updated bio for ${name}`)
      } else {
        console.log(`⚠ No team member found with name: ${name}`)
      }
    } catch (error) {
      console.error(`✗ Error updating ${name}:`, error)
    }
  }

  console.log("\nDone!")
}

addBios()
  .catch((error) => {
    console.error("Script failed:", error)
    process.exit(1)
  })
