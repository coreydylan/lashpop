/**
 * Update services with full Vagaro widget URLs from generated JSON
 */

import { config } from 'dotenv'
import { getDb } from '../src/db'
import { sql } from 'drizzle-orm'
import * as fs from 'fs'
import * as path from 'path'

config({ path: '.env.local' })

interface ServiceMapping {
  name: string;
  serviceCode: string;
  fullUrl: string;
}

async function updateServices() {
  console.log('🔄 Updating services with full Vagaro widget URLs from JSON...\n')

  const jsonPath = path.join(__dirname, 'vagaro-service-codes.json')
  const mappings: ServiceMapping[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

  const db = getDb()

  let updated = 0
  let notFound = 0

  for (const mapping of mappings) {
    const result = await db.execute(sql`
      UPDATE services
      SET vagaro_widget_url = ${mapping.fullUrl}
      WHERE name = ${mapping.name}
    `)

    if (result.rowCount && result.rowCount > 0) {
      updated++
      console.log(`✓ ${mapping.name}`)
    } else {
      notFound++
      console.log(`✗ Not found: ${mapping.name}`)
    }
  }

  console.log(`\n✅ Updated ${updated} services with full URLs`)
  if (notFound > 0) {
    console.log(`⚠️  ${notFound} services not found in database`)
  }

  // Verify
  const sample = await db.execute(sql`
    SELECT name, vagaro_widget_url
    FROM services
    WHERE vagaro_widget_url IS NOT NULL
    ORDER BY name
    LIMIT 3
  `)
  console.log('\nSample:')
  console.log(sample)

  process.exit(0)
}

updateServices().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
