/**
 * Update services with full Vagaro widget URLs from CSV
 *
 * This stores the complete URL including the ?v= parameter
 */

import { config } from 'dotenv'
import { getDb } from '../src/db'
import { sql } from 'drizzle-orm'
import * as fs from 'fs'
import * as path from 'path'

config({ path: '.env.local' })

interface ServiceMapping {
  name: string;
  fullUrl: string;
}

function parseCSV(csvContent: string): ServiceMapping[] {
  const mappings: ServiceMapping[] = [];

  // Match pattern: service name followed by the widget URL
  const regex = /^([^,]+),".*?src=""(https:\/\/www\.vagaro\.com\/\/resources\/WidgetEmbeddedLoader\/[^""#]+)/gm;

  let match;
  while ((match = regex.exec(csvContent)) !== null) {
    mappings.push({
      name: match[1],
      fullUrl: match[2]
    });
  }

  return mappings;
}

async function updateServices() {
  console.log('🔄 Updating services with full Vagaro widget URLs...\n')

  const csvPath = path.join(process.env.HOME || '', 'Desktop', 'vagaro_embed_codes.csv')

  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found:', csvPath)
    process.exit(1)
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8')

  // Simple line-by-line parsing
  const lines = csvContent.split('\n')
  const db = getDb()

  let updated = 0
  let notFound = 0

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    // Extract service name (before first comma and quote)
    const nameMatch = line.match(/^([^,]+),/)
    if (!nameMatch) continue

    const serviceName = nameMatch[1].trim()

    // Extract full URL with ?v= parameter
    const urlMatch = line.match(/src=""(https:\/\/www\.vagaro\.com\/\/resources\/WidgetEmbeddedLoader\/[^""#]+)/)
    if (!urlMatch) continue

    const fullUrl = urlMatch[1]

    // Update in database
    const result = await db.execute(sql`
      UPDATE services
      SET vagaro_widget_url = ${fullUrl}
      WHERE name = ${serviceName}
    `)

    if (result.rowCount && result.rowCount > 0) {
      updated++
      console.log(`✓ ${serviceName}`)
    } else {
      notFound++
      console.log(`✗ Not found: ${serviceName}`)
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
