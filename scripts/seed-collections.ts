/**
 * Seed initial Collections category and Lashes collection
 * Tags all existing assets with the Lashes collection
 */

import { config } from 'dotenv'
import { getDb } from '../src/db'
import { tagCategories } from '../src/db/schema/tag_categories'
import { tags } from '../src/db/schema/tags'
import { assets } from '../src/db/schema/assets'
import { assetTags } from '../src/db/schema/asset_tags'
import { eq } from 'drizzle-orm'

config({ path: '.env.local' })

async function seedCollections() {
  console.log('🌱 Seeding collections...')

  const db = getDb()

  try {
    // 1. Create the "Collection" category
    console.log('  Creating Collection category...')
    const [collectionCategory] = await db
      .insert(tagCategories)
      .values({
        name: 'collection',
        displayName: 'Collection',
        description: 'Organize assets into collections with different purposes',
        color: '#8B5CF6', // Purple
        icon: 'collection',
        sortOrder: 0, // Show first
        isCollection: true,
        permissions: {},
        defaultViewConfig: {},
      })
      .onConflictDoNothing({ target: tagCategories.name })
      .returning()

    if (!collectionCategory) {
      console.log('  ℹ️  Collection category already exists, fetching...')
      const existing = await db.query.tagCategories.findFirst({
        where: eq(tagCategories.name, 'collection'),
      })
      if (!existing) {
        throw new Error('Failed to create or find Collection category')
      }
    }

    // Get the collection category ID
    const category = await db.query.tagCategories.findFirst({
      where: eq(tagCategories.name, 'collection'),
    })

    if (!category) {
      throw new Error('Collection category not found')
    }

    // 2. Create the "Lashes" collection tag
    console.log('  Creating Lashes collection tag...')
    const [lashesTag] = await db
      .insert(tags)
      .values({
        categoryId: category.id,
        name: 'lashes',
        displayName: 'Lashes',
        description: 'Lash work and portfolio photos',
        sortOrder: 0,
      })
      .onConflictDoNothing()
      .returning()

    // Get the lashes tag ID
    const lashesTagRecord = lashesTag || await db.query.tags.findFirst({
      where: (tags, { eq, and }) =>
        and(eq(tags.categoryId, category.id), eq(tags.name, 'lashes')),
    })

    if (!lashesTagRecord) {
      throw new Error('Failed to create or find Lashes tag')
    }

    // 3. Tag all existing assets with the Lashes collection
    console.log('  Tagging existing assets with Lashes collection...')
    const allAssets = await db.query.assets.findMany()

    console.log(`  Found ${allAssets.length} assets to tag`)

    if (allAssets.length > 0) {
      // Create asset_tags records for all assets
      const assetTagsToInsert = allAssets.map(asset => ({
        assetId: asset.id,
        tagId: lashesTagRecord.id,
      }))

      await db
        .insert(assetTags)
        .values(assetTagsToInsert)
        .onConflictDoNothing()

      console.log(`  ✓ Tagged ${allAssets.length} assets with Lashes collection`)
    }

    console.log('✅ Collections seeded successfully!')
    console.log(`  - Collection category created`)
    console.log(`  - Lashes collection created`)
    console.log(`  - ${allAssets.length} assets tagged`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seedCollections()
