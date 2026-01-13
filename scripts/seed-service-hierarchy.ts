/**
 * Seed service categories, subcategories, and map all existing services
 */

import { config } from 'dotenv'
import { getDb } from '../src/db'
import { serviceCategories } from '../src/db/schema/service_categories'
import { serviceSubcategories } from '../src/db/schema/service_subcategories'
import { services } from '../src/db/schema/services'
import { eq } from 'drizzle-orm'

config({ path: '.env.local' })

// Category definitions
const CATEGORIES = [
  { name: 'Lashes', slug: 'lashes', description: 'Eyelash extensions, lifts, and enhancements', icon: '👁️', displayOrder: 1 },
  { name: 'Brows', slug: 'brows', description: 'Eyebrow shaping, lamination, and permanent makeup', icon: '✨', displayOrder: 2 },
  { name: 'Facials', slug: 'facials', description: 'Professional facial treatments and skin care', icon: '🌸', displayOrder: 3 },
  { name: 'Waxing', slug: 'waxing', description: 'Hair removal services', icon: '🪒', displayOrder: 4 },
  { name: 'Nails', slug: 'nails', description: 'Manicures, pedicures, and nail art', icon: '💅', displayOrder: 5 },
  { name: 'Specialty', slug: 'specialty', description: 'Permanent jewelry and unique services', icon: '💎', displayOrder: 6 },
  { name: 'Permanent Makeup', slug: 'permanent-makeup', description: 'Long-lasting cosmetic tattooing', icon: '💄', displayOrder: 7 },
  { name: 'Injectables', slug: 'injectables', description: 'Botox, fillers, and aesthetic injectables', icon: '💉', displayOrder: 8 },
  { name: 'Bundles', slug: 'bundles', description: 'Service packages and combos', icon: '🎁', displayOrder: 9 },
]

// Subcategory definitions with their parent category
const SUBCATEGORIES = [
  // Lashes
  { categorySlug: 'lashes', name: 'Classic Extensions', slug: 'classic-extensions', displayOrder: 1 },
  { categorySlug: 'lashes', name: 'Volume Extensions', slug: 'volume-extensions', displayOrder: 2 },
  { categorySlug: 'lashes', name: 'Mega Volume Extensions', slug: 'mega-volume-extensions', displayOrder: 3 },
  { categorySlug: 'lashes', name: 'Hybrid Extensions', slug: 'hybrid-extensions', displayOrder: 4 },
  { categorySlug: 'lashes', name: 'Wet/Angel Extensions', slug: 'wet-angel-extensions', displayOrder: 5 },
  { categorySlug: 'lashes', name: 'Enhancements', slug: 'lash-enhancements', displayOrder: 6 },

  // Brows
  { categorySlug: 'brows', name: 'Shaping', slug: 'brow-shaping', displayOrder: 1 },
  { categorySlug: 'brows', name: 'Lamination', slug: 'brow-lamination', displayOrder: 2 },
  { categorySlug: 'brows', name: 'Tinting', slug: 'brow-tinting', displayOrder: 3 },
  { categorySlug: 'brows', name: 'Microblading', slug: 'microblading', displayOrder: 4 },
  { categorySlug: 'brows', name: 'Nanobrows', slug: 'nanobrows', displayOrder: 5 },

  // Permanent Makeup
  { categorySlug: 'permanent-makeup', name: 'Lip Blushing', slug: 'lip-blushing', displayOrder: 1 },
  { categorySlug: 'permanent-makeup', name: 'Beauty Marks', slug: 'beauty-marks', displayOrder: 2 },
  { categorySlug: 'permanent-makeup', name: 'Freckles', slug: 'freckles', displayOrder: 3 },
  { categorySlug: 'permanent-makeup', name: 'Tattoos', slug: 'tattoos', displayOrder: 4 },
  { categorySlug: 'permanent-makeup', name: 'Consultations', slug: 'pmu-consultations', displayOrder: 5 },

  // Facials
  { categorySlug: 'facials', name: 'Signature Facials', slug: 'signature-facials', displayOrder: 1 },
  { categorySlug: 'facials', name: 'Hydrafacials', slug: 'hydrafacials', displayOrder: 2 },
  { categorySlug: 'facials', name: 'Specialty Treatments', slug: 'specialty-facial-treatments', displayOrder: 3 },
  { categorySlug: 'facials', name: 'Add-Ons', slug: 'facial-add-ons', displayOrder: 4 },

  // Waxing
  { categorySlug: 'waxing', name: 'Face', slug: 'face-waxing', displayOrder: 1 },
  { categorySlug: 'waxing', name: 'Body', slug: 'body-waxing', displayOrder: 2 },

  // Specialty
  { categorySlug: 'specialty', name: 'Permanent Jewelry', slug: 'permanent-jewelry', displayOrder: 1 },
  { categorySlug: 'specialty', name: 'Other Services', slug: 'other-specialty-services', displayOrder: 2 },

  // Nails
  { categorySlug: 'nails', name: 'Manicures', slug: 'manicures', displayOrder: 1 },
  { categorySlug: 'nails', name: 'Pedicures', slug: 'pedicures', displayOrder: 2 },
  { categorySlug: 'nails', name: 'Nail Art', slug: 'nail-art', displayOrder: 3 },

  // Injectables
  { categorySlug: 'injectables', name: 'Botox', slug: 'botox', displayOrder: 1 },
  { categorySlug: 'injectables', name: 'Fillers', slug: 'fillers', displayOrder: 2 },
  { categorySlug: 'injectables', name: 'Other Injectables', slug: 'other-injectables', displayOrder: 3 },

  // Bundles
  { categorySlug: 'bundles', name: 'Service Packages', slug: 'service-packages', displayOrder: 1 },
]

