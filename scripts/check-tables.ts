import { config } from "dotenv"
import postgres from "postgres"

config({ path: ".env.local" })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set")
}

async function checkTables(dbUrl: string) {
  const sql = postgres(dbUrl, { max: 1 })

  try {
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    console.log("📋 Tables in database:")
    tables.forEach((t) => console.log(`  ✓ ${t.table_name}`))
  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    await sql.end()
  }
}

checkTables(databaseUrl)
