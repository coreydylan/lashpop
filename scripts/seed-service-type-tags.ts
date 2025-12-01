/**
 * Seed Service Type tag category with hierarchical tags
 *
 * Creates a two-level hierarchy:
 * - Level 1: Service Categories (Lashes, Brows, Facials, etc.) - linked to service_categories
 * - Level 2: Individual Services (Brow Lamination, Classic Extensions, etc.) - linked to services
 *
 * This allows tagging assets at either the category or individual service level.
 */

import { config } from 'dotenv'
import { getDb } from '../src/db'
import { tagCategories } from '../src/db/schema/tag_categories'
import { tags } from '../src/db/schema/tags'
import { serviceCategories } from '../src/db/schema/service_categories'
import { services } from '../src/db/schema/services'
import { eq, isNotNull } from 'drizzle-orm'

config({ path: '.env.local' })

async function seedServiceTypeTags() {
  console.log('🏷️  Seeding Service Type tags with hierarchy...\n')

  const db = getDb()

  // 1. Create or update the "Service Type" tag category
  console.log('📁 Creating/updating Service Type category...')

  const [existingCategory] = await db
    .select()
    .from(tagCategories)
    .where(eq(tagCategories.name, 'service_type'))
    .limit(1)

  let categoryId: string

  if (existingCategory) {
    await db
      .update(tagCategories)
      .set({
        displayName: 'Service Type',
        description: 'Service categories and individual services - hierarchical tags linked to backend',
        color: '#8B5CF6',
        sortOrder: 5,
        isCollection: false,
        isRating: false,
        updatedAt: new Date()
      })
      .where(eq(tagCategories.id, existingCategory.id))

    categoryId = existingCategory.id
    console.log('  ✓ Updated existing Service Type category')
  } else {
    const [newCategory] = await db
      .insert(tagCategories)
      .values({
        name: 'service_type',
        displayName: 'Service Type',
        description: 'Service categories and individual services - hierarchical tags linked to backend',
        color: '#8B5CF6',
        sortOrder: 5,
        isCollection: false,
        isRating: false
      })
      .returning()

    categoryId = newCategory.id
    console.log('  ✓ Created Service Type category')
  }

  // 2. Get all service categories
  console.log('\n📂 Fetching service categories...')
  const allServiceCategories = await db
    .select()
    .from(serviceCategories)
    .orderBy(serviceCategories.displayOrder)

  console.log(`  Found ${allServiceCategories.length} service categories`)

  // 3. Get all active services with their category assignments
  console.log('\n📋 Fetching services...')
  const allServices = await db
    .select()
    .from(services)
    .where(isNotNull(services.categoryId))

  console.log(`  Found ${allServices.length} services with category assignments`)

  // 4. Create/update parent tags for each service category
  console.log('\n🏷️  Creating service category tags (Level 1)...')
  const parentTagMap = new Map<string, string>() // serviceCategoryId -> tagId

  for (const serviceCategory of allServiceCategories) {
    const tagName = `svc_cat_${serviceCategory.slug.replace(/-/g, '_')}`

    const [existingTag] = await db
      .select()
      .from(tags)
      .where(eq(tags.name, tagName))
      .limit(1)

    if (existingTag) {
      await db
        .update(tags)
        .set({
          categoryId,
          displayName: serviceCategory.name,
          description: serviceCategory.description || undefined,
          serviceCategoryId: serviceCategory.id,
          serviceId: null, // Category-level tags don't link to individual services
          parentTagId: null, // Top-level tags have no parent
          sortOrder: serviceCategory.displayOrder,
          updatedAt: new Date()
        })
        .where(eq(tags.id, existingTag.id))

      parentTagMap.set(serviceCategory.id, existingTag.id)
      console.log(`  ✓ Updated: ${serviceCategory.name}`)
    } else {
      const [newTag] = await db
        .insert(tags)
        .values({
          categoryId,
          name: tagName,
          displayName: serviceCategory.name,
          description: serviceCategory.description || undefined,
          serviceCategoryId: serviceCategory.id,
          serviceId: null,
          parentTagId: null,
          sortOrder: serviceCategory.displayOrder
        })
        .returning()

      parentTagMap.set(serviceCategory.id, newTag.id)
      console.log(`  ✓ Created: ${serviceCategory.name}`)
    }
  }

  // 5. Create/update child tags for each individual service
  console.log('\n🏷️  Creating individual service tags (Level 2)...')
  let servicesCreated = 0
  let servicesUpdated = 0
  let servicesSkipped = 0

  for (const service of allServices) {
    if (!service.categoryId) {
      servicesSkipped++
      continue
    }

    const parentTagId = parentTagMap.get(service.categoryId)
    if (!parentTagId) {
      console.log(`  ⚠ No parent tag for service: ${service.name} (category: ${service.categoryId})`)
      servicesSkipped++
      continue
    }

    const tagName = `svc_${service.slug.replace(/-/g, '_')}`

    const [existingTag] = await db
      .select()
      .from(tags)
      .where(eq(tags.name, tagName))
      .limit(1)

    if (existingTag) {
      await db
        .update(tags)
        .set({
          categoryId,
          displayName: service.name,
          description: service.description || undefined,
          serviceCategoryId: null, // Individual service tags link to services, not categories
          serviceId: service.id,
          parentTagId,
          sortOrder: service.displayOrder,
          updatedAt: new Date()
        })
        .where(eq(tags.id, existingTag.id))

      servicesUpdated++
    } else {
      await db
        .insert(tags)
        .values({
          categoryId,
          name: tagName,
          displayName: service.name,
          description: service.description || undefined,
          serviceCategoryId: null,
          serviceId: service.id,
          parentTagId,
          sortOrder: service.displayOrder
        })

      servicesCreated++
    }
  }

  console.log(`  ✓ Created: ${servicesCreated} service tags`)
  console.log(`  ✓ Updated: ${servicesUpdated} service tags`)
  if (servicesSkipped > 0) {
    console.log(`  ⚠ Skipped: ${servicesSkipped} services (no category assignment)`)
  }

  // 6. Clean up old flat tags that don't have the new naming convention
  console.log('\n🧹 Cleaning up old flat service type tags...')
  const oldTags = await db
    .select()
    .from(tags)
    .where(eq(tags.categoryId, categoryId))

  let cleaned = 0
  for (const tag of oldTags) {
    // Keep tags with the new naming convention
    if (tag.name.startsWith('svc_cat_') || tag.name.startsWith('svc_')) {
      continue
    }
    // Remove old flat tags (they had names like "lashes", "brows", etc.)
    await db.delete(tags).where(eq(tags.id, tag.id))
    cleaned++
  }

  if (cleaned > 0) {
    console.log(`  ✓ Removed ${cleaned} old flat tags`)
  } else {
    console.log(`  ✓ No old tags to clean up`)
  }

  console.log('\n✅ Service Type tags seeded successfully!')
  console.log(`  Category tags (Level 1): ${parentTagMap.size}`)
  console.log(`  Service tags (Level 2): ${servicesCreated + servicesUpdated}`)

  process.exit(0)
}

seedServiceTypeTags().catch((error) => {
  console.error('Error seeding service type tags:', error)
  process.exit(1)
})
