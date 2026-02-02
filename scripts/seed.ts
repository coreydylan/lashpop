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
        ('Skincare', 'skincare', 'Skincare treatments', 'heart', 3, true),
        ('Waxing', 'waxing', 'Professional waxing services', 'sun', 4, true),
        ('Permanent Makeup', 'permanent-makeup', 'Microblading and permanent cosmetics', 'moon', 5, true),
        ('Permanent Jewelry', 'permanent-jewelry', 'Welded jewelry services', 'circle', 6, true),
        ('Injectables', 'injectables', 'Botox and dermal fillers', 'wave', 7, true)
      RETURNING id, slug
    `

    const lashesCategory = categories.find(c => c.slug === 'lashes')
    const browsCategory = categories.find(c => c.slug === 'brows')

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
          ${lashesCategory?.id},
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
          ${lashesCategory?.id},
          'Hybrid Eyelash Extensions',
          'hybrid',
          'A medium-full, textured look',
          'Your lash stylist will apply a 50/50 blend of classic and volume lash extensions to each of your natural eyelashes, determining the perfect length, shape, and curl for your eyes.',
          120,
          15000,
          '/lashpop-images/services/hybrid-lash.png',
          'dusty-rose',
          2,
          true
        ),
        (
          ${lashesCategory?.id},
          'Volume Eyelash Extensions',
          'volume',
          'The most full and fluffy look',
          'Your lash stylist will apply a volume extension (consists of multiple lightweight extensions in the form of a fan) to each of your natural eyelashes, determining the perfect length, shape, and curl for your eyes.',
          150,
          18000,
          '/lashpop-images/services/volume-lash.png',
          'golden',
          3,
          true
        ),
        (
          ${lashesCategory?.id},
          'Lash Lift + Tint',
          'lift',
          'Your lashes, but better',
          'Picture your natural lashes elegantly transformed as your lash stylist uses a perming solution to curl them, creating a stunning lifted look lasting 6-8 weeks. This service is recommended with and best complemented by a lash tint.',
          45,
          8500,
          '/lashpop-images/services/lash-lift.png',
          'ocean-mist',
          4,
          true
        ),
        -- Brow Services
        (
          ${browsCategory?.id},
          'Brow Artistry',
          'brows',
          'Frame your story',
          'Because your brows are the architecture of your face. Whether it is lamination for that perfectly brushed look, tinting for definition, or shaping for structure, we create frames worthy of your masterpiece.',
          45,
          4500,
          '/lashpop-images/services/brow-photo.png',
          'terracotta',
          5,
          true
        )
    `

    // Seed Team Members
    console.log("👥 Seeding team members...")
    await sql`
      INSERT INTO team_members (
        name, role, type, business_name, bio, quote, phone, instagram,
        booking_url, image_url, specialties, favorite_services, fun_fact, availability
      )
      VALUES
        -- Employees
        (
          'Emily Rogers',
          'Owner & Lash Artist',
          'employee',
          NULL,
          'As the founder and owner of LashPop Studios, Emily has built a sanctuary for beauty and wellness in North County. With years of experience and a passion for making every client feel their best, she leads by example with her gentle touch and artistic precision.',
          'Every client deserves to wake up feeling beautiful and confident.',
          '760-212-0448',
          '@lashpopstudios',
          'https://www.vagaro.com/lashpop32',
          '/lashpop-images/team/emily-rogers.jpeg',
          '["Lash Extensions", "Volume Lashes", "Classic Lashes", "Business Management"]'::jsonb,
          '["Volume Extensions", "Hybrid Lashes"]'::jsonb,
          'Emily started LashPop Studios from her home and grew it into the premier lash destination in North County.',
          'By appointment'
        ),
        (
          'Rachel Edwards',
          'Lash Artist',
          'employee',
          NULL,
          'Rachel brings creativity and innovation to every lash set. Known for her artistic flair and attention to detail, she is the go-to artist for clients wanting something unique or trendy.',
          'Lashes are my canvas, and every client is a masterpiece.',
          '760-212-0448',
          '@indigomoon.beauty',
          'https://www.vagaro.com/lashpop32',
          '/lashpop-images/team/rachel-edwards.jpeg',
          '["Hybrid Extensions", "Color Lashes", "Creative Styling"]'::jsonb,
          '["Hybrid Extensions", "Colored Lashes"]'::jsonb,
          'Rachel loves incorporating subtle pops of color into lash sets for a unique twist.',
          'Tuesday - Saturday'
        ),
        (
          'Ryann Alcorn',
          'Lash Artist',
          'employee',
          NULL,
          'Ryann gentle approach and meticulous attention to detail make her perfect for first-timers and those with sensitive eyes. She believes in enhancing natural beauty, not masking it.',
          'The best compliment is when people ask if those are your real lashes.',
          '760-212-0448',
          '@ryannsbeauty',
          'https://www.vagaro.com/lashpop32',
          '/lashpop-images/team/ryann-alcorn.png',
          '["Classic Extensions", "Natural Styling", "Sensitive Eyes"]'::jsonb,
          '["Classic Lashes", "Natural Volume"]'::jsonb,
          'Ryann specializes in creating the most natural-looking lash extensions that seamlessly blend with your own lashes.',
          'Monday - Friday'
        ),
        -- Independent Artists
        (
          'Ashley Petersen',
          'HydraFacial Specialist & Lash Artist',
          'independent',
          'Integrated Body and Beauty',
          'Ashley combines beauty and wellness through her integrated approach. Specializing in HydraFacials and lash artistry, she helps clients achieve radiant skin and stunning lashes.',
          'Beauty starts with healthy skin.',
          '760-822-0255',
          '@integratedbodyandbeauty',
          'https://www.vagaro.com/lashpop32',
          '/lashpop-images/team/ashley-petersen.jpg',
          '["HydraFacials", "Lash Extensions", "Skin Care", "Wellness"]'::jsonb,
          '["HydraFacial", "Lash Extensions"]'::jsonb,
          'Ashley believes in a holistic approach to beauty, combining skincare with lash services for complete facial harmony.',
          'By appointment'
        ),
        (
          'Ava Mata',
          'Lash Artist',
          'independent',
          'Looks and Lashes',
          'Ava expertise in both classic and volume techniques allows her to create customized looks that perfectly complement each client unique features and lifestyle.',
          'Your lashes should be as unique as you are.',
          '714-336-4908',
          '@__looksandlashes__',
          'https://www.vagaro.com/lashpop32',
          '/lashpop-images/team/ava-mata.jpg',
          '["Volume Extensions", "Classic Lashes", "Lash Styling"]'::jsonb,
          '["Volume Lashes", "Custom Styling"]'::jsonb,
          'Ava loves creating dramatic volume sets that still feel lightweight and comfortable.',
          'Wednesday - Sunday'
        ),
        (
          'Savannah Scherer',
          'Lash Artist & Esthetician',
          'independent',
          'San Diego Lash',
          'Savannah offers a complete beauty experience with her expertise in lashes, brows, and skincare. Her holistic approach ensures clients leave feeling refreshed and beautiful.',
          'Beauty is about feeling good in your own skin.',
          '619-735-1237',
          '@sandiegolash',
          'https://www.vagaro.com/lashpop32',
          '/lashpop-images/team/savannah-scherer.jpeg',
          '["Lash Extensions", "Brow Services", "Facials", "Skin Care"]'::jsonb,
          '["Lash Extensions", "Brow Lamination", "Facials"]'::jsonb,
          'Savannah can create the perfect brow shape to complement any lash style.',
          'Tuesday - Saturday'
        ),
        (
          'Elena Castellanos',
          'Plasma Specialist',
          'independent',
          'Nuskin Fibroblast',
          'Elena specializes in advanced plasma treatments for skin rejuvenation. Her non-invasive techniques help clients achieve younger-looking skin without surgery.',
          'Advanced technology meets natural beauty.',
          '760-583-3357',
          '@nuskin_fibroblast',
          'https://www.vagaro.com/lashpop32',
          '/lashpop-images/team/elena-castellanos.jpeg',
          '["Jet Plasma", "Fibroblast", "Skin Tightening", "Anti-Aging"]'::jsonb,
          '["Jet Plasma", "Fibroblast Treatment"]'::jsonb,
          'Elena plasma treatments can achieve results similar to surgical procedures without the downtime.',
          'By appointment'
        ),
        (
          'Adrianna Arnaud',
          'Lash Artist',
          'independent',
          'Lashed by Adrianna',
          'Adrianna is known for her stunning volume sets and ability to create wispy, textured looks. Her attention to detail ensures every lash is perfectly placed.',
          'Volume should be dramatic yet elegant.',
          '760-964-7235',
          '@lashedbyadrianna',
          'https://www.vagaro.com/lashpop32',
          '/lashpop-images/team/adrianna-arnaud.jpg',
          '["Volume Extensions", "Mega Volume", "Wispy Lashes"]'::jsonb,
          '["Mega Volume", "Wispy Sets"]'::jsonb,
          'Adrianna can create volume fans with up to 10 lashes for the ultimate dramatic look.',
          'Monday - Friday'
        ),
        (
          'Kelly Katona',
          'Lash Artist',
          'independent',
          'Lashes by Kelly Katona',
          'Kelly expertise lies in creating beautiful, natural-looking lash extensions that enhance without overwhelming. Perfect for those seeking subtle elegance.',
          'Enhance, don''t disguise.',
          '760-805-6072',
          '@lashesbykellykatona',
          'https://www.vagaro.com/lashpop32',
          '/lashpop-images/team/kelly-katona.jpeg',
          '["Classic Extensions", "Hybrid Lashes", "Natural Looks"]'::jsonb,
          '["Classic Sets", "Natural Hybrid"]'::jsonb,
          'Kelly specializes in lash sets that look so natural, people think they are your real lashes.',
          'Tuesday - Saturday'
        ),
        (
          'Bethany Peterson',
          'Lash Artist',
          'independent',
          'Salty Lash',
          'Bethany brings a coastal vibe to lash artistry with her signature "beach wave" lash sets. Her textured, effortless styles are perfect for the California lifestyle.',
          'Effortless beauty, beach vibes always.',
          '760-703-4162',
          '@salty.lash',
          'https://www.vagaro.com/lashpop32',
          '/lashpop-images/team/bethany-peterson.jpeg',
          '["Beach Waves Lashes", "Volume Extensions", "Textured Sets"]'::jsonb,
          '["Beach Wave Lashes", "Textured Volume"]'::jsonb,
          'Bethany created the signature "Salty Lash" look inspired by California beach culture.',
          'Wednesday - Sunday'
        ),
        (
          'Grace Ramos',
          'Nurse Injector',
          'independent',
          'Naturtox',
          'Grace brings medical expertise to aesthetic enhancement. As a certified nurse injector, she specializes in natural-looking results with Botox and dermal fillers.',
          'Subtle enhancements, natural results.',
          '760-525-8628',
          '@natur_tox',
          'https://www.vagaro.com/us02/naturtoxnursinginc',
          '/lashpop-images/team/grace-ramos.jpg',
          '["Botox", "Dermal Fillers", "Lip Enhancement", "Facial Contouring"]'::jsonb,
          '["Botox", "Lip Fillers"]'::jsonb,
          'Grace has a gentle injection technique that minimizes discomfort and bruising.',
          'By appointment'
        ),
        (
          'Renee Belton',
          'Brow Specialist',
          'independent',
          'Brows by Cat Black',
          'Renee is our brow architect, creating perfect frames for your face. Her expertise in microblading and brow lamination helps clients achieve their dream brows.',
          'Great brows don''t happen by chance, they happen by appointment.',
          '760-579-1309',
          '@browsbycatblack',
          'https://www.vagaro.com/lashpop32',
          '/lashpop-images/team/renee-belton.jpg',
          '["Microblading", "Brow Lamination", "Lash Lifts", "Brow Design"]'::jsonb,
          '["Microblading", "Brow Lamination"]'::jsonb,
          'Renee can create hair-like strokes so realistic, no one can tell they are not natural.',
          'Monday - Saturday'
        ),
        (
          'Evie Ells',
          'Lash Artist & Brow Specialist',
          'independent',
          'Evie Ells Aesthetics',
          'Evie offers the perfect combination of lash and brow services, ensuring your eye area looks cohesive and beautiful. Her balanced approach creates harmony in facial features.',
          'It is all about balance and proportion.',
          '949-866-2206',
          '@evieellsaesthetics',
          'https://www.vagaro.com/lashpop32',
          '/lashpop-images/team/evie-ells.jpg',
          '["Lash Extensions", "Brow Services", "Combination Treatments"]'::jsonb,
          '["Lash & Brow Packages", "Combination Services"]'::jsonb,
          'Evie can match your lash and brow services to create the perfect coordinated look.',
          'Tuesday - Friday'
        ),
        (
          'Haley Walker',
          'Esthetician & Lash Artist',
          'independent',
          'Lashes by Haley',
          'Haley combines her esthetics background with lash artistry to provide comprehensive beauty services. Her understanding of skin and facial structure creates optimal results.',
          'Healthy skin is the best foundation for beautiful lashes.',
          '760-519-4641',
          '@haley.the.esti',
          'https://www.vagaro.com/lashpop32',
          '/lashpop-images/team/haley-walker.jpg',
          '["Lash Extensions", "Brow Services", "Skincare", "Esthetics"]'::jsonb,
          '["Lash Extensions", "Facial Treatments"]'::jsonb,
          'Haley always includes a mini facial with her lash appointments for the ultimate pampering experience.',
          'Monday - Thursday'
        )
    `

    console.log("✅ Database seeded successfully!")

    // Show counts
    const counts = await sql`
      SELECT
        (SELECT COUNT(*) FROM service_categories) as categories,
        (SELECT COUNT(*) FROM services) as services,
        (SELECT COUNT(*) FROM team_members) as team_members
    `

    console.log("\n📊 Seed Summary:")
    console.log(`  ✓ ${counts[0].categories} service categories`)
    console.log(`  ✓ ${counts[0].services} services`)
    console.log(`  ✓ ${counts[0].team_members} team members`)

  } catch (error) {
    console.error("❌ Seed failed:", error)
    throw error
  } finally {
    await sql.end()
  }
}

seed(databaseUrl)
