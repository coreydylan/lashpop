/**
 * Manually add missing team members that aren't assigned to services yet
 */

import { getDb } from '@/db'
import { teamMembers } from '@/db/schema/team_members'
import { eq } from 'drizzle-orm'

async function addMissingMembers() {
  const db = getDb()

  const missingMembers = [
    {
      name: 'Renee Belton',
      phone: '', // You'll need to fill these in
      email: '',
      role: 'Lash Artist',
      type: 'employee' as const,
      bookingUrl: 'https://www.vagaro.com/lashpop32',
      usesLashpopBooking: true,
      imageUrl: '/placeholder-team.jpg',
      specialties: [],
      displayOrder: '0',
      isActive: true
    },
    {
      name: 'Kimberly Starnes',
      phone: '',
      email: '',
      role: 'Lash Artist',
      type: 'employee' as const,
      bookingUrl: 'https://www.vagaro.com/lashpop32',
      usesLashpopBooking: true,
      imageUrl: '/placeholder-team.jpg',
      specialties: [],
      displayOrder: '0',
      isActive: true
    },
    {
      name: 'Elena Castellanos',
      phone: '',
      email: '',
      role: 'Lash Artist',
      type: 'employee' as const,
      bookingUrl: 'https://www.vagaro.com/lashpop32',
      usesLashpopBooking: true,
      imageUrl: '/placeholder-team.jpg',
      specialties: [],
      displayOrder: '0',
      isActive: true
    }
  ]

  console.log('➕ Adding missing team members...\n')

  for (const member of missingMembers) {
    try {
      // Check if already exists
      const existing = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.name, member.name))
        .limit(1)

      if (existing.length > 0) {
        console.log(`⚠️  ${member.name} already exists, skipping`)
        continue
      }

      await db.insert(teamMembers).values(member)
      console.log(`✓ Added ${member.name}`)
    } catch (error) {
      console.error(`❌ Failed to add ${member.name}:`, error)
    }
  }

  console.log('\n✅ Done!')
}

addMissingMembers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
