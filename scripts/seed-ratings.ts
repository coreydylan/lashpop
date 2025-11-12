/**
 * Add is_rating field and seed star ratings category
 */

import { config } from 'dotenv'
import { getDb } from '../src/db'
import { tagCategories } from '../src/db/schema/tag_categories'
import { tags } from '../src/db/schema/tags'
import { eq, sql } from 'drizzle-orm'

config({ path: '.env.local' })

async function seedRatings() {
  console.log('🌱 Setting up star ratings system...')

  const db = getDb()

  try {
    // 1. Add is_rating column if it doesn't exist
    console.log('  Adding is_rating column to tag_categories...')
    await db.execute(sql`
      ALTER TABLE tag_categories
      ADD COLUMN IF NOT EXISTS is_rating boolean DEFAULT false NOT NULL
    `)
    console.log('  ✓ Column added')

    // 2. Create the "Rating" category
    console.log('  Creating Rating category...')
    const [ratingCategory] = await db
      .insert(tagCategories)
      .values({
        name: 'rating',
        displayName: 'Rating',
        description: 'Star ratings for asset quality',
        color: '#F59E0B', // Amber/Gold
        icon: 'star',
        sortOrder: -1, // Show at top
        isRating: true,
      })
      .onConflictDoNothing({ target: tagCategories.name })
      .returning()

    if (!ratingCategory) {
      console.log('  ℹ️  Rating category already exists, fetching...')
      const existing = await db.query.tagCategories.findFirst({
        where: eq(tagCategories.name, 'rating'),
      })
      if (!existing) {
        throw new Error('Failed to create or find Rating category')
      }
    }

    // Get the rating category ID
    const category = await db.query.tagCategories.findFirst({
      where: eq(tagCategories.name, 'rating'),
    })

    if (!category) {
      throw new Error('Rating category not found')
    }

    // 3. Create star rating tags (1-5 stars)
    console.log('  Creating star rating tags...')
    const starRatings = [
      { name: '1-star', displayName: '1 Star', sortOrder: 0 },
      { name: '2-star', displayName: '2 Stars', sortOrder: 1 },
      { name: '3-star', displayName: '3 Stars', sortOrder: 2 },
      { name: '4-star', displayName: '4 Stars', sortOrder: 3 },
      { name: '5-star', displayName: '5 Stars', sortOrder: 4 },
    ]

    for (const rating of starRatings) {
      await db
        .insert(tags)
        .values({
          categoryId: category.id,
          name: rating.name,
          displayName: rating.displayName,
          sortOrder: rating.sortOrder,
        })
        .onConflictDoNothing()
    }

    console.log('  ✓ Created 5 star rating tags')

    console.log('✅ Star ratings system setup complete!')
    console.log(`  - Rating category created`)
    console.log(`  - 5 star rating tags created (1-5 stars)`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

seedRatings()
