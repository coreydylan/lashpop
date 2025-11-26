/**
 * Update services with full Vagaro widget URLs (including ?v= param) from CSV
 */

import { config } from 'dotenv'
import { getDb } from '../src/db'
import { sql } from 'drizzle-orm'
import * as fs from 'fs'
import * as path from 'path'

config({ path: '.env.local' })

async function updateServices() {
  console.log('🔄 Parsing CSV and updating services with full Vagaro widget URLs...\n')

  const csvPath = path.join(process.env.HOME || '', 'Desktop', 'vagaro_embed_codes.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')

  // Split by lines - each service spans multiple lines
  // Format: name,"<embed code>"
  const entries: { name: string; url: string }[] = []

  // Match pattern: service name at start of line, followed by embed code with URL
  const regex = /^([^,\n]+),".*?src=""(https:\/\/www\.vagaro\.com\/\/resources\/WidgetEmbeddedLoader\/[^""#]+)/gm

  let match
  while ((match = regex.exec(csvContent)) !== null) {
    entries.push({
      name: match[1].trim(),
      url: match[2]
    })
  }

  console.log(`Found ${entries.length} services in CSV\n`)

  const db = getDb()
  let updated = 0
  let notFound = 0

  for (const entry of entries) {
    // Try exact match first
    let result = await db.execute(sql`
      UPDATE services
      SET vagaro_widget_url = ${entry.url}
      WHERE name = ${entry.name}
    `)

    if (result.rowCount && result.rowCount > 0) {
      updated++
      console.log(`✓ ${entry.name}`)
    } else {
      // Try case-insensitive match
      result = await db.execute(sql`
        UPDATE services
        SET vagaro_widget_url = ${entry.url}
        WHERE LOWER(name) = LOWER(${entry.name})
      `)

      if (result.rowCount && result.rowCount > 0) {
        updated++
        console.log(`✓ ${entry.name} (case-insensitive)`)
      } else {
        notFound++
        console.log(`✗ Not found: ${entry.name}`)
      }
    }
  }

  console.log(`\n✅ Updated ${updated} services`)
  if (notFound > 0) {
    console.log(`⚠️  ${notFound} services not found in database`)
  }

  // Verify
  const sample = await db.execute(sql`
    SELECT name, vagaro_widget_url
    FROM services
    WHERE vagaro_widget_url LIKE '%?v=%'
    ORDER BY name
    LIMIT 5
  `)
  console.log('\nSample of updated services:')
  for (const row of sample as any) {
    console.log(`  ${row.name}: ...${row.vagaro_widget_url.slice(-50)}`)
  }

  process.exit(0)
}

updateServices().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
