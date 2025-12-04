/**
 * Seed script for Discovery AI tag category
 *
 * This creates a new tag category "AI Usage" with tags that allow
 * assets to be marked for use in the Discover Your Look AI agent.
 *
 * Run with: npx tsx scripts/seed-discovery-tags.ts
 */

import { db } from '@/db'
import { tagCategories } from '@/db/schema/tag_categories'
import { tags } from '@/db/schema/tags'
import { eq } from 'drizzle-orm'

const DISCOVERY_TAG_CATEGORY = {
  name: 'ai_usage',
  displayName: 'AI Usage',
  description: 'Tags for marking assets available to AI features like Discover Your Look',
  color: '#8B5CF6', // Purple to distinguish from other categories
  icon: 'sparkles',
  sortOrder: 100, // High number to show at end
  selectionMode: 'multi' as const,
  isCollection: false,
  isRating: false,
}

const DISCOVERY_TAGS = [
  {
    name: 'discover-look',
    displayName: 'Discover Your Look',
    description: 'Available for the Discover Your Look AI agent to show during conversations',
    sortOrder: 1,
  },
  {
    name: 'before-after',
    displayName: 'Before/After',
    description: 'Before and after comparison images for service results',
    sortOrder: 2,
  },
  {
    name: 'style-showcase',
    displayName: 'Style Showcase',
    description: 'High-quality showcase images for specific styles (classic, hybrid, volume, etc.)',
    sortOrder: 3,
  },
  {
    name: 'educational',
    displayName: 'Educational',
    description: 'Images explaining processes, techniques, or maintenance',
    sortOrder: 4,
  },
  {
    name: 'inspiration',
    displayName: 'Inspiration',
    description: 'Inspirational looks to help clients visualize possibilities',
    sortOrder: 5,
  },
]

// Style-specific tags for filtering
const STYLE_TAGS = [
  { name: 'style-classic', displayName: 'Classic Style', sortOrder: 10 },
  { name: 'style-hybrid', displayName: 'Hybrid Style', sortOrder: 11 },
  { name: 'style-volume', displayName: 'Volume Style', sortOrder: 12 },
  { name: 'style-mega-volume', displayName: 'Mega Volume Style', sortOrder: 13 },
  { name: 'style-wet-angel', displayName: 'Wet/Angel Style', sortOrder: 14 },
  { name: 'style-lash-lift', displayName: 'Lash Lift Style', sortOrder: 15 },
  { name: 'style-brow-lamination', displayName: 'Brow Lamination', sortOrder: 16 },
  { name: 'style-microblading', displayName: 'Microblading', sortOrder: 17 },
  { name: 'style-hydrafacial', displayName: 'HydraFacial', sortOrder: 18 },
  { name: 'style-lip-blushing', displayName: 'Lip Blushing', sortOrder: 19 },
]

async function seedDiscoveryTags() {
  console.log('🚀 Starting Discovery AI tags seed...\n')

  try {
    // Check if category already exists
    const existingCategory = await db
      .select()
      .from(tagCategories)
      .where(eq(tagCategories.name, DISCOVERY_TAG_CATEGORY.name))
      .limit(1)

    let categoryId: string

    if (existingCategory.length > 0) {
      console.log('📁 AI Usage category already exists, updating...')
      categoryId = existingCategory[0].id

      await db
        .update(tagCategories)
        .set({
          displayName: DISCOVERY_TAG_CATEGORY.displayName,
          description: DISCOVERY_TAG_CATEGORY.description,
          color: DISCOVERY_TAG_CATEGORY.color,
          icon: DISCOVERY_TAG_CATEGORY.icon,
          sortOrder: DISCOVERY_TAG_CATEGORY.sortOrder,
          selectionMode: DISCOVERY_TAG_CATEGORY.selectionMode,
          updatedAt: new Date(),
        })
        .where(eq(tagCategories.id, categoryId))
    } else {
      console.log('📁 Creating AI Usage tag category...')
      const [newCategory] = await db
        .insert(tagCategories)
        .values(DISCOVERY_TAG_CATEGORY)
        .returning()

      categoryId = newCategory.id
    }

    console.log(`   Category ID: ${categoryId}\n`)

    // Seed main discovery tags
    console.log('🏷️  Seeding discovery tags...')
    for (const tag of DISCOVERY_TAGS) {
      const existing = await db
        .select()
        .from(tags)
        .where(eq(tags.name, tag.name))
        .limit(1)

      if (existing.length > 0) {
        console.log(`   ✓ ${tag.displayName} (exists)`)
        await db
          .update(tags)
          .set({
            categoryId,
            displayName: tag.displayName,
            description: tag.description,
            sortOrder: tag.sortOrder,
            updatedAt: new Date(),
          })
          .where(eq(tags.id, existing[0].id))
      } else {
        console.log(`   + ${tag.displayName} (created)`)
        await db.insert(tags).values({
          categoryId,
          name: tag.name,
          displayName: tag.displayName,
          description: tag.description,
          sortOrder: tag.sortOrder,
        })
      }
    }

    // Seed style-specific tags
    console.log('\n🎨 Seeding style tags...')
    for (const tag of STYLE_TAGS) {
      const existing = await db
        .select()
        .from(tags)
        .where(eq(tags.name, tag.name))
        .limit(1)

      if (existing.length > 0) {
        console.log(`   ✓ ${tag.displayName} (exists)`)
        await db
          .update(tags)
          .set({
            categoryId,
            displayName: tag.displayName,
            sortOrder: tag.sortOrder,
            updatedAt: new Date(),
          })
          .where(eq(tags.id, existing[0].id))
      } else {
        console.log(`   + ${tag.displayName} (created)`)
        await db.insert(tags).values({
          categoryId,
          name: tag.name,
          displayName: tag.displayName,
          sortOrder: tag.sortOrder,
        })
      }
    }

    console.log('\n✅ Discovery AI tags seeded successfully!')
    console.log('\nNext steps:')
    console.log('1. Go to the DAM (/dam)')
    console.log('2. Select assets you want to use in Discover Your Look AI')
    console.log('3. Tag them with "Discover Your Look" and relevant style tags')
    console.log('4. The AI will automatically use these tagged assets in conversations')
  } catch (error) {
    console.error('❌ Error seeding discovery tags:', error)
    process.exit(1)
  }
}

// Run the seed
seedDiscoveryTags()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
