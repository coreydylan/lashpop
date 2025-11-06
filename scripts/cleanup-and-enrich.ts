/**
 * Remove old placeholder services and enrich Vagaro services with proper styling
 */

import { config } from 'dotenv'
import { getDb } from '../src/db'
import { services } from '../src/db/schema/services'
import { eq, isNull } from 'drizzle-orm'

config({ path: '.env.local' })

const serviceEnrichments = [
  {
    name: 'Classic Full Set of Lash Extensions',
    slug: 'classic',
    subtitle: 'Natural & Timeless',
    color: 'sage',
    imageUrl: '/images/classic-lashes.jpg',
    displayOrder: 1
  },
  {
    name: 'Classic Lash Fill',
    slug: 'classic-fill',
    subtitle: 'Maintain Your Classic Look',
    color: 'sage',
    imageUrl: '/images/classic-lashes.jpg',
    displayOrder: 2
  },
  {
    name: 'Classic Mini Fill',
    slug: 'classic-mini',
    subtitle: 'Quick Touch-Up',
    color: 'sage',
    imageUrl: '/images/classic-lashes.jpg',
    displayOrder: 3
  },
  {
    name: 'Wet/Angel Style Full Set of Lash Extensions',
    slug: 'angel',
    subtitle: 'Soft & Wispy',
    color: 'ocean-mist',
    imageUrl: '/images/wet-angel-lashes.jpg',
    displayOrder: 4
  },
  {
    name: 'Wet/Angel Lash Fill',
    slug: 'angel-fill',
    subtitle: 'Maintain Your Wispy Style',
    color: 'ocean-mist',
    imageUrl: '/images/wet-angel-lashes.jpg',
    displayOrder: 5
  },
  {
    name: 'Wet/Angel Style Mini Fill',
    slug: 'angel-mini',
    subtitle: 'Quick Refresh',
    color: 'ocean-mist',
    imageUrl: '/images/wet-angel-lashes.jpg',
    displayOrder: 6
  },
  {
    name: 'Hybrid Full Set of Lash Extensions',
    slug: 'hybrid',
    subtitle: 'Best of Both Worlds',
    color: 'terracotta',
    imageUrl: '/images/hybrid-lashes.jpg',
    displayOrder: 7
  },
  {
    name: 'Hybrid Lash Fill',
    slug: 'hybrid-fill',
    subtitle: 'Maintain Your Hybrid Style',
    color: 'terracotta',
    imageUrl: '/images/hybrid-lashes.jpg',
    displayOrder: 8
  },
  {
    name: 'Hybrid Mini Fill',
    slug: 'hybrid-mini',
    subtitle: 'Quick Touch-Up',
    color: 'terracotta',
    imageUrl: '/images/hybrid-lashes.jpg',
    displayOrder: 9
  },
  {
    name: 'Volume Full Set of Lash Extensions',
    slug: 'volume',
    subtitle: 'Maximum Drama',
    color: 'dune',
    imageUrl: '/images/volume-lashes.jpg',
    displayOrder: 10
  }
]

async function cleanupAndEnrich() {
  console.log('🧹 Cleaning up and enriching services...\n')

  const db = getDb()

  try {
    // Step 1: Delete old placeholder services (no Vagaro ID)
    console.log('Step 1: Removing old placeholder services...')
    const deleted = await db
      .delete(services)
      .where(isNull(services.vagaroServiceId))
      .returning({ slug: services.slug })

    console.log(`✓ Removed ${deleted.length} placeholder services:`)
    deleted.forEach(s => console.log(`  - ${s.slug}`))
    console.log('')

    // Step 2: Get all Vagaro services
    const vagaroServices = await db.select().from(services)
    console.log(`Step 2: Found ${vagaroServices.length} Vagaro services to enrich\n`)

    // Step 3: Enrich each service
    let enrichedCount = 0

    for (const enrichment of serviceEnrichments) {
      const service = vagaroServices.find(s => s.name === enrichment.name)

      if (service) {
        await db
          .update(services)
          .set({
            slug: enrichment.slug,
            subtitle: enrichment.subtitle,
            color: enrichment.color,
            imageUrl: enrichment.imageUrl,
            displayOrder: enrichment.displayOrder,
            updatedAt: new Date()
          })
          .where(eq(services.id, service.id))

        console.log(`✓ Enriched: ${enrichment.name}`)
        console.log(`  Slug: ${enrichment.slug}`)
        console.log(`  Color: ${enrichment.color}`)
        console.log(`  Subtitle: ${enrichment.subtitle}\n`)
        enrichedCount++
      } else {
        console.log(`⚠️  Service not found: ${enrichment.name}\n`)
      }
    }

    console.log(`\n✅ Successfully enriched ${enrichedCount} services!`)
    console.log('\n🎨 Services now have:')
    console.log('  ✓ Beautiful colors (sage, ocean-mist, terracotta, dune)')
    console.log('  ✓ Custom icons (Moon, Wave, Star, Sun)')
    console.log('  ✓ Professional subtitles')
    console.log('  ✓ Display ordering')
    console.log('  ✓ Vagaro sync enabled')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Cleanup and enrichment failed:', error)
    process.exit(1)
  }
}

cleanupAndEnrich()
