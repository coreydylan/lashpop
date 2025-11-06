import { config } from "dotenv"
import postgres from "postgres"

config({ path: ".env.local" })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set")
}

async function seed(dbUrl: string) {
  const sql = postgres(dbUrl, { max: 1 })

  try {
    console.log("🌱 Starting database seed...")

    // Clear existing data
    console.log("🧹 Clearing existing data...")
    await sql`DELETE FROM team_member_categories`
    await sql`DELETE FROM testimonials`
    await sql`DELETE FROM services`
    await sql`DELETE FROM service_categories`
    await sql`DELETE FROM team_members`

    // Seed Service Categories
    console.log("📦 Seeding service categories...")
    const categories = await sql`
      INSERT INTO service_categories (name, slug, description, icon, display_order, is_active)
      VALUES
        ('Lashes', 'lashes', 'Eyelash extensions and treatments', 'sparkles', 1, true),
        ('Brows', 'brows', 'Brow shaping, tinting, and lamination', 'star', 2, true),
        ('Skincare', 'skincare', 'Facials and skincare treatments', 'heart', 3, true),
        ('Waxing', 'waxing', 'Professional waxing services', 'sun', 4, true),
        ('Permanent Makeup', 'permanent-makeup', 'Microblading and permanent cosmetics', 'moon', 5, true),
        ('Permanent Jewelry', 'permanent-jewelry', 'Welded jewelry services', 'circle', 6, true),
        ('Injectables', 'injectables', 'Botox and dermal fillers', 'wave', 7, true),
        ('Advanced Treatments', 'advanced-treatments', 'Plasma and fibroblast treatments', 'wave', 8, true)
      RETURNING id, slug
    `

    const categoryMap = Object.fromEntries(categories.map(c => [c.slug, c.id]))

    // Seed Services
    console.log("💅 Seeding services...")
    await sql`
      INSERT INTO services (
        category_id, name, slug, subtitle, description,
        duration_minutes, price_starting, image_url, color, display_order, is_active
      )
      VALUES
        -- Lash Services
        (
          ${categoryMap['lashes']},
          'Classic Eyelash Extensions',
          'classic',
          'The most natural look',
          'Your lash stylist will apply one individual extension to each of your natural eyelashes, determining the perfect length, shape, and curl for your eyes.',
          90,
          12000,
          '/lashpop-images/services/classic-lash.png',
          'sage',
          1,
          true
        ),
        (
          ${categoryMap['lashes']},
          'Hybrid Eyelash Extensions',
          'hybrid',
          'A medium-full, textured look',
          'Your lash stylist will apply a 50/50 blend of classic and volume lash extensions to each of your natural eyelashes.',
          120,
          15000,
          '/lashpop-images/services/hybrid-lash.png',
          'dusty-rose',
          2,
          true
        ),
        (
          ${categoryMap['lashes']},
          'Volume Eyelash Extensions',
          'volume',
          'The most full and fluffy look',
          'Multiple lightweight extensions fanned and applied to each natural lash for a full, dramatic effect.',
          150,
          18000,
          '/lashpop-images/services/volume-lash.png',
          'golden',
          3,
          true
        ),
        (
          ${categoryMap['lashes']},
          'Lash Lift + Tint',
          'lift',
          'Your lashes, but better',
          'A perming solution curls your natural lashes, creating a lifted look that lasts 6-8 weeks.',
          45,
          8500,
          '/lashpop-images/services/lash-lift.png',
          'ocean-mist',
          4,
          true
        ),
        -- Brow Services
        (
          ${categoryMap['brows']},
          'Brow Services',
          'brows',
          'Frame your story',
          'Brow shaping, tinting, and lamination services to create your perfect frame.',
          45,
          4500,
          '/lashpop-images/services/brow-photo.png',
          'terracotta',
          5,
          true
        )
    `

    // Seed Team Members with accurate data
    console.log("👥 Seeding team members...")
    const teamMembers = await sql`
      INSERT INTO team_members (
        name, role, type, business_name, phone, instagram,
        booking_url, uses_lashpop_booking, image_url,
        specialties, display_order
      )
      VALUES
        -- Employees
        (
          'Emily Rogers',
          'Owner & Lash Artist',
          'employee',
          NULL,
          '760-212-0448',
          '@lashpopstudios',
          'https://www.vagaro.com/lashpop32',
          true,
          '/lashpop-images/team/emily-rogers.jpeg',
          '["Lashes"]'::jsonb,
          '1'
        ),
        (
          'Rachel Edwards',
          'Lash Artist',
          'employee',
          NULL,
          '760-212-0448',
          '@indigomoon.beauty',
          'https://www.vagaro.com/lashpop32',
          true,
          '/lashpop-images/team/rachel-edwards.jpeg',
          '["Lashes"]'::jsonb,
          '2'
        ),
        (
          'Ryann Alcorn',
          'Lash Artist',
          'employee',
          NULL,
          '760-212-0448',
          '@ryannsbeauty',
          'https://www.vagaro.com/lashpop32',
          true,
          '/lashpop-images/team/ryann-alcorn.png',
          '["Lashes"]'::jsonb,
          '3'
        ),
        -- Independent Artists
        (
          'Ashley Petersen',
          'HydraFacials/Lash Artist',
          'independent',
          'Integrated Body and Beauty',
          '760-822-0255',
          '@integratedbodyandbeauty',
          'https://www.vagaro.com/lashpop32',
          true,
          '/lashpop-images/team/ashley-petersen.jpg',
          '["Lashes", "Skincare"]'::jsonb,
          '4'
        ),
        (
          'Ava Mata',
          'Lash Artist',
          'independent',
          'Looks and Lashes',
          '714-336-4908',
          '@__looksandlashes__',
          'https://www.vagaro.com/lashpop32',
          true,
          '/lashpop-images/team/ava-mata.jpg',
          '["Lashes"]'::jsonb,
          '5'
        ),
        (
          'Savannah Scherer',
          'Lash Artist/Brows/Facials',
          'independent',
          'San Diego Lash',
          '619-735-1237',
          '@sandiegolash',
          'https://www.vagaro.com/lashpop32',
          true,
          '/lashpop-images/team/savannah-scherer.jpeg',
          '["Lashes", "Brows", "Skincare"]'::jsonb,
          '6'
        ),
        (
          'Elena Castellanos',
          'Jet Plasma + Fibroblast',
          'independent',
          'Nuskin Fibroblast',
          '760-583-3357',
          '@nuskin_fibroblast',
          'https://www.vagaro.com/lashpop32',
          true,
          '/lashpop-images/team/elena-castellanos.jpeg',
          '["Advanced Treatments"]'::jsonb,
          '7'
        ),
        (
          'Adrianna Arnaud',
          'Lash Artist',
          'independent',
          'Lashed by Adrianna',
          '760-964-7235',
          '@lashedbyadrianna',
          'https://www.vagaro.com/lashpop32',
          true,
          '/lashpop-images/team/adrianna-arnaud.jpg',
          '["Lashes"]'::jsonb,
          '8'
        ),
        (
          'Kelly Katona',
          'Lash Artist',
          'independent',
          'Lashes by Kelly Katona',
          '760-805-6072',
          '@lashesbykellykatona',
          'https://www.vagaro.com/lashpop32',
          true,
          '/lashpop-images/team/kelly-katona.jpeg',
          '["Lashes"]'::jsonb,
          '9'
        ),
        (
          'Bethany Peterson',
          'Lash Artist',
          'independent',
          'Salty Lash',
          '760-703-4162',
          '@salty.lash',
          'https://www.vagaro.com/lashpop32',
          true,
          '/lashpop-images/team/bethany-peterson.jpeg',
          '["Lashes"]'::jsonb,
          '10'
        ),
        (
          'Grace Ramos',
          'Botox/Injections',
          'independent',
          'Naturtox',
          '760-525-8628',
          '@natur_tox',
          'https://www.vagaro.com/us02/naturtoxnursinginc',
          false,
          '/lashpop-images/team/grace-ramos.jpg',
          '["Injectables"]'::jsonb,
          '11'
        ),
        (
          'Renee Belton',
          'Microblading/Brows/Lash Lifts',
          'independent',
          'Brows by Cat Black',
          '760-579-1309',
          '@browsbycatblack',
          'https://www.vagaro.com/lashpop32',
          true,
          '/lashpop-images/team/renee-belton.jpg',
          '["Brows", "Lashes", "Permanent Makeup"]'::jsonb,
          '12'
        ),
        (
          'Evie Ells',
          'Lash Artist/Brows',
          'independent',
          'Evie Ells Aesthetics',
          '949-866-2206',
          NULL,
          'https://www.vagaro.com/lashpop32',
          true,
          '/lashpop-images/team/evie-ells.jpg',
          '["Lashes", "Brows"]'::jsonb,
          '13'
        ),
        (
          'Haley Walker',
          'Lash Artist/Brows',
          'independent',
          'Lashes by Haley',
          '760-519-4641',
          '@haley.the.esti',
          'https://www.vagaro.com/lashpop32',
          true,
          '/lashpop-images/team/haley-walker.jpg',
          '["Lashes", "Brows"]'::jsonb,
          '14'
        )
      RETURNING id, name, specialties
    `

    // Create team_member_categories relationships
    console.log("🔗 Creating team member category relationships...")
    for (const member of teamMembers) {
      const specialties = member.specialties as string[]
      for (const specialty of specialties) {
        const categorySlug = specialty.toLowerCase().replace(/ /g, '-')
        const categoryId = categoryMap[categorySlug]

        if (categoryId) {
          await sql`
            INSERT INTO team_member_categories (team_member_id, category_id)
            VALUES (${member.id}, ${categoryId})
          `
        }
      }
    }

    console.log("✅ Database seeded successfully!")

    // Show counts
    const counts = await sql`
      SELECT
        (SELECT COUNT(*) FROM service_categories) as categories,
        (SELECT COUNT(*) FROM services) as services,
        (SELECT COUNT(*) FROM team_members) as team_members,
        (SELECT COUNT(*) FROM team_member_categories) as team_categories
    `

    console.log("\n📊 Seed Summary:")
    console.log(`  ✓ ${counts[0].categories} service categories`)
    console.log(`  ✓ ${counts[0].services} services`)
    console.log(`  ✓ ${counts[0].team_members} team members`)
    console.log(`  ✓ ${counts[0].team_categories} team member-category relationships`)

  } catch (error) {
    console.error("❌ Seed failed:", error)
    throw error
  } finally {
    await sql.end()
  }
}

seed(databaseUrl)
