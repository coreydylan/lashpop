/**
 * View team member photos and their current paths
 */

import { getDb } from '@/db'
import { teamMembers } from '@/db/schema/team_members'
import { teamMemberPhotos } from '@/db/schema/team_member_photos'
import { eq, and } from 'drizzle-orm'

async function viewTeamPhotos() {
  const db = getDb()

  console.log('📸 Team Member Photos:\n')

  const members = await db
    .select({
      id: teamMembers.id,
      name: teamMembers.name,
      imageUrl: teamMembers.imageUrl
    })
    .from(teamMembers)
    .where(eq(teamMembers.isActive, true))

  for (const member of members) {
    console.log(`\n👤 ${member.name}`)
    console.log(`   Image: ${member.imageUrl}`)

    // Get photos for this member
    const photos = await db
      .select()
      .from(teamMemberPhotos)
      .where(eq(teamMemberPhotos.teamMemberId, member.id))

    if (photos.length > 0) {
      const primaryPhoto = photos.find(p => p.isPrimary)
      if (primaryPhoto) {
        console.log(`   Photo ID: ${primaryPhoto.id}`)
        console.log(`   File: ${primaryPhoto.filePath}`)
        console.log(`   Current crops:`)
        console.log(`     - Close-up Circle: ${JSON.stringify(primaryPhoto.cropCloseUpCircle)}`)
      }
    } else {
      console.log(`   ⚠️  No photos in team_member_photos table`)
    }
  }
}

viewTeamPhotos()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
