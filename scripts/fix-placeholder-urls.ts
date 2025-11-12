import { getDb } from '@/db'
import { teamMembers } from '@/db/schema/team_members'
import { eq } from 'drizzle-orm'

async function fixPlaceholders() {
  const db = getDb()

  console.log('🔧 Fixing placeholder image URLs...\n')

  // Update all team members with incorrect placeholder
  const result = await db
    .update(teamMembers)
    .set({
      imageUrl: '/placeholder-team.svg',
      updatedAt: new Date()
    })
    .where(eq(teamMembers.imageUrl, '/placeholder-team.jpg'))
    .returning({ name: teamMembers.name })

  if (result.length > 0) {
    console.log('✅ Updated the following team members:')
    result.forEach(r => console.log(`   - ${r.name}`))
  } else {
    console.log('ℹ️  No team members needed updating')
  }

  console.log('\n✅ All placeholder URLs fixed!')
}

fixPlaceholders().then(() => process.exit(0))
