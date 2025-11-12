/**
 * Set optimal crop positions for all team member photos
 * Based on visual analysis of each photo
 */

import { getDb } from '@/db'
import { teamMemberPhotos } from '@/db/schema/team_member_photos'
import { eq } from 'drizzle-orm'

// Crop configurations for each team member
// Close-up circle is MOST IMPORTANT for DAM icons
const cropSettings = {
  'haley-walker.webp': {
    name: 'Haley Walker',
    cropFullVertical: { x: 50, y: 50, scale: 1 },
    cropFullHorizontal: { x: 50, y: 50, scale: 1 },
    cropMediumCircle: { x: 50, y: 28, scale: 1.3 },
    cropCloseUpCircle: { x: 50, y: 23, scale: 2.2 }, // Face in upper third, zoom in
    cropSquare: { x: 50, y: 35, scale: 1.1 }
  },
  'bethany-peterson.jpeg': {
    name: 'Bethany Peterson',
    cropFullVertical: { x: 50, y: 50, scale: 1 },
    cropFullHorizontal: { x: 50, y: 50, scale: 1 },
    cropMediumCircle: { x: 50, y: 32, scale: 1.2 },
    cropCloseUpCircle: { x: 50, y: 30, scale: 2.0 }, // Head/shoulders, perfect framing
    cropSquare: { x: 50, y: 40, scale: 1.1 }
  },
  'emily-rogers.jpeg': {
    name: 'Emily Rogers',
    cropFullVertical: { x: 50, y: 50, scale: 1 },
    cropFullHorizontal: { x: 50, y: 50, scale: 1 },
    cropMediumCircle: { x: 50, y: 30, scale: 1.3 },
    cropCloseUpCircle: { x: 50, y: 25, scale: 2.1 }, // Seated, face center-top
    cropSquare: { x: 50, y: 38, scale: 1.1 }
  },
  'rachel-edwards.jpeg': {
    name: 'Rachel Edwards',
    cropFullVertical: { x: 50, y: 50, scale: 1 },
    cropFullHorizontal: { x: 50, y: 50, scale: 1 },
    cropMediumCircle: { x: 50, y: 32, scale: 1.2 },
    cropCloseUpCircle: { x: 50, y: 28, scale: 2.0 }, // Head/shoulders
    cropSquare: { x: 50, y: 40, scale: 1.1 }
  },
  'adrianna-arnaud.jpg': {
    name: 'Adrianna Payne',
    cropFullVertical: { x: 50, y: 50, scale: 1 },
    cropFullHorizontal: { x: 50, y: 50, scale: 1 },
    cropMediumCircle: { x: 50, y: 28, scale: 1.3 },
    cropCloseUpCircle: { x: 50, y: 22, scale: 2.3 }, // Seated full view, zoom to face
    cropSquare: { x: 50, y: 35, scale: 1.1 }
  },
  'ava-mata.jpg': {
    name: 'Ava Mata',
    cropFullVertical: { x: 50, y: 50, scale: 1 },
    cropFullHorizontal: { x: 50, y: 50, scale: 1 },
    cropMediumCircle: { x: 50, y: 30, scale: 1.3 },
    cropCloseUpCircle: { x: 50, y: 24, scale: 2.2 }, // Seated, face in upper third
    cropSquare: { x: 50, y: 38, scale: 1.1 }
  },
  'savannah-scherer.jpeg': {
    name: 'Savannah Scherer',
    cropFullVertical: { x: 50, y: 50, scale: 1 },
    cropFullHorizontal: { x: 50, y: 50, scale: 1 },
    cropMediumCircle: { x: 50, y: 28, scale: 1.3 },
    cropCloseUpCircle: { x: 50, y: 22, scale: 2.3 }, // Seated, zoom to beautiful smile
    cropSquare: { x: 50, y: 35, scale: 1.1 }
  },
  'evie-ells.jpg': {
    name: 'Evie Ells',
    cropFullVertical: { x: 50, y: 50, scale: 1 },
    cropFullHorizontal: { x: 50, y: 50, scale: 1 },
    cropMediumCircle: { x: 50, y: 28, scale: 1.3 },
    cropCloseUpCircle: { x: 50, y: 23, scale: 2.2 }, // Full body seated, face upper area
    cropSquare: { x: 50, y: 35, scale: 1.1 }
  },
  'ashley-petersen.jpg': {
    name: 'Ashley Petersen',
    cropFullVertical: { x: 50, y: 50, scale: 1 },
    cropFullHorizontal: { x: 50, y: 50, scale: 1 },
    cropMediumCircle: { x: 50, y: 32, scale: 1.2 },
    cropCloseUpCircle: { x: 50, y: 29, scale: 1.9 }, // Head/shoulders, great framing
    cropSquare: { x: 50, y: 40, scale: 1.1 }
  },
  'ryann-alcorn.png': {
    name: 'Ryann Alcorn',
    cropFullVertical: { x: 50, y: 50, scale: 1 },
    cropFullHorizontal: { x: 50, y: 50, scale: 1 },
    cropMediumCircle: { x: 50, y: 35, scale: 1.15 },
    cropCloseUpCircle: { x: 50, y: 33, scale: 1.8 }, // Close headshot, already well framed
    cropSquare: { x: 50, y: 42, scale: 1.05 }
  },
  'kelly-katona.jpeg': {
    name: 'Kelly Katona',
    cropFullVertical: { x: 50, y: 50, scale: 1 },
    cropFullHorizontal: { x: 50, y: 50, scale: 1 },
    cropMediumCircle: { x: 50, y: 30, scale: 1.25 },
    cropCloseUpCircle: { x: 50, y: 27, scale: 2.0 }, // Head/shoulders with floral background
    cropSquare: { x: 50, y: 38, scale: 1.1 }
  }
}

async function setCrops() {
  const db = getDb()

  console.log('🎨 Setting optimal crops for all team members...\n')

  for (const [fileName, crops] of Object.entries(cropSettings)) {
    try {
      // Find the photo by filename
      const photos = await db
        .select()
        .from(teamMemberPhotos)
        .where(eq(teamMemberPhotos.fileName, fileName))
        .limit(1)

      if (photos.length === 0) {
        console.log(`⚠️  ${crops.name} - Photo not found (${fileName})`)
        continue
      }

      const photo = photos[0]

      // Update crops
      await db
        .update(teamMemberPhotos)
        .set({
          cropFullVertical: crops.cropFullVertical,
          cropFullHorizontal: crops.cropFullHorizontal,
          cropMediumCircle: crops.cropMediumCircle,
          cropCloseUpCircle: crops.cropCloseUpCircle,
          cropSquare: crops.cropSquare,
          updatedAt: new Date()
        })
        .where(eq(teamMemberPhotos.id, photo.id))

      console.log(`✅ ${crops.name} - All crops set (Close-up: y:${crops.cropCloseUpCircle.y}, scale:${crops.cropCloseUpCircle.scale})`)
    } catch (error) {
      console.error(`❌ ${crops.name} - Error:`, error)
    }
  }

  console.log('\n🎉 All crops have been set!')
  console.log('\n📝 Close-up circle crops are optimized for DAM icons')
  console.log('   Each crop is positioned to show just the face in a circular frame')
}

setCrops()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
