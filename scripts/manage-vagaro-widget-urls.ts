/**
 * Manage Vagaro Widget URLs for Services
 *
 * This script helps you:
 * 1. View all services and their current widget URL status
 * 2. Update widget URLs for individual services
 * 3. Bulk update widget URLs from a JSON file
 *
 * Usage:
 *   npx tsx scripts/manage-vagaro-widget-urls.ts list          # List all services
 *   npx tsx scripts/manage-vagaro-widget-urls.ts update <slug> <url>  # Update single service
 *   npx tsx scripts/manage-vagaro-widget-urls.ts bulk <file>   # Bulk update from JSON
 *   npx tsx scripts/manage-vagaro-widget-urls.ts export        # Export current URLs to JSON
 */

import { config } from 'dotenv'
import { getDb } from '../src/db'
import { services } from '../src/db/schema/services'
import { eq } from 'drizzle-orm'
import * as fs from 'fs'
import * as path from 'path'

config({ path: '.env.local' })

interface ServiceWidgetUrl {
  slug: string
  name: string
  vagaroWidgetUrl: string | null
}

async function listServices() {
  console.log('📋 Services and Vagaro Widget URLs:\n')
  console.log('=' .repeat(100))

  const db = getDb()
  const allServices = await db
    .select({
      id: services.id,
      name: services.name,
      slug: services.slug,
      vagaroWidgetUrl: services.vagaroWidgetUrl,
      mainCategory: services.mainCategory,
      subCategory: services.subCategory,
      isActive: services.isActive,
    })
    .from(services)
    .orderBy(services.mainCategory, services.subCategory, services.displayOrder)

  let currentCategory = ''
  let currentSubcategory = ''
  let withUrl = 0
  let withoutUrl = 0

  for (const service of allServices) {
    // Print category headers
    if (service.mainCategory !== currentCategory) {
      currentCategory = service.mainCategory
      console.log(`\n🏷️  ${currentCategory}`)
      console.log('-'.repeat(80))
    }
    if (service.subCategory !== currentSubcategory) {
      currentSubcategory = service.subCategory || ''
      if (currentSubcategory) {
        console.log(`   📁 ${currentSubcategory}`)
      }
    }

    const hasUrl = !!service.vagaroWidgetUrl
    const status = hasUrl ? '✅' : '❌'
    const activeStatus = service.isActive ? '' : ' (inactive)'

    if (hasUrl) withUrl++
    else withoutUrl++

    console.log(`      ${status} ${service.name}${activeStatus}`)
    console.log(`         slug: ${service.slug}`)
    if (hasUrl) {
      // Truncate long URLs for display
      const shortUrl = service.vagaroWidgetUrl!.length > 60
        ? service.vagaroWidgetUrl!.substring(0, 60) + '...'
        : service.vagaroWidgetUrl
      console.log(`         url: ${shortUrl}`)
    }
  }

  console.log('\n' + '='.repeat(100))
  console.log(`\n📊 Summary:`)
  console.log(`   Total services: ${allServices.length}`)
  console.log(`   With widget URL: ${withUrl} ✅`)
  console.log(`   Without widget URL: ${withoutUrl} ❌`)
  console.log(`\n💡 To update a service URL:`)
  console.log(`   npx tsx scripts/manage-vagaro-widget-urls.ts update <slug> "<url>"`)
}

async function updateService(slug: string, url: string) {
  const db = getDb()

  // Verify service exists
  const [existing] = await db
    .select({ name: services.name })
    .from(services)
    .where(eq(services.slug, slug))
    .limit(1)

  if (!existing) {
    console.error(`❌ Service with slug "${slug}" not found`)
    process.exit(1)
  }

  // Update the URL
  await db
    .update(services)
    .set({
      vagaroWidgetUrl: url,
      updatedAt: new Date(),
    })
    .where(eq(services.slug, slug))

  console.log(`✅ Updated widget URL for "${existing.name}"`)
  console.log(`   Slug: ${slug}`)
  console.log(`   URL: ${url.substring(0, 80)}...`)
}

async function bulkUpdate(filePath: string) {
  const absolutePath = path.resolve(filePath)

  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ File not found: ${absolutePath}`)
    process.exit(1)
  }

  const data: ServiceWidgetUrl[] = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'))
  const db = getDb()

  console.log(`📥 Loading ${data.length} service URLs from ${filePath}\n`)

  let updated = 0
  let failed = 0

  for (const item of data) {
    if (!item.slug || !item.vagaroWidgetUrl) {
      console.log(`⏭️  Skipping ${item.slug || 'unknown'} - missing data`)
      continue
    }

    try {
      const result = await db
        .update(services)
        .set({
          vagaroWidgetUrl: item.vagaroWidgetUrl,
          updatedAt: new Date(),
        })
        .where(eq(services.slug, item.slug))

      console.log(`✅ ${item.slug}`)
      updated++
    } catch (error) {
      console.log(`❌ ${item.slug} - ${error}`)
      failed++
    }
  }

  console.log(`\n📊 Results:`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Failed: ${failed}`)
}

async function exportUrls() {
  const db = getDb()
  const allServices = await db
    .select({
      slug: services.slug,
      name: services.name,
      vagaroWidgetUrl: services.vagaroWidgetUrl,
      mainCategory: services.mainCategory,
      subCategory: services.subCategory,
    })
    .from(services)
    .orderBy(services.mainCategory, services.subCategory, services.displayOrder)

  const output: ServiceWidgetUrl[] = allServices.map(s => ({
    slug: s.slug,
    name: s.name,
    vagaroWidgetUrl: s.vagaroWidgetUrl,
  }))

  const outputPath = 'vagaro-widget-urls.json'
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))

  console.log(`✅ Exported ${output.length} services to ${outputPath}`)
  console.log(`\n💡 Edit this file and run:`)
  console.log(`   npx tsx scripts/manage-vagaro-widget-urls.ts bulk ${outputPath}`)
}

async function main() {
  const [command, ...args] = process.argv.slice(2)

  switch (command) {
    case 'list':
      await listServices()
      break
    case 'update':
      if (args.length < 2) {
        console.error('Usage: npx tsx scripts/manage-vagaro-widget-urls.ts update <slug> <url>')
        process.exit(1)
      }
      await updateService(args[0], args[1])
      break
    case 'bulk':
      if (args.length < 1) {
        console.error('Usage: npx tsx scripts/manage-vagaro-widget-urls.ts bulk <file.json>')
        process.exit(1)
      }
      await bulkUpdate(args[0])
      break
    case 'export':
      await exportUrls()
      break
    default:
      console.log(`
Vagaro Widget URL Manager

Usage:
  npx tsx scripts/manage-vagaro-widget-urls.ts list
    List all services and their widget URL status

  npx tsx scripts/manage-vagaro-widget-urls.ts update <slug> "<url>"
    Update widget URL for a single service

  npx tsx scripts/manage-vagaro-widget-urls.ts bulk <file.json>
    Bulk update widget URLs from a JSON file

  npx tsx scripts/manage-vagaro-widget-urls.ts export
    Export current service data to JSON for editing
`)
  }

  process.exit(0)
}

main()
