import { getDb } from '@/db'
import { teamMembers } from '@/db/schema/team_members'
import { eq, or } from 'drizzle-orm'

async function check() {
  const db = getDb()

  const members = await db
    .select()
    .from(teamMembers)
    .where(
      or(
        eq(teamMembers.name, 'Elena Castellanos'),
        eq(teamMembers.name, 'Kimberly Starnes')
      )
    )

  members.forEach(m => {
    console.log(`\n${m.name}:`)
    console.log(`  imageUrl: "${m.imageUrl}"`)
    console.log(`  isActive: ${m.isActive}`)
  })
}

check().then(() => process.exit(0))
