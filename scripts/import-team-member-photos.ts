/**
 * Import existing team member profile photos into team_member_photos table
 * This migrates "ghost photos" (stored in imageUrl) to the proper DAM system
 */

import { getDb } from '@/db'
import { teamMembers } from '@/db/schema/team_members'
import { teamMemberPhotos } from '@/db/schema/team_member_photos'
import { eq, and } from 'drizzle-orm'

async function importTeamMemberPhotos() {
  const db = getDb()

  console.log('🔄 Importing team member profile photos...\n')

  // Get all team members with imageUrl
  const members = await db
    .select({
      id: teamMembers.id,
      name: teamMembers.name,
      imageUrl: teamMembers.imageUrl
    })
    .from(teamMembers)

  console.log(`Found ${members.length} team members\n`)

  for (const member of members) {
    if (!member.imageUrl || member.imageUrl === '/placeholder-team.jpg') {
      console.log(`⏭️  Skipping ${member.name} (no image or placeholder)`)
      continue
    }

    // Check if this photo already exists in team_member_photos
    const existingPhoto = await db
      .select()
      .from(teamMemberPhotos)
      .where(
        and(
          eq(teamMemberPhotos.teamMemberId, member.id),
          eq(teamMemberPhotos.filePath, member.imageUrl)
        )
      )
      .limit(1)

    if (existingPhoto.length > 0) {
      console.log(`✓ ${member.name} - Photo already in database`)

      // Ensure it's set as primary
      await db
        .update(teamMemberPhotos)
        .set({ isPrimary: true })
        .where(eq(teamMemberPhotos.id, existingPhoto[0].id))

      continue
    }

    // Unset any existing primary photos for this member
    await db
      .update(teamMemberPhotos)
      .set({ isPrimary: false })
      .where(eq(teamMemberPhotos.teamMemberId, member.id))

    // Import the photo
    const fileName = member.imageUrl.split('/').pop() || 'profile-photo.jpg'

    await db
      .insert(teamMemberPhotos)
      .values({
        teamMemberId: member.id,
        fileName: fileName,
        filePath: member.imageUrl,
        isPrimary: true,
        // Set default crop positions (centered, full image)
        cropFullVertical: { x: 50, y: 50, scale: 1 },
        cropFullHorizontal: { x: 50, y: 50, scale: 1 },
        cropMediumCircle: { x: 50, y: 50, scale: 1 },
        cropCloseUpCircle: { x: 50, y: 40, scale: 1.5 }, // Slightly zoomed for headshot
        cropSquare: { x: 50, y: 50, scale: 1 }
      })

    console.log(`✅ Imported photo for ${member.name}`)
  }

  console.log('\n✅ Photo import complete!')
  console.log('\n📝 Next steps:')
  console.log('  1. Visit /dam/team to adjust crop settings')
  console.log('  2. All photos are now editable in the DAM system')
  console.log('  3. Changes will automatically sync to team member records')
}

importTeamMemberPhotos()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Import failed:', error)
    process.exit(1)
  })
