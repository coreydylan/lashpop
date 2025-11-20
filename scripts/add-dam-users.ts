import { config } from "dotenv"
import postgres from "postgres"

config({ path: ".env.local" })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set")
}

// Phone numbers to add (in E.164 format)
const phoneNumbers = [
  "+17602244206", // (760) 224-4206
  "+17605195930", // (760) 519-5930
  "+17602120448", // 760-212-0448
]

async function addDAMUsers(dbUrl: string) {
  const sql = postgres(dbUrl, { max: 1 })

  try {
    console.log("🔍 Checking for existing users...\n")

    for (const phoneNumber of phoneNumbers) {
      // Check if user exists
      const existingUsers = await sql`
        SELECT id, phone_number, name, dam_access
        FROM "user"
        WHERE phone_number = ${phoneNumber}
      `

      if (existingUsers.length > 0) {
        const user = existingUsers[0]
        console.log(`✓ User found: ${phoneNumber}`)
        console.log(`  Name: ${user.name || "(no name)"}`)
        console.log(`  Current DAM access: ${user.dam_access}`)

        if (!user.dam_access) {
          // Grant DAM access
          await sql`
            UPDATE "user"
            SET dam_access = true, updated_at = NOW()
            WHERE id = ${user.id}
          `
          console.log(`  ✅ DAM access granted!\n`)
        } else {
          console.log(`  ℹ️  Already has DAM access\n`)
        }
      } else {
        console.log(`⚠️  User not found: ${phoneNumber}`)
        console.log(`  Creating new user with DAM access...`)

        // Create new user with DAM access
        const result = await sql`
          INSERT INTO "user" (id, phone_number, phone_number_verified, dam_access, created_at, updated_at)
          VALUES (
            gen_random_uuid()::text,
            ${phoneNumber},
            true,
            true,
            NOW(),
            NOW()
          )
          RETURNING id
        `
        console.log(`  ✅ User created with DAM access!\n`)
      }
    }

    console.log("🎉 All done!")
    console.log("\n📋 Summary:")
    console.log("The following phone numbers now have DAM access:")
    phoneNumbers.forEach((phone) => console.log(`  • ${phone}`))
  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    await sql.end()
  }
}

addDAMUsers(databaseUrl)
