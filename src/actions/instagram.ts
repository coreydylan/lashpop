'use server'

import { db, assets, assetTags, tags, tagCategories } from "@/db"
import { desc, eq, and } from "drizzle-orm"

export async function getInstagramPosts(limit = 20) {
  try {
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
      .limit(limit)

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
