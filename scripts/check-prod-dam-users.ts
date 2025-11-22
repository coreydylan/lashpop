import { config } from "dotenv"
import postgres from "postgres"

config({ path: ".env.local" })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set")
}

// Phone numbers to check
const phoneNumbers = [
  "+17602244206", // (760) 224-4206
  "+17605195930", // (760) 519-5930
  "+17602120448", // 760-212-0448
  "+17605000616", // The working number
]

async function checkDAMUsers(dbUrl: string) {
  const sql = postgres(dbUrl, { max: 1 })

  try {
    console.log("🔍 Checking DAM users in PRODUCTION database...\n")
    console.log("Database:", dbUrl.includes("supabase") ? "Supabase Production" : "Unknown")
    console.log("")

    for (const phoneNumber of phoneNumbers) {
      // Check if user exists
      const existingUsers = await sql`
        SELECT id, phone_number, name, dam_access, created_at
        FROM "user"
        WHERE phone_number = ${phoneNumber}
      `

      if (existingUsers.length > 0) {
        const user = existingUsers[0]
        console.log(`✓ User found: ${phoneNumber}`)
        console.log(`  ID: ${user.id}`)
        console.log(`  Name: ${user.name || "(no name)"}`)
        console.log(`  DAM Access: ${user.dam_access ? "✅ YES" : "❌ NO"}`)
        console.log(`  Created: ${user.created_at}`)

        if (!user.dam_access) {
          console.log(`  ⚠️ USER EXISTS BUT DOES NOT HAVE DAM ACCESS!`)
        }
      } else {
        console.log(`❌ USER NOT FOUND: ${phoneNumber}`)
        console.log(`  This user needs to be created in the production database`)
      }
      console.log("")
    }

    // Also check total users with DAM access
    const damUsers = await sql`
      SELECT COUNT(*) as count
      FROM "user"
      WHERE dam_access = true
    `
    console.log(`📊 Total users with DAM access: ${damUsers[0].count}`)

    // List all users with DAM access
    const allDamUsers = await sql`
      SELECT phone_number, name, created_at
      FROM "user"
      WHERE dam_access = true
      ORDER BY created_at DESC
    `
    console.log("\n📋 All users with DAM access:")
    allDamUsers.forEach(user => {
      console.log(`  - ${user.phone_number} ${user.name ? `(${user.name})` : ""}`)
    })

  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    await sql.end()
  }
}

checkDAMUsers(databaseUrl)