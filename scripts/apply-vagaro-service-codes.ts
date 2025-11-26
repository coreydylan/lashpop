/**
 * Apply Vagaro Service Codes Migration
 *
 * Adds the vagaro_service_code column and populates it from the CSV data
 */

import { config } from 'dotenv'
import { getDb } from '../src/db'
import { sql } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'

config({ path: '.env.local' })

async function applyMigration() {
  console.log('🔄 Applying Vagaro service code migration...\n')

  const db = getDb()

  // Step 1: Add the column if it doesn't exist
  console.log('1. Adding vagaro_service_code column...')
  const addColumnSql = fs.readFileSync(
    path.join(__dirname, '../drizzle/0022_add_vagaro_service_code.sql'),
    'utf-8'
  )

  try {
    await db.execute(sql.raw(addColumnSql))
    console.log('   ✓ Column added (or already exists)\n')
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('   ✓ Column already exists\n')
    } else {
      throw error
    }
  }

  // Step 2: Update services with their codes
  console.log('2. Updating services with Vagaro codes...')
  const updateSql = fs.readFileSync(
    path.join(__dirname, '../drizzle/0023_update_vagaro_service_codes.sql'),
    'utf-8'
  )

  try {
    await db.execute(sql.raw(updateSql))
    console.log('   ✓ Services updated\n')
  } catch (error) {
    console.error('   ✗ Update failed:', error)
    throw error
  }

  // Step 3: Verify the update
  console.log('3. Verifying update...')
  const result = await db.execute(sql`
    SELECT name, vagaro_service_code
    FROM services
    WHERE vagaro_service_code IS NOT NULL
    ORDER BY name
    LIMIT 10
  `)

  console.log('\n   Sample of updated services:')
  for (const row of result.rows as any[]) {
    console.log(`   - ${row.name}: ${row.vagaro_service_code}`)
  }

  const countResult = await db.execute(sql`
    SELECT COUNT(*) as total FROM services WHERE vagaro_service_code IS NOT NULL
  `)
  const count = (countResult.rows[0] as any).total

  console.log(`\n✅ Migration complete! ${count} services now have Vagaro codes.`)
  process.exit(0)
}

applyMigration().catch((error) => {
  console.error('\n❌ Migration failed:', error)
  process.exit(1)
})
