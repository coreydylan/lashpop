/**
 * Fix lash subcategory order to match the desired order:
 * Classic, Wet/Angel, Hybrid, Volume, Mega Volume, Enhancements
 */

import { config } from 'dotenv'
import { getDb } from '../src/db'
import { serviceSubcategories } from '../src/db/schema/service_subcategories'
import { serviceCategories } from '../src/db/schema/service_categories'
import { eq } from 'drizzle-orm'

config({ path: '.env.local' })

// Desired order for lash subcategories
const LASH_SUBCATEGORY_ORDER = [
  { slug: 'classic-extensions', displayOrder: 1 },
  { slug: 'wet-angel-extensions', displayOrder: 2 },
  { slug: 'hybrid-extensions', displayOrder: 3 },
  { slug: 'volume-extensions', displayOrder: 4 },
  { slug: 'mega-volume-extensions', displayOrder: 5 },
  { slug: 'lash-enhancements', displayOrder: 6 },
]

async function fixLashSubcategoryOrder() {
  console.log('🔧 Fixing lash subcategory order...\n')

  const db = getDb()

  // Get the lashes category
  const [lashesCategory] = await db
    .select()
    .from(serviceCategories)
    .where(eq(serviceCategories.slug, 'lashes'))
    .limit(1)

  if (!lashesCategory) {
    console.error('❌ Lashes category not found!')
    process.exit(1)
  }

  console.log(`Found lashes category: ${lashesCategory.name} (${lashesCategory.id})`)

  // Get current subcategories
  const currentSubcategories = await db
    .select()
    .from(serviceSubcategories)
    .where(eq(serviceSubcategories.categoryId, lashesCategory.id))

  console.log('\nCurrent subcategory order:')
  currentSubcategories
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .forEach(sub => {
      console.log(`  ${sub.displayOrder}. ${sub.name} (${sub.slug})`)
    })

  // Update each subcategory's display order
  console.log('\nUpdating display orders...')

  for (const orderItem of LASH_SUBCATEGORY_ORDER) {
    const subcategory = currentSubcategories.find(s => s.slug === orderItem.slug)

    if (!subcategory) {
      console.log(`  ⚠ Subcategory not found: ${orderItem.slug}`)
      continue
    }

    await db
      .update(serviceSubcategories)
      .set({
        displayOrder: orderItem.displayOrder,
        updatedAt: new Date()
      })
      .where(eq(serviceSubcategories.id, subcategory.id))

    console.log(`  ✓ ${subcategory.name}: ${subcategory.displayOrder} → ${orderItem.displayOrder}`)
  }

  // Verify the new order
  const updatedSubcategories = await db
    .select()
    .from(serviceSubcategories)
    .where(eq(serviceSubcategories.categoryId, lashesCategory.id))

  console.log('\n✅ New subcategory order:')
  updatedSubcategories
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .forEach(sub => {
      console.log(`  ${sub.displayOrder}. ${sub.name}`)
    })

  console.log('\n✅ Done!')
  process.exit(0)
}

fixLashSubcategoryOrder()
