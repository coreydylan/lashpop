/**
 * Check all team members in the database
 */

import { getDb } from '@/db'
import { teamMembers } from '@/db/schema/team_members'

async function checkTeamMembers() {
  const db = getDb()

  console.log('🔍 Fetching ALL team members from database...\n')

  const allMembers = await db
    .select({
      id: teamMembers.id,
      name: teamMembers.name,
      vagaroEmployeeId: teamMembers.vagaroEmployeeId,
      isActive: teamMembers.isActive,
      email: teamMembers.email,
      phone: teamMembers.phone,
      lastSyncedAt: teamMembers.lastSyncedAt
    })
    .from(teamMembers)
    .orderBy(teamMembers.name)

  console.log(`Total team members in DB: ${allMembers.length}\n`)

  const activeMembers = allMembers.filter(m => m.isActive)
  const inactiveMembers = allMembers.filter(m => !m.isActive)

  console.log(`✅ Active members (${activeMembers.length}):`)
  activeMembers.forEach(m => {
    console.log(`  - ${m.name} (Vagaro ID: ${m.vagaroEmployeeId || 'NONE'})`)
  })

  if (inactiveMembers.length > 0) {
    console.log(`\n❌ Inactive members (${inactiveMembers.length}):`)
    inactiveMembers.forEach(m => {
      console.log(`  - ${m.name} (Vagaro ID: ${m.vagaroEmployeeId || 'NONE'})`)
    })
  }

  console.log('\n📊 Summary:')
  console.log(`  Total: ${allMembers.length}`)
  console.log(`  Active: ${activeMembers.length}`)
  console.log(`  Inactive: ${inactiveMembers.length}`)
  console.log(`  Expected from Vagaro: 17`)
  console.log(`  Missing: ${17 - allMembers.length}`)
}

checkTeamMembers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
