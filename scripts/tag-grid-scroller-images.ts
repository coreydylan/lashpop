/**
 * Script to programmatically tag images for the grid scroller component
 *
 * Usage: npx tsx scripts/tag-grid-scroller-images.ts
 */

import { getDb } from '../src/db'
import { assets } from '../src/db/schema/assets'
import { tags } from '../src/db/schema/tags'
import { tagCategories } from '../src/db/schema/tag_categories'
import { assetTags } from '../src/db/schema/asset_tags'
import { eq, and, like, inArray } from 'drizzle-orm'

async function main() {
  console.log('🏷️  Starting grid-scroller image tagging...\n')

  const db = getDb()

  // Step 1: Create or get 'website' category
  console.log('📁 Step 1: Checking for "website" category...')
  let websiteCategory = await db
    .select()
    .from(tagCategories)
    .where(eq(tagCategories.name, 'website'))
    .limit(1)

  if (websiteCategory.length === 0) {
    console.log('   Creating "website" category...')
    const [newCategory] = await db
      .insert(tagCategories)
      .values({
        name: 'website',
        displayName: 'Website',
        description: 'Images used on the public website',
        color: '#4F46E5',
        sortOrder: 100,
      })
      .returning()
    websiteCategory = [newCategory]
    console.log('   ✅ Created "website" category')
  } else {
    console.log('   ✅ "website" category already exists')
  }

  const categoryId = websiteCategory[0].id

  // Step 2: Create or get 'grid-scroller' tag
  console.log('\n🏷️  Step 2: Checking for "grid-scroller" tag...')
  let gridScrollerTag = await db
    .select()
    .from(tags)
    .where(
      and(
        eq(tags.categoryId, categoryId),
        eq(tags.name, 'grid-scroller')
      )
    )
    .limit(1)

  if (gridScrollerTag.length === 0) {
    console.log('   Creating "grid-scroller" tag...')
    const [newTag] = await db
      .insert(tags)
      .values({
        categoryId,
        name: 'grid-scroller',
        displayName: 'Grid Scroller',
        sortOrder: 0,
      })
      .returning()
    gridScrollerTag = [newTag]
    console.log('   ✅ Created "grid-scroller" tag')
  } else {
    console.log('   ✅ "grid-scroller" tag already exists')
  }

  const gridScrollerTagId = gridScrollerTag[0].id

  // Step 3: Create or get 'key-image' tag
  console.log('\n🔑 Step 3: Checking for "key-image" tag...')
  let keyImageTag = await db
    .select()
    .from(tags)
    .where(
      and(
        eq(tags.categoryId, categoryId),
        eq(tags.name, 'key-image')
      )
    )
    .limit(1)

  if (keyImageTag.length === 0) {
    console.log('   Creating "key-image" tag...')
    const [newTag] = await db
      .insert(tags)
      .values({
        categoryId,
        name: 'key-image',
        displayName: 'Key Image',
        sortOrder: 1,
      })
      .returning()
    keyImageTag = [newTag]
    console.log('   ✅ Created "key-image" tag')
  } else {
    console.log('   ✅ "key-image" tag already exists')
  }

  const keyImageTagId = keyImageTag[0].id

  // Step 4: Find suitable images (prefer gallery images)
  console.log('\n🖼️  Step 4: Finding suitable images...')
  const allAssets = await db
    .select()
    .from(assets)
    .where(
      like(assets.filePath, '%gallery%')
    )
    .limit(20)

  if (allAssets.length === 0) {
    console.log('   ⚠️  No gallery images found in DAM')
    console.log('   Fetching any available images...')
    const anyAssets = await db
      .select()
      .from(assets)
      .limit(15)

    if (anyAssets.length === 0) {
      console.log('   ❌ No assets found in DAM. Please upload some images first.')
      process.exit(1)
    }

    console.log(`   ✅ Found ${anyAssets.length} images to tag`)
    await tagImages(db, anyAssets, gridScrollerTagId, keyImageTagId)
  } else {
    console.log(`   ✅ Found ${allAssets.length} gallery images`)
    await tagImages(db, allAssets, gridScrollerTagId, keyImageTagId)
  }

  console.log('\n✨ Tagging complete!')
  console.log('\n📊 Summary:')
  console.log(`   - Category: website`)
  console.log(`   - Tag: grid-scroller`)
  console.log(`   - Images tagged: ${allAssets.length || 15}`)
  console.log(`   - Key image: ${allAssets[0]?.fileName || 'First image'}`)
  console.log('\n🌐 Test the API: http://localhost:3000/api/dam/grid-scroller')

  process.exit(0)
}

async function tagImages(
  db: any,
  imagesToTag: any[],
  gridScrollerTagId: string,
  keyImageTagId: string
) {
  console.log('\n🏷️  Step 5: Tagging images...')

  // Remove existing grid-scroller tags first
  const existingTags = await db
    .select()
    .from(assetTags)
    .where(eq(assetTags.tagId, gridScrollerTagId))

  if (existingTags.length > 0) {
    console.log(`   Removing ${existingTags.length} existing tags...`)
    await db
      .delete(assetTags)
      .where(eq(assetTags.tagId, gridScrollerTagId))
  }

  // Remove existing key-image tags
  const existingKeyTags = await db
    .select()
    .from(assetTags)
    .where(eq(assetTags.tagId, keyImageTagId))

  if (existingKeyTags.length > 0) {
    console.log(`   Removing ${existingKeyTags.length} existing key-image tags...`)
    await db
      .delete(assetTags)
      .where(eq(assetTags.tagId, keyImageTagId))
  }

  // Tag all images with grid-scroller
  for (let i = 0; i < imagesToTag.length; i++) {
    const asset = imagesToTag[i]
    console.log(`   [${i + 1}/${imagesToTag.length}] Tagging: ${asset.fileName}`)

    await db.insert(assetTags).values({
      assetId: asset.id,
      tagId: gridScrollerTagId,
    })
  }

  // Tag first image as key image
  if (imagesToTag.length > 0) {
    console.log(`\n🔑 Marking "${imagesToTag[0].fileName}" as key image...`)
    await db.insert(assetTags).values({
      assetId: imagesToTag[0].id,
      tagId: keyImageTagId,
    })
  }

  console.log('   ✅ All images tagged successfully')
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
