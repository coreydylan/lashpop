/**
 * Add "Lifts & Tints" subcategory under Lashes and move relevant services to it
 */

import { config } from 'dotenv'
import { getDb } from '../src/db'
import { serviceSubcategories } from '../src/db/schema/service_subcategories'
import { serviceCategories } from '../src/db/schema/service_categories'
import { services } from '../src/db/schema/services'
import { eq, and, inArray } from 'drizzle-orm'

config({ path: '.env.local' })

async function main() {
  const db = await getDb()

  console.log('Adding "Lifts & Tints" subcategory...\n')

  // 1. Get the lashes category ID
  const [lashesCategory] = await db
    .select()
    .from(serviceCategories)
    .where(eq(serviceCategories.slug, 'lashes'))

  if (!lashesCategory) {
    console.error('Lashes category not found!')
    process.exit(1)
  }

  console.log('Found lashes category:', lashesCategory.id)

  // 2. Check if "lash-lifts-tints" subcategory already exists
  const [existingSubcat] = await db
    .select()
    .from(serviceSubcategories)
    .where(eq(serviceSubcategories.slug, 'lash-lifts-tints'))

  let subcatId: string

  if (existingSubcat) {
    console.log('Subcategory already exists:', existingSubcat.id)
    subcatId = existingSubcat.id
  } else {
    // 3. Create the new subcategory with displayOrder 1 (first in list)
    const [newSubcat] = await db
      .insert(serviceSubcategories)
      .values({
        categoryId: lashesCategory.id,
        name: 'Lifts & Tints',
        slug: 'lash-lifts-tints',
        description: 'Lash lifts and tinting services',
        displayOrder: 1, // Put it first
      })
      .returning()

    console.log('Created new subcategory:', newSubcat.id)
    subcatId = newSubcat.id

    // 4. Shift other subcategories' displayOrder up by 1
    const otherSubcats = await db
      .select()
      .from(serviceSubcategories)
      .where(
        and(
          eq(serviceSubcategories.categoryId, lashesCategory.id),
          eq(serviceSubcategories.slug, 'lash-lifts-tints') // Exclude the new one
        )
      )

    // Actually, let's just update all lashes subcategories except the new one
    await db.execute(`
      UPDATE service_subcategories
      SET display_order = display_order + 1
      WHERE category_id = '${lashesCategory.id}'
      AND slug != 'lash-lifts-tints'
    `)
    console.log('Shifted other subcategories displayOrder')
  }

  // 5. Get the new subcategory to use its ID
  const [liftsSubcat] = await db
    .select()
    .from(serviceSubcategories)
    .where(eq(serviceSubcategories.slug, 'lash-lifts-tints'))

  // 6. Update services - move lash lift related services to the new subcategory
  const liftServiceSlugs = [
    'lash-lift',
    'lash-tint',
    'lash-lift-tint',
    'lash-lift-and-tint',
    'lash-lift-reversal',
  ]

  // Find services that match these slugs or contain "lift" or "tint" in their slug
  const liftServices = await db
    .select()
    .from(services)
    .where(eq(services.categoryId, lashesCategory.id))

  const servicesToUpdate = liftServices.filter(s =>
    liftServiceSlugs.includes(s.slug) ||
    (s.slug.includes('lift') && !s.slug.includes('volume')) ||
    (s.slug.includes('tint') && s.slug.includes('lash'))
  )

  console.log('\nServices to move to Lifts & Tints:')
  servicesToUpdate.forEach(s => console.log(`  - ${s.name} (${s.slug})`))

  // Update these services to use the new subcategory
  for (const service of servicesToUpdate) {
    await db
      .update(services)
      .set({
        subcategoryId: liftsSubcat.id,
      })
      .where(eq(services.id, service.id))
  }

  console.log(`\nUpdated ${servicesToUpdate.length} services to use "Lifts & Tints" subcategory`)

  // 7. Verify the changes
  const updatedServices = await db
    .select({
      name: services.name,
      slug: services.slug,
      subcategoryId: services.subcategoryId,
    })
    .from(services)
    .where(eq(services.subcategoryId, liftsSubcat.id))

  console.log('\nServices now in Lifts & Tints:')
  updatedServices.forEach(s => console.log(`  - ${s.name}`))

  console.log('\nDone!')
  process.exit(0)
}

main().catch(console.error)
