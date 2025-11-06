import { config } from "dotenv"
import postgres from "postgres"

config({ path: ".env.local" })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set")
}

// Tables we want to KEEP
const keepTables = [
  'customers',
  'service_categories',
  'services',
  'team_members',
  'testimonials'
]

async function cleanupTables(dbUrl: string) {
  const sql = postgres(dbUrl, { max: 1 })

  try {
    console.log("🔍 Finding tables to remove...")

    // Get all tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `

    // Filter to tables we want to DROP
    const tablesToDrop = tables
      .map(t => t.table_name)
      .filter(name => !keepTables.includes(name))

    if (tablesToDrop.length === 0) {
      console.log("✅ No tables to drop!")
      return
    }

    console.log(`\n📋 Tables to drop (${tablesToDrop.length}):`)
    tablesToDrop.forEach(t => console.log(`  ❌ ${t}`))

    console.log("\n🗑️  Dropping tables...")

    // Drop tables one by one (CASCADE to handle dependencies)
    for (const tableName of tablesToDrop) {
      try {
        await sql.unsafe(`DROP TABLE IF EXISTS "${tableName}" CASCADE`)
        console.log(`  ✓ Dropped ${tableName}`)
      } catch (error) {
        console.error(`  ✗ Failed to drop ${tableName}:`, error)
      }
    }

    // Also clean up any orphaned enums
    console.log("\n🧹 Cleaning up enums...")
    const enums = await sql`
      SELECT t.typname as enum_name
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      GROUP BY t.typname
    `

    const keepEnums = ['membership', 'team_member_type']
    const enumsToDrop = enums
      .map(e => e.enum_name)
      .filter(name => !keepEnums.includes(name))

    for (const enumName of enumsToDrop) {
      try {
        await sql.unsafe(`DROP TYPE IF EXISTS "${enumName}" CASCADE`)
        console.log(`  ✓ Dropped enum ${enumName}`)
      } catch (error) {
        console.error(`  ✗ Failed to drop enum ${enumName}:`, error)
      }
    }

    console.log("\n✅ Cleanup completed!")

    // Show remaining tables
    const remainingTables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `

    console.log(`\n📋 Remaining tables (${remainingTables.length}):`)
    remainingTables.forEach(t => console.log(`  ✓ ${t.table_name}`))

  } catch (error) {
    console.error("❌ Error:", error)
    throw error
  } finally {
    await sql.end()
  }
}

cleanupTables(databaseUrl)
