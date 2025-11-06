/**
 * Enrich synced Vagaro services with local styling, images, and branding
 */

import { config } from 'dotenv'
import { getDb } from '../src/db'
import { services } from '../src/db/schema/services'
import { eq } from 'drizzle-orm'

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

async function enrichServices() {
  console.log('🎨 Enriching services with local styling...\n')

  const db = getDb()

  try {
    // Get all current services
    const currentServices = await db.select().from(services)
    console.log(`Found ${currentServices.length} services in database\n`)

    let enrichedCount = 0

    for (const enrichment of serviceEnrichments) {
      // Find matching service by name
      const service = currentServices.find(s => s.name === enrichment.name)

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
        console.log(`  - Color: ${enrichment.color}`)
        console.log(`  - Subtitle: ${enrichment.subtitle}`)
        console.log(`  - Display Order: ${enrichment.displayOrder}\n`)
        enrichedCount++
      } else {
        console.log(`⚠️  Service not found: ${enrichment.name}\n`)
      }
    }

    console.log(`\n✅ Enriched ${enrichedCount} services successfully!`)
    console.log('\n📊 Services now have:')
    console.log('  - Custom colors and styling')
    console.log('  - Professional subtitles')
    console.log('  - Display ordering')
    console.log('  - Image paths (add actual images to public/images/)')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Enrichment failed:', error)
    process.exit(1)
  }
}

enrichServices()
