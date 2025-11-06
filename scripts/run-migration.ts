/**
 * Run latest migration directly
 */

import { config } from 'dotenv'
import { getDb } from '../src/db'
import { sql } from 'drizzle-orm'
import fs from 'fs'

config({ path: '.env.local' })

async function runMigration() {
  console.log('🔄 Running migration...')

  const db = getDb()
  const migration = fs.readFileSync('drizzle/0004_gigantic_micromax.sql', 'utf-8')
  const statements = migration
    .split('-->')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('statement-breakpoint'))

  try {
    for (const statement of statements) {
      if (statement.startsWith('--') || statement === 'statement-breakpoint') continue // Skip comments
      console.log(`  Executing: ${statement.substring(0, 60)}...`)
      await db.execute(sql.raw(statement))
    }

    console.log('✅ Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
