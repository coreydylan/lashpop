import { config } from "dotenv"
import postgres from "postgres"

config({ path: ".env.local" })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set")
}

// Test phone numbers
const testNumbers = [
  { raw: "(760) 224-4206", formatted: "+17602244206" },
  { raw: "760-519-5930", formatted: "+17605195930" },
  { raw: "7602120448", formatted: "+17602120448" },
  { raw: "(760) 500-0616", formatted: "+17605000616" },
]

// Simulate the toE164 function from phone-utils
function toE164(phoneNumber: string, countryCode: string = '+1'): string {
  const digits = phoneNumber.replace(/\D/g, '')
  return `${countryCode}${digits}`
}

async function testLoginFlow(dbUrl: string) {
  const sql = postgres(dbUrl, { max: 1 })

  try {
    console.log("🔍 Testing login flow simulation...\n")

    for (const test of testNumbers) {
      console.log(`Testing: "${test.raw}"`)

      // Simulate what happens in the login form
      const formattedPhone = toE164(test.raw)
      console.log(`  1. toE164() converts to: ${formattedPhone}`)
      console.log(`  2. Expected: ${test.formatted}`)
      console.log(`  3. Match: ${formattedPhone === test.formatted ? "✅" : "❌"}`)

      // Check database with the formatted phone
      const users = await sql`
        SELECT id, phone_number, dam_access, phone_number_verified
        FROM "user"
        WHERE phone_number = ${formattedPhone}
        LIMIT 1
      `

      if (users.length > 0) {
        const user = users[0]
        console.log(`  4. Database lookup: ✅ Found`)
        console.log(`     - ID: ${user.id}`)
        console.log(`     - Phone in DB: ${user.phone_number}`)
        console.log(`     - DAM Access: ${user.dam_access ? "✅" : "❌"}`)
        console.log(`     - Phone Verified: ${user.phone_number_verified ? "✅" : "❌"}`)
      } else {
        console.log(`  4. Database lookup: ❌ NOT FOUND`)

        // Try to find similar numbers
        const similarUsers = await sql`
          SELECT phone_number
          FROM "user"
          WHERE phone_number LIKE ${'%' + formattedPhone.slice(-10) + '%'}
        `

        if (similarUsers.length > 0) {
          console.log(`     Similar numbers in DB:`)
          similarUsers.forEach(u => {
            console.log(`     - ${u.phone_number}`)
          })
        }
      }

      console.log("")
    }

    // Check for any sessions in the last hour
    console.log("📊 Recent login sessions (last hour):")
    const recentSessions = await sql`
      SELECT s.created_at, u.phone_number
      FROM session s
      JOIN "user" u ON s.user_id = u.id
      WHERE s.created_at > NOW() - INTERVAL '1 hour'
      ORDER BY s.created_at DESC
      LIMIT 10
    `

    if (recentSessions.length > 0) {
      recentSessions.forEach(session => {
        console.log(`  - ${session.phone_number} at ${session.created_at}`)
      })
    } else {
      console.log("  No recent sessions found")
    }

  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    await sql.end()
  }
}

testLoginFlow(databaseUrl)