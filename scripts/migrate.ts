import { config } from "dotenv"
import postgres from "postgres"
import { readFileSync } from "fs"
import { join } from "path"

config({ path: ".env.local" })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set")
}

async function runMigration(dbUrl: string) {
  const sql = postgres(dbUrl, { max: 1 })

  try {
    console.log("🚀 Running migration...")

    // Read the new migration file
    const migrationSQL = readFileSync(
      join(process.cwd(), "drizzle/0001_sticky_tomas.sql"),
      "utf-8"
    )

    // Execute the migration
    await sql.unsafe(migrationSQL)

    console.log("✅ Migration completed successfully!")
  } catch (error) {
    console.error("❌ Migration failed:", error)
    throw error
  } finally {
    await sql.end()
  }
}

runMigration(databaseUrl)
