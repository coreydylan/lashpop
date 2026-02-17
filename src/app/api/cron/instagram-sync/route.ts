import { NextRequest, NextResponse } from "next/server"
import { getDb, assets, tags, tagCategories, assetTags } from "@/db"
import { eq, and } from "drizzle-orm"
import { nanoid } from "nanoid"
import { uploadBufferWithOptions } from "@/lib/dam/r2-client"

async function uploadImageToStorage(imageUrl: string, id: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) return null

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const key = `instagram/${id}_${Date.now()}.jpg`

    const result = await uploadBufferWithOptions({
      buffer,
      key,
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000',
    })

    return result.url
  } catch (error) {
    console.error('Error uploading to R2:', error)
    return null
  }
}

async function ensureTag(categoryName: string, tagName: string, isCollection = false) {
  const db = getDb()
  // 1. Ensure Category - use select instead of query
  let [category] = await db
    .select()
    .from(tagCategories)
    .where(eq(tagCategories.name, categoryName))
    .limit(1)

  if (!category) {
    const [newCategory] = await db.insert(tagCategories).values({
      name: categoryName,
      displayName: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
      isCollection
    }).returning()
    category = newCategory
  }

  // 2. Ensure Tag - use select instead of query
  let [tag] = await db
    .select()
    .from(tags)
    .where(and(
      eq(tags.name, tagName),
      eq(tags.categoryId, category!.id)
    ))
    .limit(1)

  if (!tag) {
    const [newTag] = await db.insert(tags).values({
      categoryId: category!.id,
      name: tagName,
      displayName: tagName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    }).returning()
    tag = newTag
  }

  return tag!
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb()
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch Instagram feed
    const INSTAGRAM_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN
    if (!INSTAGRAM_TOKEN) {
      throw new Error("Instagram access token not configured")
    }

    const instagramResponse = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink&access_token=${INSTAGRAM_TOKEN}`
    )

    if (!instagramResponse.ok) {
      throw new Error(`Instagram API error: ${instagramResponse.statusText}`)
    }

    const instagramData = await instagramResponse.json()

    // Ensure Instagram collection tag exists
    const instagramTag = await ensureTag('collection', 'instagram', true)

    const results = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: [] as string[]
    }

    for (const post of instagramData.data) {
      try {
        // Only process images and videos
        if (post.media_type !== 'IMAGE' && post.media_type !== 'VIDEO') {
          results.skipped++
          continue
        }

        const mediaUrl = post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url
        if (!mediaUrl) {
          results.skipped++
          continue
        }

        // Check if already exists
        const [existing] = await db
          .select()
          .from(assets)
          .where(eq(assets.externalId, post.id))
          .limit(1)

        if (existing) {
          results.skipped++
          continue
        }

        // Upload to R2
        const r2Url = await uploadImageToStorage(mediaUrl, post.id)
        if (!r2Url) {
          results.errors.push(`Failed to upload ${post.id}`)
          continue
        }

        // Create asset
        const [newAsset] = await db.insert(assets).values({
          id: nanoid(),
          fileName: `${post.id}.jpg`,
          filePath: r2Url,
          fileType: 'image',
          mimeType: 'image/jpeg',
          fileSize: 0, // We don't have the exact size from Instagram API
          width: null,
          height: null,
          externalId: post.id,
          source: 'instagram',
          sourceMetadata: {
            caption: post.caption,
            permalink: post.permalink,
            mediaType: post.media_type,
            syncedAt: new Date().toISOString()
          },
          uploadedAt: new Date(),
        }).returning()

        // Add Instagram collection tag
        await db.insert(assetTags).values({
          assetId: newAsset.id,
          tagId: instagramTag.id,
        })

        results.created++
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error)
        results.errors.push(`Error processing ${post.id}: ${error}`)
      }

      results.processed++
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Instagram sync error:', error)
    return NextResponse.json(
      { error: `Sync failed: ${error}` },
      { status: 500 }
    )
  }
}