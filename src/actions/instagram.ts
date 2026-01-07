'use server'

import { getDb, assets, assetTags, tags, websiteSettings } from "@/db"
import { desc, eq } from "drizzle-orm"

/**
 * Get Instagram carousel settings from admin panel
 */
async function getInstagramSettings(): Promise<{
  maxPosts: number
  autoScroll: boolean
  scrollSpeed: number
  showCaptions: boolean
}> {
  const defaults = {
    maxPosts: 12,
    autoScroll: true,
    scrollSpeed: 20,
    showCaptions: false
  }

  try {
    const db = getDb()
    const [setting] = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, 'instagram_carousel'))
      .limit(1)
    
    if (setting?.config) {
      return {
        ...defaults,
        ...(setting.config as any)
      }
    }
  } catch {
    // Table might not exist yet
  }

  return defaults
}

export async function getInstagramPosts(limit?: number) {
  try {
    const db = getDb()
    // Get settings from admin panel
    const settings = await getInstagramSettings()
    const effectiveLimit = limit ?? settings.maxPosts

    // 1. Find the "IG Carousel" tag ID
    // We don't use 'with' relations here to avoid schema configuration issues
    const carouselTag = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.name, "ig_carousel"))
      .limit(1)
      .then(rows => rows[0])

    if (!carouselTag) {
      console.warn("IG Carousel tag not found in database")
      return []
    }

    // 2. Fetch assets with this tag
    const posts = await db
      .select({
        id: assets.externalId,
        mediaUrl: assets.filePath,
        permalink: assets.sourceMetadata,
        caption: assets.caption,
        timestamp: assets.uploadedAt,
      })
      .from(assets)
      .innerJoin(assetTags, eq(assets.id, assetTags.assetId))
      .where(eq(assetTags.tagId, carouselTag.id))
      .orderBy(desc(assets.uploadedAt))
      .limit(effectiveLimit)

    // 3. Map to expected format
    return posts.map(post => ({
      id: post.id || '',
      mediaUrl: post.mediaUrl,
      permalink: (post.permalink as any)?.permalink || '',
      caption: post.caption,
    }))

  } catch (error) {
    console.error("Error fetching Instagram posts:", error)
    return []
  }
}

export { getInstagramSettings }
