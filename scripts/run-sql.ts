/**
 * Run SQL file directly
 */

import { config } from 'dotenv'
import { getDb } from '../src/db'
import { sql } from 'drizzle-orm'
import fs from 'fs'

config({ path: '.env.local' })

async function runSQL() {
  console.log('🔄 Running SQL...')

  const db = getDb()
  const sqlContent = fs.readFileSync('scripts/add-vagaro-columns.sql', 'utf-8')

  try {
    await db.execute(sql.raw(sqlContent))
    console.log('✅ SQL executed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ SQL execution failed:', error)
    process.exit(1)
  }
}

runSQL()
