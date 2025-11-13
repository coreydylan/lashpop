/**
 * Test script to verify grid-scroller API is working
 */

import { getDb } from '../src/db'
import { assets } from '../src/db/schema/assets'
import { assetTags } from '../src/db/schema/asset_tags'
import { tags } from '../src/db/schema/tags'
import { tagCategories } from '../src/db/schema/tag_categories'
import { eq, and, inArray } from 'drizzle-orm'

async function test() {
  console.log('🧪 Testing grid-scroller API query...\n')

  const db = getDb()

  // Find the 'website' category
  const [websiteCategory] = await db
    .select()
    .from(tagCategories)
    .where(eq(tagCategories.name, 'website'))
    .limit(1)

  if (!websiteCategory) {
    console.log('❌ No "website" category found')
    return
  }

  console.log('✅ Found website category:', websiteCategory.id)

  // Find the 'grid-scroller' tag
  const [gridScrollerTag] = await db
    .select()
    .from(tags)
    .where(
      and(eq(tags.categoryId, websiteCategory.id), eq(tags.name, 'grid-scroller'))
    )
    .limit(1)

  if (!gridScrollerTag) {
    console.log('❌ No "grid-scroller" tag found')
    return
  }

  console.log('✅ Found grid-scroller tag:', gridScrollerTag.id)

  // Find the 'key-image' tag
  const [keyImageTag] = await db
    .select()
    .from(tags)
    .where(and(eq(tags.categoryId, websiteCategory.id), eq(tags.name, 'key-image')))
    .limit(1)

  console.log('✅ Found key-image tag:', keyImageTag?.id || 'none')

  // Fetch all assets with the grid-scroller tag
  const taggedAssets = await db
    .select({
      assetId: assetTags.assetId,
      tagId: assetTags.tagId,
    })
    .from(assetTags)
    .where(eq(assetTags.tagId, gridScrollerTag.id))

  console.log(`✅ Found ${taggedAssets.length} tagged asset relationships`)

  if (taggedAssets.length === 0) {
    console.log('❌ No assets tagged with grid-scroller')
    return
  }

  // Fetch full asset details
  const assetIds = taggedAssets.map((ta) => ta.assetId)
  const gridAssets = await db
    .select()
    .from(assets)
    .where(inArray(assets.id, assetIds))

  console.log(`✅ Retrieved ${gridAssets.length} full asset records\n`)

  // Fetch all tags for these assets
  const allAssetTags = await db
    .select({
      assetId: assetTags.assetId,
      tagId: assetTags.tagId,
      tagName: tags.name,
    })
    .from(assetTags)
    .leftJoin(tags, eq(assetTags.tagId, tags.id))
    .where(inArray(assetTags.assetId, assetIds))

  // Group tags by asset
  const assetTagsMap = new Map<string, string[]>()
  allAssetTags.forEach((row) => {
    if (!assetTagsMap.has(row.assetId)) {
      assetTagsMap.set(row.assetId, [])
    }
    if (row.tagName) {
      assetTagsMap.get(row.assetId)!.push(row.tagName)
    }
  })

  // Transform to API response format
  const images = gridAssets.map((asset) => {
    const assetTagNames = assetTagsMap.get(asset.id) || []
    const isKeyImage = assetTagNames.includes('key-image')

    return {
      id: asset.id,
      url: asset.filePath,
      fileName: asset.fileName,
      aspectRatio: 0.75, // Placeholder
      isKeyImage,
      tags: assetTagNames,
    }
  })

  console.log('📊 API Response Preview:\n')
  console.log(`Total images: ${images.length}`)
  console.log(`Key images: ${images.filter((i) => i.isKeyImage).length}`)
  console.log('\nFirst 3 images:')
  images.slice(0, 3).forEach((img, i) => {
    console.log(`  ${i + 1}. ${img.fileName}`)
    console.log(`     URL: ${img.url}`)
    console.log(`     Key: ${img.isKeyImage}`)
    console.log(`     Tags: ${img.tags.join(', ')}`)
  })

  console.log('\n✅ API query is working correctly!')
}

test()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err)
    process.exit(1)
  })
