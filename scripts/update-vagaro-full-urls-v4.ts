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
  let csvContent = fs.readFileSync(csvPath, 'utf-8')

  // Normalize line endings
  csvContent = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const entries: { name: string; url: string }[] = []

  // Extract URLs with the pattern: src=""URL""
  const urlRegex = /src=""(https:\/\/www\.vagaro\.com\/\/resources\/WidgetEmbeddedLoader\/[^""]+)/g

  const urls: string[] = []
  let urlMatch
  while ((urlMatch = urlRegex.exec(csvContent)) !== null) {
    urls.push(urlMatch[1])
  }

  // Extract service names
  const nameRegex = /^([^,\n]+),"/gm
  const names: string[] = []
  let nameMatch
  while ((nameMatch = nameRegex.exec(csvContent)) !== null) {
    const name = nameMatch[1].trim()
    if (name && name !== 'name') {
      names.push(name)
    }
  }

  // Match them up
  for (let i = 0; i < Math.min(names.length, urls.length); i++) {
    entries.push({ name: names[i], url: urls[i] })
  }

  console.log(`Matched ${entries.length} services\n`)

  const db = getDb()
  let updated = 0
  let notFound = 0

  for (const entry of entries) {
    // Use RETURNING to check if update happened
    const result = await db.execute(sql`
      UPDATE services
      SET vagaro_widget_url = ${entry.url}
      WHERE name = ${entry.name}
      RETURNING name
    `)

    // Check if any rows were returned (meaning update happened)
    const rows = result as any[]
    if (rows && rows.length > 0) {
      updated++
      console.log(`✓ ${entry.name}`)
    } else {
      notFound++
      console.log(`✗ Not found: ${entry.name}`)
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
    LIMIT 3
  `)
  console.log('\nSample of updated services:')
  for (const row of sample as any) {
    console.log(`  ${row.name}`)
    console.log(`    URL: ...${row.vagaro_widget_url?.slice(-60) || 'null'}`)
  }

  process.exit(0)
}

updateServices().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
