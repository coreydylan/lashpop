/**
 * Add vagaro_widget_url column to services table
 */

// Load env FIRST before any other imports
import { config } from 'dotenv'
// Try .env.local first (Next.js convention), then .env as fallback
let result = config({ path: '.env.local' })
if (result.error) {
  result = config({ path: '.env' })
  if (result.error) {
    console.error('Failed to load .env file:', result.error)
    process.exit(1)
  }
}

// Now import db after env is loaded
async function addColumn() {
  console.log('Adding vagaro_widget_url column to services table...')

  const { getDb } = await import('../src/db')
  const { sql } = await import('drizzle-orm')

  const db = getDb()

  try {
    await db.execute(sql`
      ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "vagaro_widget_url" text;
    `)
    console.log('✅ Column added successfully!')
  } catch (error) {
    console.error('❌ Failed:', error)
    throw error
  }
}

addColumn()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
