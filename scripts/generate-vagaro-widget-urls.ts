/**
 * Generate Vagaro Widget URLs from Service IDs
 *
 * This script:
 * 1. Reads service IDs from the Vagaro widget builder HTML
 * 2. Matches them to services in our database by name
 * 3. Generates widget URLs for each service
 * 4. Outputs a JSON file ready for bulk import
 *
 * Usage:
 *   npx tsx scripts/generate-vagaro-widget-urls.ts
 */

import { config } from 'dotenv'
import { getDb } from '../src/db'
import { services } from '../src/db/schema/services'
import * as fs from 'fs'

config({ path: '.env.local' })

// Base URL pattern for Vagaro widget
// The service-specific part is added via the enc parameter
const VAGARO_BASE_URL = 'https://www.vagaro.com/Users/BusinessWidget.aspx'

// Service IDs extracted from the Vagaro widget builder HTML (servicesselector.xml)
// Format: { vagaroId, vagaroName, category }
const VAGARO_SERVICES = [
  // Eyelash Extension Services
  { id: 'J9Nx9Ci3xkXvXrjX0UESkg==', name: 'Classic Full Set of Lash Extensions', category: 'Eyelash Extension Services' },
  { id: 'SgQRmn3SpgZterjZF18kMw==', name: 'Classic Lash Fill', category: 'Eyelash Extension Services' },
  { id: 'xMffIMCl8lbv0y9xl8QIDA==', name: 'Classic Mini Fill', category: 'Eyelash Extension Services' },
  { id: 'hKIKzxJOZ69i26WVXSH8FQ==', name: 'Wet/Angel Style Full Set of Lash Extensions', category: 'Eyelash Extension Services' },
  { id: '04Kfwm2lsHOUNcyMJUnLkQ==', name: 'Wet/Angel Lash Fill', category: 'Eyelash Extension Services' },
  { id: 'RfKd6y5Ta5J0IKhPTEvYCg==', name: 'Wet/Angel Style Mini Fill', category: 'Eyelash Extension Services' },
  { id: 'hL4HbbYHtIk6rMUTa3PHLg==', name: 'Hybrid Full Set of Lash Extensions', category: 'Eyelash Extension Services' },
  { id: 'QpRGPFjV5esqfqrMYQjcEg==', name: 'Hybrid Lash Fill', category: 'Eyelash Extension Services' },
  { id: 'dVqKZ7AhWkBjYsfVir8mLA==', name: 'Hybrid Mini Fill', category: 'Eyelash Extension Services' },
  { id: 'UsbBQTmp0fYo8tq70sA7Vg==', name: 'Volume Full Set of Lash Extensions', category: 'Eyelash Extension Services' },
  { id: 'iwepJYbrSe5Xefymja51EQ==', name: 'Volume Lash Fill', category: 'Eyelash Extension Services' },
  { id: 'gw90EdxqWPblztH9yWds4w==', name: 'Volume Mini Fill', category: 'Eyelash Extension Services' },
  { id: 'Z38as4IrGriZIWMz4h3nEw==', name: 'Mega Volume Full Set', category: 'Eyelash Extension Services' },
  { id: 'BW3dwQk4FVZrm~q7Cug51Q==', name: 'Mega Volume Fill', category: 'Eyelash Extension Services' },
  { id: 'o18J4sZLZnXfjlWZEnCLEA==', name: 'Mega Volume Mini Fill', category: 'Eyelash Extension Services' },
  { id: 'ULbrZmD-5MCdVH6RrYio2Q==', name: 'Colored Eyelash Extensions', category: 'Eyelash Extension Services' },
  { id: 'pOP76V1TcUueMh1y0IUycg==', name: 'Removal', category: 'Eyelash Extension Services' },

  // Lash Lift Services
  { id: 't71DT-eRjLEUfZrlY3dy8A==', name: 'Lash Lift & Tint', category: 'Lash Lift Services' },
  { id: 'UyoTIn5ZL45ZJZ9uhwNQQQ==', name: 'Lash Lift', category: 'Lash Lift Services' },
  { id: 'gQg7jzJEEhJeoPSApsmhYg==', name: 'Lash Tint', category: 'Lash Lift Services' },
  { id: '2RhXrvSAR8d-8MilXJADrw==', name: 'Lash Lift Reversal', category: 'Lash Lift Services' },

  // Brow Services
  { id: '8OeTlaP3KQSGrbs6PYSxfA==', name: 'Brow Shaping (Wax + Tweeze + Trim)', category: 'Brow Services' },
  { id: 'Uj01ockNxGPfs1MATdE5Jg==', name: 'Brow Lamination & Tint', category: 'Brow Services' },
  { id: 'ih2Nfh~kYENSIXV6CwJakQ==', name: 'Brow Tint', category: 'Brow Services' },
  { id: '37T9WJphi57JwRD8XQTTcw==', name: 'Brow Lamination', category: 'Brow Services' },
  { id: '3Uu1Wbm6zJQnQklLuAw0Jw==', name: 'Post Lamination Maintenance', category: 'Brow Services' },
  { id: 'kz7n9RCCVUyfkLbj~6DTPw==', name: 'Brow Consultation', category: 'Brow Services' },

  // Permanent Makeup
  { id: 'Og-ADeliLMSQprYUPSsklQ==', name: 'Microblading (1st Appointment)', category: 'Permanent Makeup' },
  { id: '2YSC0yJKu7Ka2z-iS1aBFg==', name: 'Microblading (2nd Perfecting Appointment)', category: 'Permanent Makeup' },
  { id: 'zOXaBU9euFsl-Eko04ajVg==', name: 'Microblading (Annual Refresh)', category: 'Permanent Makeup' },
  { id: 'cz7w5f-454dRGUU1~i0IoA==', name: 'Nanobrows (1st Appointment)', category: 'Permanent Makeup' },
  { id: 'iz4vLUuufWmuN0twzhvTpA==', name: 'Nanobrows (2nd Perfecting Appointment)', category: 'Permanent Makeup' },
  { id: 'VLefXSZB-10dc7VoJouv-g==', name: 'Nanobrows (Annual Refresh)', category: 'Permanent Makeup' },
  { id: 'kUBSTniVxhqQLZYFotuH8A==', name: 'Faux Beauty Marks (1st Appointment)', category: 'Permanent Makeup' },
  { id: 'x2gLTFSMB2yf4pGN9CGg4w==', name: 'Faux Beauty Marks (2nd Perfecting Appointment)', category: 'Permanent Makeup' },
  { id: 'EwLv085A51UwEmgHbtuZhA==', name: 'Faux Beauty Marks (Annual Refresh)', category: 'Permanent Makeup' },
  { id: '7KgyUEy~cpQ~0-KiVVN3Xw==', name: 'Lip Blushing (1st Appointment)', category: 'Permanent Makeup' },
  { id: 'UOypOrXqOBiNFqxAX96qWw==', name: 'Lip Blushing (2nd Perfecting Appointment)', category: 'Permanent Makeup' },
  { id: 'QHjbIgTBm~y0CQ43yQ0yUw==', name: 'Lip Blushing (Annual Refresh)', category: 'Permanent Makeup' },
  { id: 'L1RHgiETjUa2rxaDIMysXA==', name: 'Faux Freckles (1st Appointment)', category: 'Permanent Makeup' },
  { id: 'vj4tBacMZFsK3v3uzGrrVQ==', name: 'Faux Freckles (2nd Perfecting Appointment)', category: 'Permanent Makeup' },
  { id: 'yMbnnlipu1iXMbcRExKt~Q==', name: 'Faux Freckles (Annual Refresh)', category: 'Permanent Makeup' },
  { id: 'tpsjAhy0lpNwfEQXh-5tiA==', name: 'Permanent Makeup Consultation', category: 'Permanent Makeup' },
  { id: '6gjXDu8Vcr5WydtbHb3r7w==', name: 'Tattoos', category: 'Permanent Makeup' },

  // Skin Care and Facial Services
  { id: 'ATDMshuZyBwy6btKY7SMtg==', name: 'Signature Facial', category: 'Skin Care' },
  { id: '3c~pYKCgVHpuQ8koNSFb~w==', name: 'Age Gracefully Facial', category: 'Skin Care' },
  { id: 'O4JXEfm8jIGABw9qQ0KKGg==', name: 'Acne Fighting Facial', category: 'Skin Care' },
  { id: 'gDZGv~hlso~a-2gcXQe7jQ==', name: 'Sooth and Calm Facial', category: 'Skin Care' },
  { id: 'A~CLpH5-vn699pDw1nX-Xg==', name: 'Oxygen Deep Pore Facial', category: 'Skin Care' },
  { id: 'aV6ugFo0~mSgyjZV2zhL0g==', name: 'Citrus Refresher Facial', category: 'Skin Care' },
  { id: 'pjNlc4D0BMXr1nTA4xw5mA==', name: 'Tailored to You Facial', category: 'Skin Care' },
  { id: 'OEg0hLXITuFD4TNG~yR2WA==', name: 'Acne Relief Facial', category: 'Skin Care' },
  { id: 'DdD7OYF2VJUEHfovFNsj1w==', name: 'Celluma Facial', category: 'Skin Care' },
  { id: 'mQdr6xKRVNEMNpK167hFZg==', name: 'Epicutis Facial', category: 'Skin Care' },
  { id: 'A30tqXIe6JwvSQHrfab~9A==', name: 'Oasis Facial', category: 'Skin Care' },
  { id: 'NvcnMwR~G-8RCJp5haDY1w==', name: 'Rejuvenating Facial', category: 'Skin Care' },
  { id: 'zviBre7ZjC3h4pXKJJyhtQ==', name: 'Dermaplaning Facial', category: 'Skin Care' },
  { id: 'm5dYbgdO0JoOLKSCIqV7YA==', name: 'Back Facial', category: 'Skin Care' },
  { id: '5cPmTvbYAZxyhwCikGZbHg==', name: 'Clarifying Hydrafacial', category: 'Skin Care' },
  { id: 'rSumtUkUJ5DZLqsIH5Il3w==', name: 'Customized Hydrafacial', category: 'Skin Care' },
  { id: 'lf4scf9mycOUkqyBG2DVuA==', name: 'Glow and Go Hydrafacial', category: 'Skin Care' },
  { id: 'Pz85J-uugtTYmo7BdlBWjA==', name: 'Restorative Hydrafacial', category: 'Skin Care' },
  { id: 'fZFzz0MBut8sDpGTUOxkVw==', name: 'The Ultimate Hydrafacial', category: 'Skin Care' },
  { id: 'GKeySfhHYwq~dGs4zEAMZg==', name: 'Celluma LED Light Therapy', category: 'Skin Care' },
  { id: 'jEpsunj067YOSS8RGoeFuA==', name: 'Express Dermaplaning', category: 'Skin Care' },
  { id: 'MFrwVmMsHSYIFGRx0gTnWQ==', name: 'Hand and Arm Treatment', category: 'Skin Care' },
  { id: 'WrYHH0IGDNTw3Tx8y6IJfQ==', name: 'Hydrojelly Mask', category: 'Skin Care' },
  { id: 'qxSMPF0~PHsRjtYJjWXb3g==', name: 'Lymphatic Drainage', category: 'Skin Care' },
  { id: 'TIwiqoo1sjdet6eKq2EC7Q==', name: 'Fibroblast Skin Treatment', category: 'Skin Care' },
  { id: 'iVGJLT4k5M9E7-MPNw7AKg==', name: 'Jet Plasma Skin Treatment', category: 'Skin Care' },

  // Permanent Jewelry
  { id: 'mHUoyfo5tHYvcZjvbCXtsw==', name: 'Permanent Jewelry for 1-3 People/Pieces', category: 'Permanent Jewelry' },
  { id: 'qLA~d5GMgVK4QgedMqj28w==', name: 'Permanent Jewelry for 4-6 People/Pieces', category: 'Permanent Jewelry' },
  { id: '2KUSe-20DWQ5Z8APglQemQ==', name: 'Permanent Jewelry Re-Weld', category: 'Permanent Jewelry' },

  // Waxing Services
  { id: 'M1fihIt1GX2hVJRdJ-Lyww==', name: 'Arm Wax (Full)', category: 'Waxing Services' },
  { id: 'N3qfq-9nMrGK3E7ctZpAFw==', name: 'Arm Wax (Half)', category: 'Waxing Services' },
  { id: 'mWesfWOfBnra23qq~-yVTA==', name: 'Brazilian Wax', category: 'Waxing Services' },
  { id: 'lRt-Q7tFbFNnqb9Htes80A==', name: 'Brow Shaping (Wax + Tweeze + Trim)', category: 'Waxing Services' },
  { id: '0ffrQ4Do9CGWcvv4K4bA0g==', name: 'Chin Wax', category: 'Waxing Services' },
  { id: '69DD38LFeBtDtOCMWm8ZFw==', name: 'Full Face Wax', category: 'Waxing Services' },
  { id: '7C86~KFpyz1DcyaNf1sp1w==', name: 'Leg Wax (Full)', category: 'Waxing Services' },
  { id: 'Nl~sDWYh2qO54mcrheSV5w==', name: 'Leg Wax (Half)', category: 'Waxing Services' },
  { id: 'O9v9UAZD96jCLON8D5-M8Q==', name: 'Upper Lip and Chin Wax', category: 'Waxing Services' },
  { id: 'zbNv8X9iiUISLtvEE2S-UA==', name: 'Lower Back Wax', category: 'Waxing Services' },
  { id: 'XGVNYUFEQOCFGah5XwwO-w==', name: 'Nose Wax', category: 'Waxing Services' },
  { id: 'MeCYA87UIMuVmmYKDIcrwg==', name: 'Sideburn Wax', category: 'Waxing Services' },
  { id: 'KJ7RmbHf6agR5ric6Gzisw==', name: 'Underarm Wax', category: 'Waxing Services' },
  { id: 'PE6BjxOIGcNY5ME~mYRbUQ==', name: 'Upper Lip Wax', category: 'Waxing Services' },

  // Bundles
  { id: 'zxGZEN6OZ9FkLGv1haRitw==', name: 'Lash Lift & Tint Bundle', category: 'Bundles' },
  { id: 'n8ipSHxfh4Qw2UlZBezgmQ==', name: 'Brow Lamination & Tint Bundle', category: 'Bundles' },
  { id: '30u5rCOumWZH4919fzQxFQ==', name: 'Facial Wax & Brow Tint Bundle', category: 'Bundles' },
  { id: 'gqMZV0xOQZO8zZb9fM1dtg==', name: 'Brow Shaping & Tint Bundle', category: 'Bundles' },
  { id: '5IPHZ0QXqltueNW2tgHTGw==', name: 'Brow Lamination & Lash Lift Bundle', category: 'Bundles' },
  { id: 'HCYhoF9A0LxX6vpG49Vx6Q==', name: 'Brazilian & Underarms Wax', category: 'Bundles' },
  { id: 'pSmmLj0mQQBiE8JpZKDwYw==', name: 'Brazilian & Brow Wax', category: 'Bundles' },

  // Training
  { id: 'ZEVKKbeQlBFTlXa6gzy9HA==', name: 'Lashpop Pro Training', category: 'Training' },
]