// Service mapping: service slug -> { categorySlug, subcategorySlug }
const SERVICE_MAPPING: Record<string, { categorySlug: string; subcategorySlug: string }> = {
  // Classic Extensions
  'classic': { categorySlug: 'lashes', subcategorySlug: 'classic-extensions' },
  'classic-fill': { categorySlug: 'lashes', subcategorySlug: 'classic-extensions' },
  'classic-mini': { categorySlug: 'lashes', subcategorySlug: 'classic-extensions' },

  // Volume Extensions
  'volume': { categorySlug: 'lashes', subcategorySlug: 'volume-extensions' },

  // Mega Volume Extensions
  'mega-volume-full-set': { categorySlug: 'lashes', subcategorySlug: 'mega-volume-extensions' },
  'mega-volume-fill': { categorySlug: 'lashes', subcategorySlug: 'mega-volume-extensions' },
  'mega-volume-mini-fill': { categorySlug: 'lashes', subcategorySlug: 'mega-volume-extensions' },

  // Hybrid Extensions
  'hybrid': { categorySlug: 'lashes', subcategorySlug: 'hybrid-extensions' },
  'hybrid-fill': { categorySlug: 'lashes', subcategorySlug: 'hybrid-extensions' },
  'hybrid-mini': { categorySlug: 'lashes', subcategorySlug: 'hybrid-extensions' },

  // Wet/Angel Extensions
  'angel': { categorySlug: 'lashes', subcategorySlug: 'wet-angel-extensions' },
  'angel-fill': { categorySlug: 'lashes', subcategorySlug: 'wet-angel-extensions' },
  'angel-mini': { categorySlug: 'lashes', subcategorySlug: 'wet-angel-extensions' },

  // Lash Enhancements
  'lash-lift': { categorySlug: 'lashes', subcategorySlug: 'lash-enhancements' },
  'lash-tint': { categorySlug: 'lashes', subcategorySlug: 'lash-enhancements' },
  'lash-lift-tint': { categorySlug: 'lashes', subcategorySlug: 'lash-enhancements' },
  'lash-lift-reversal': { categorySlug: 'lashes', subcategorySlug: 'lash-enhancements' },
  'colored-eyelash-extensions': { categorySlug: 'lashes', subcategorySlug: 'lash-enhancements' },
  'removal': { categorySlug: 'lashes', subcategorySlug: 'lash-enhancements' },

  // Brow Shaping
  'brow-shaping-wax-tweeze-trim': { categorySlug: 'brows', subcategorySlug: 'brow-shaping' },

  // Brow Lamination
  'brow-lamination-tint': { categorySlug: 'brows', subcategorySlug: 'brow-lamination' },
  'post-lamination-maintenance': { categorySlug: 'brows', subcategorySlug: 'brow-lamination' },

  // Brow Tinting
  'brow-tint': { categorySlug: 'brows', subcategorySlug: 'brow-tinting' },

  // Brow Consultations
  'brow-consultation': { categorySlug: 'brows', subcategorySlug: 'brow-tinting' },

  // Microblading
  'microblading-1st-appointment': { categorySlug: 'brows', subcategorySlug: 'microblading' },
  'microblading-2nd-perfecting-appointment': { categorySlug: 'brows', subcategorySlug: 'microblading' },
  'microblading-annual-refresh': { categorySlug: 'brows', subcategorySlug: 'microblading' },

  // Nanobrows
  'nanobrows-1st-appointment': { categorySlug: 'brows', subcategorySlug: 'nanobrows' },
  'nanobrows-2nd-perfecting-appointment': { categorySlug: 'brows', subcategorySlug: 'nanobrows' },
  'nanobrows-annual-refresh': { categorySlug: 'brows', subcategorySlug: 'nanobrows' },

  // Permanent Makeup - Lips
  'lip-blushing-1st-appointment': { categorySlug: 'permanent-makeup', subcategorySlug: 'lip-blushing' },
  'lip-blushing-2nd-perfecting-appointment': { categorySlug: 'permanent-makeup', subcategorySlug: 'lip-blushing' },
  'lip-blushing-annual-refresh': { categorySlug: 'permanent-makeup', subcategorySlug: 'lip-blushing' },

  // Permanent Makeup - Beauty Marks
  'faux-beauty-marks-1st-appointment': { categorySlug: 'permanent-makeup', subcategorySlug: 'beauty-marks' },
  'faux-beauty-marks-2nd-perfecting-appointment': { categorySlug: 'permanent-makeup', subcategorySlug: 'beauty-marks' },
  'faux-beauty-marks-annual-refresh': { categorySlug: 'permanent-makeup', subcategorySlug: 'beauty-marks' },

  // Permanent Makeup - Freckles
  'faux-freckles-1st-appointment': { categorySlug: 'permanent-makeup', subcategorySlug: 'freckles' },
  'faux-freckles-2nd-perfecting-appointment': { categorySlug: 'permanent-makeup', subcategorySlug: 'freckles' },
  'faux-freckles-annual-refresh': { categorySlug: 'permanent-makeup', subcategorySlug: 'freckles' },

  // Permanent Makeup - Tattoos
  'tattoos': { categorySlug: 'permanent-makeup', subcategorySlug: 'tattoos' },

  // Permanent Makeup - Consultations
  'permanent-makeup-consultation': { categorySlug: 'permanent-makeup', subcategorySlug: 'pmu-consultations' },

  // Signature Facials
  'signature-facial': { categorySlug: 'facials', subcategorySlug: 'signature-facials' },
  'age-gracefully-facial': { categorySlug: 'facials', subcategorySlug: 'signature-facials' },
  'acne-fighting-facial': { categorySlug: 'facials', subcategorySlug: 'signature-facials' },
  'sooth-and-calm-facial': { categorySlug: 'facials', subcategorySlug: 'signature-facials' },
  'oxygen-deep-pore-facial': { categorySlug: 'facials', subcategorySlug: 'signature-facials' },
  'citrus-refresher-facial': { categorySlug: 'facials', subcategorySlug: 'signature-facials' },
  'tailored-to-you-facial': { categorySlug: 'facials', subcategorySlug: 'signature-facials' },
  'acne-relief-facial': { categorySlug: 'facials', subcategorySlug: 'signature-facials' },
  'celluma-facial': { categorySlug: 'facials', subcategorySlug: 'signature-facials' },
  'epicutis-facial': { categorySlug: 'facials', subcategorySlug: 'signature-facials' },
  'oasis-facial': { categorySlug: 'facials', subcategorySlug: 'signature-facials' },
  'rejuvenating-facial': { categorySlug: 'facials', subcategorySlug: 'signature-facials' },
  'back-facial': { categorySlug: 'facials', subcategorySlug: 'signature-facials' },

  // Hydrafacials
  'clarifying-hydrafacial': { categorySlug: 'facials', subcategorySlug: 'hydrafacials' },
  'customized-hydrafacial': { categorySlug: 'facials', subcategorySlug: 'hydrafacials' },
  'glow-and-go-hydrafacial': { categorySlug: 'facials', subcategorySlug: 'hydrafacials' },
  'restorative-hydrafacial': { categorySlug: 'facials', subcategorySlug: 'hydrafacials' },
  'the-ultimate-hydrafacial': { categorySlug: 'facials', subcategorySlug: 'hydrafacials' },

  // Specialty Facial Treatments
  'dermaplaning-facial': { categorySlug: 'facials', subcategorySlug: 'specialty-facial-treatments' },

  // Facial Add-Ons
  'celluma-led-light-therapy': { categorySlug: 'facials', subcategorySlug: 'facial-add-ons' },
  'express-dermaplaning': { categorySlug: 'facials', subcategorySlug: 'facial-add-ons' },
  'hand-and-arm-treatment': { categorySlug: 'facials', subcategorySlug: 'facial-add-ons' },
  'hydrojelly-mask': { categorySlug: 'facials', subcategorySlug: 'facial-add-ons' },
  'lymphatic-drainage': { categorySlug: 'facials', subcategorySlug: 'facial-add-ons' },

  // Face Waxing
  'chin-wax': { categorySlug: 'waxing', subcategorySlug: 'face-waxing' },
  'full-face-wax': { categorySlug: 'waxing', subcategorySlug: 'face-waxing' },
  'upper-lip-and-chin-wax': { categorySlug: 'waxing', subcategorySlug: 'face-waxing' },
  'nose-wax': { categorySlug: 'waxing', subcategorySlug: 'face-waxing' },
  'sideburn-wax': { categorySlug: 'waxing', subcategorySlug: 'face-waxing' },
  'upper-lip-wax': { categorySlug: 'waxing', subcategorySlug: 'face-waxing' },

  // Body Waxing
  'arm-wax-full': { categorySlug: 'waxing', subcategorySlug: 'body-waxing' },
  'arm-wax-half': { categorySlug: 'waxing', subcategorySlug: 'body-waxing' },
  'brazilian-wax': { categorySlug: 'waxing', subcategorySlug: 'body-waxing' },
  'leg-wax-full': { categorySlug: 'waxing', subcategorySlug: 'body-waxing' },
  'leg-wax-half': { categorySlug: 'waxing', subcategorySlug: 'body-waxing' },
  'lower-back-wax': { categorySlug: 'waxing', subcategorySlug: 'body-waxing' },
  'underarm-wax': { categorySlug: 'waxing', subcategorySlug: 'body-waxing' },

  // Permanent Jewelry
  'permanent-jewelry-for-1-3-peoplepieces': { categorySlug: 'specialty', subcategorySlug: 'permanent-jewelry' },
  'permanent-jewelry-for-4-6-peoplepieces': { categorySlug: 'specialty', subcategorySlug: 'permanent-jewelry' },
  'permanent-jewelry-re-weld': { categorySlug: 'specialty', subcategorySlug: 'permanent-jewelry' },

  // Bundles
  'lash-lift-tint-bundle': { categorySlug: 'bundles', subcategorySlug: 'service-packages' },
  'facial-wax-brow-tint-bundle': { categorySlug: 'bundles', subcategorySlug: 'service-packages' },
  'brow-shaping-tint-bundle': { categorySlug: 'bundles', subcategorySlug: 'service-packages' },
  'brow-lamination-lash-lift-bundle': { categorySlug: 'bundles', subcategorySlug: 'service-packages' },
  'brazilian-underarms-wax': { categorySlug: 'bundles', subcategorySlug: 'service-packages' },
  'brazilian-brow-wax': { categorySlug: 'bundles', subcategorySlug: 'service-packages' },

  // Injectables
  'botox-treatment': { categorySlug: 'injectables', subcategorySlug: 'botox' },
}

