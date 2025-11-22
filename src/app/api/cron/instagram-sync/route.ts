import { NextRequest, NextResponse } from "next/server"
import { db, assets, tags, tagCategories, assetTags } from "@/db"
import { eq, and } from "drizzle-orm"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { nanoid } from "nanoid"

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "lashpop-dam-assets"
const BUCKET_URL = process.env.NEXT_PUBLIC_S3_BUCKET_URL || `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`

async function uploadImageToS3(imageUrl: string, id: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`)
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const key = `instagram/${id}-${nanoid()}.jpg`
    
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg",
      CacheControl: "max-age=31536000, public",
    }))
    
    return `${BUCKET_URL}/${key}`
  } catch (error) {
    console.error(`Error uploading image for post ${id}:`, error)
    return null
  }
}

async function ensureTag(categoryName: string, tagName: string, isCollection = false) {
  // 1. Ensure Category
  let category = await db.query.tagCategories.findFirst({
    where: eq(tagCategories.name, categoryName)
  })

  if (!category) {
    const [newCategory] = await db.insert(tagCategories).values({
      name: categoryName,
      displayName: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
      isCollection
    }).returning()
    category = newCategory
  }

  // 2. Ensure Tag
  let tag = await db.query.tags.findFirst({
    where: and(
      eq(tags.name, tagName),
      eq(tags.categoryId, category!.id)
    )
  })

  if (!tag) {
    const [newTag] = await db.insert(tags).values({
      categoryId: category!.id,
      name: tagName,
      displayName: tagName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    }).returning()
    tag = newTag
  }

  return tag
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Optional: Protect endpoint. 
    }

    const apifyToken = process.env.APIFY_API_TOKEN
    if (!apifyToken) {
      return NextResponse.json({ error: "APIFY_API_TOKEN not configured" }, { status: 500 })
    }

    // Ensure Tags exist
    const collectionTag = await ensureTag("collections", "instagram", true)
    const websiteTag = await ensureTag("website", "ig_carousel", false)

    // 1. Call Apify to get latest posts
    const response = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-post-scraper/run-sync-get-dataset-items?token=${apifyToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: ["lashpopstudios"],
          resultsLimit: 12,
          onlyPostsNewerThan: "1 day",
          skipPinnedPosts: false,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Apify error:", errorText)
      return NextResponse.json({ error: "Failed to fetch from Apify", details: errorText }, { status: 500 })
    }

    const posts = await response.json()
    
    if (!Array.isArray(posts)) {
      return NextResponse.json({ error: "Invalid response format from Apify" }, { status: 500 })
    }

    const results = {
      processed: 0,
      added: 0,
      skipped: 0,
      errors: 0
    }

    // 2. Process each post
    for (const post of posts) {
      results.processed++
      
      try {
        // Check if exists in Assets
        const existing = await db.query.assets.findFirst({
          where: eq(assets.externalId, post.id)
        })

        if (existing) {
          results.skipped++
          continue
        }

        // Upload image to S3
        const s3Url = await uploadImageToS3(post.displayUrl, post.id)
        
        if (!s3Url) {
          results.errors++
          continue
        }

        // Insert into DB (Assets)
        const [newAsset] = await db.insert(assets).values({
          fileName: `instagram-${post.id}.jpg`,
          filePath: s3Url,
          fileType: 'image',
          mimeType: 'image/jpeg',
          fileSize: 0, // We don't know this from Apify easily, can skip or fetch HEAD
          externalId: post.id,
          source: 'instagram',
          caption: post.caption,
          sourceMetadata: {
            permalink: post.url,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            mediaType: post.type
          }
        }).returning()

        // Link Tags
        await db.insert(assetTags).values([
          { assetId: newAsset.id, tagId: collectionTag.id },
          { assetId: newAsset.id, tagId: websiteTag.id }
        ])

        results.added++
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error)
        results.errors++
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
