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

  // The CSV has doubled quotes ("") for escaping
  // Extract URLs with the pattern: src=""URL""
  const urlRegex = /src=""(https:\/\/www\.vagaro\.com\/\/resources\/WidgetEmbeddedLoader\/[^""]+)/g

  // First, get all URLs
  const urls: string[] = []
  let urlMatch
  while ((urlMatch = urlRegex.exec(csvContent)) !== null) {
    urls.push(urlMatch[1])
  }

  console.log(`Found ${urls.length} URLs in CSV`)

  // Now extract service names - they appear at the start of lines before ,"<div
  const nameRegex = /^([^,\n]+),"/gm
  const names: string[] = []
  let nameMatch
  while ((nameMatch = nameRegex.exec(csvContent)) !== null) {
    const name = nameMatch[1].trim()
    if (name && name !== 'name') { // Skip header
      names.push(name)
    }
  }

  console.log(`Found ${names.length} service names in CSV`)

  // Match them up
  for (let i = 0; i < Math.min(names.length, urls.length); i++) {
    entries.push({ name: names[i], url: urls[i] })
  }

  console.log(`Matched ${entries.length} services\n`)

  if (entries.length === 0) {
    console.log('No entries found, exiting')
    process.exit(1)
  }

  // Show first few
  console.log('First 3 entries:')
  entries.slice(0, 3).forEach(e => console.log(`  ${e.name} -> ...${e.url.slice(-30)}`))
  console.log('')

  const db = getDb()
  let updated = 0
  let notFound = 0

  for (const entry of entries) {
    const result = await db.execute(sql`
      UPDATE services
      SET vagaro_widget_url = ${entry.url}
      WHERE name = ${entry.name}
    `)

    if (result.rowCount && result.rowCount > 0) {
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

  process.exit(0)
}

updateServices().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