async function seedServiceHierarchy() {
  console.log('🌱 Seeding service hierarchy...\n')

  const db = getDb()

  // 1. Create/update categories
  console.log('📁 Creating categories...')
  const categoryMap = new Map<string, string>() // slug -> id

  for (const cat of CATEGORIES) {
    const [existing] = await db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.slug, cat.slug))
      .limit(1)

    if (existing) {
      await db
        .update(serviceCategories)
        .set({
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          displayOrder: cat.displayOrder,
          updatedAt: new Date(),
        })
        .where(eq(serviceCategories.id, existing.id))

      categoryMap.set(cat.slug, existing.id)
      console.log(`  ✓ Updated: ${cat.name}`)
    } else {
      const [newCat] = await db
        .insert(serviceCategories)
        .values(cat)
        .returning({ id: serviceCategories.id })

      categoryMap.set(cat.slug, newCat.id)
      console.log(`  ✓ Created: ${cat.name}`)
    }
  }

  // 2. Create/update subcategories
  console.log('\n📂 Creating subcategories...')
  const subcategoryMap = new Map<string, string>() // slug -> id

  for (const subcat of SUBCATEGORIES) {
    const categoryId = categoryMap.get(subcat.categorySlug)
    if (!categoryId) {
      console.error(`  ✗ Category not found: ${subcat.categorySlug}`)
      continue
    }

    const [existing] = await db
      .select()
      .from(serviceSubcategories)
      .where(eq(serviceSubcategories.slug, subcat.slug))
      .limit(1)

    if (existing) {
      await db
        .update(serviceSubcategories)
        .set({
          categoryId,
          name: subcat.name,
          displayOrder: subcat.displayOrder,
          updatedAt: new Date(),
        })
        .where(eq(serviceSubcategories.id, existing.id))

      subcategoryMap.set(subcat.slug, existing.id)
      console.log(`  ✓ Updated: ${subcat.name}`)
    } else {
      const [newSubcat] = await db
        .insert(serviceSubcategories)
        .values({
          categoryId,
          name: subcat.name,
          slug: subcat.slug,
          displayOrder: subcat.displayOrder,
        })
        .returning({ id: serviceSubcategories.id })

      subcategoryMap.set(subcat.slug, newSubcat.id)
      console.log(`  ✓ Created: ${subcat.name}`)
    }
  }

  // 3. Update services with category and subcategory
  console.log('\n🏷️  Mapping services to hierarchy...')

  const allServices = await db.select().from(services)
  let mapped = 0
  let skipped = 0

  for (const service of allServices) {
    const mapping = SERVICE_MAPPING[service.slug]

    if (!mapping) {
      console.log(`  ⚠ No mapping for: ${service.slug}`)
      skipped++
      continue
    }

    const categoryId = categoryMap.get(mapping.categorySlug)
    const subcategoryId = subcategoryMap.get(mapping.subcategorySlug)

    if (!categoryId || !subcategoryId) {
      console.error(`  ✗ Invalid mapping for ${service.slug}: cat=${mapping.categorySlug}, subcat=${mapping.subcategorySlug}`)
      skipped++
      continue
    }

    await db
      .update(services)
      .set({
        categoryId,
        subcategoryId,
        updatedAt: new Date(),
      })
      .where(eq(services.id, service.id))

    mapped++
  }

  console.log(`\n✅ Complete!`)
  console.log(`  Categories: ${categoryMap.size}`)
  console.log(`  Subcategories: ${subcategoryMap.size}`)
  console.log(`  Services mapped: ${mapped}`)
  console.log(`  Services skipped: ${skipped}`)

  process.exit(0)
}

seedServiceHierarchy()
