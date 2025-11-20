import { config } from "dotenv"
import postgres from "postgres"

config({ path: ".env.local" })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set")
}

// Phone numbers to verify
const phoneNumbers = [
  "+17602244206", // (760) 224-4206
  "+17605195930", // (760) 519-5930
  "+17602120448", // 760-212-0448
]

async function verifyDAMUsers(dbUrl: string) {
  const sql = postgres(dbUrl, { max: 1 })

  try {
    console.log("🔍 Verifying DAM users...\n")

    for (const phoneNumber of phoneNumbers) {
      const users = await sql`
        SELECT id, phone_number, name, email, dam_access, phone_number_verified, created_at
        FROM "user"
        WHERE phone_number = ${phoneNumber}
      `

      if (users.length > 0) {
        const user = users[0]
        console.log(`✅ ${phoneNumber}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Name: ${user.name || "(not set)"}`)
        console.log(`   Email: ${user.email || "(not set)"}`)
        console.log(`   DAM Access: ${user.dam_access ? "✓ GRANTED" : "✗ NOT GRANTED"}`)
        console.log(`   Phone Verified: ${user.phone_number_verified ? "✓" : "✗"}`)
        console.log(`   Created: ${user.created_at}\n`)
      } else {
        console.log(`❌ ${phoneNumber} - NOT FOUND\n`)
      }
    }

    console.log("✨ Verification complete!")
  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    await sql.end()
  }
}

verifyDAMUsers(databaseUrl)
