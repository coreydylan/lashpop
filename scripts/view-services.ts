/**
 * View all services in the database
 */

import { config } from 'dotenv'
import { getDb } from '../src/db'
import { services } from '../src/db/schema/services'

config({ path: '.env.local' })

async function viewServices() {
  console.log('📋 Current Services in Database:\n')

  const db = getDb()
  const allServices = await db.select().from(services).orderBy(services.displayOrder)

  console.log(`Total: ${allServices.length} services\n`)

  for (const service of allServices) {
    console.log(`${service.displayOrder}. ${service.name}`)
    console.log(`   Slug: ${service.slug}`)
    console.log(`   Vagaro ID: ${service.vagaroServiceId || 'none'}`)
    console.log(`   Color: ${service.color}`)
    console.log(`   Subtitle: ${service.subtitle}`)
    console.log(`   Active: ${service.isActive}\n`)
  }

  process.exit(0)
}

viewServices()