// Name normalization for matching
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function main() {
  console.log('🔍 Fetching services from database...\n')

  const db = getDb()
  const dbServices = await db
    .select({
      id: services.id,
      name: services.name,
      slug: services.slug,
      vagaroServiceId: services.vagaroServiceId,
      mainCategory: services.mainCategory,
    })
    .from(services)

  console.log(`Found ${dbServices.length} services in database`)
  console.log(`Found ${VAGARO_SERVICES.length} services in Vagaro\n`)

  // Match services
  const matches: Array<{
    dbSlug: string
    dbName: string
    vagaroId: string
    vagaroName: string
    matchType: 'exact' | 'normalized' | 'vagaroId' | 'manual'
  }> = []

  const unmatched: Array<{ name: string; category: string; id: string }> = []

  for (const vagaro of VAGARO_SERVICES) {
    const normalizedVagaroName = normalizeName(vagaro.name)

    // Try to find a match
    let match = dbServices.find(db => {
      // Exact name match
      if (db.name === vagaro.name) return true

      // Normalized name match
      if (normalizeName(db.name) === normalizedVagaroName) return true

      // Vagaro ID match
      if (db.vagaroServiceId === vagaro.id) return true

      return false
    })

    if (match) {
      matches.push({
        dbSlug: match.slug,
        dbName: match.name,
        vagaroId: vagaro.id,
        vagaroName: vagaro.name,
        matchType: match.name === vagaro.name ? 'exact' :
                   normalizeName(match.name) === normalizedVagaroName ? 'normalized' :
                   'vagaroId'
      })
    } else {
      unmatched.push({ name: vagaro.name, category: vagaro.category, id: vagaro.id })
    }
  }

  console.log(`\n✅ Matched ${matches.length} services`)
  console.log(`❌ Unmatched ${unmatched.length} services\n`)

  // Show unmatched services
  if (unmatched.length > 0) {
    console.log('Unmatched Vagaro services (need manual mapping):')
    console.log('-'.repeat(60))
    for (const u of unmatched) {
      console.log(`  [${u.category}] ${u.name}`)
      console.log(`    Vagaro ID: ${u.id}`)
    }
    console.log()
  }

  // Output the mapping data
  console.log('To complete the setup:')
  console.log('1. You need to provide the widget URLs for each service')
  console.log('2. Get each URL from Vagaro admin: More > Settings > Service Menu > [Service] > Share Link')
  console.log()

  // Create output for matched services (needs URLs to be filled in)
  const output = matches.map(m => ({
    slug: m.dbSlug,
    name: m.dbName,
    vagaroId: m.vagaroId,
    vagaroWidgetUrl: null as string | null,  // TO BE FILLED IN
  }))

  // Save to file
  const outputPath = 'vagaro-service-mapping.json'
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
  console.log(`💾 Saved mapping to ${outputPath}`)
  console.log()
  console.log('Next steps:')
  console.log('1. For each service, get the Share Link URL from Vagaro')
  console.log('2. Update the vagaroWidgetUrl field in the JSON file')
  console.log('3. Run: npx tsx scripts/manage-vagaro-widget-urls.ts bulk vagaro-service-mapping.json')

  process.exit(0)
}

main()
