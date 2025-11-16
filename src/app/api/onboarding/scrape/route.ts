/**
 * POST /api/onboarding/scrape
 *
 * Scrapes a connected account for images and content
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db, onboardingConnectedAccounts, onboardingImportedAssets } from '@/db'
import { eq } from 'drizzle-orm'
import { scrapeWebsite, scrapeInstagram } from '@/lib/ai/content-scraper'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { nanoid } from 'nanoid'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
})

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { accountId } = body

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    // Get connected account
    const [account] = await db
      .select()
      .from(onboardingConnectedAccounts)
      .where(eq(onboardingConnectedAccounts.id, accountId))
      .limit(1)

    if (!account || account.userId !== session.user.id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Update scraping status
    await db
      .update(onboardingConnectedAccounts)
      .set({
        scrapingStatus: 'in_progress',
        updatedAt: new Date()
      })
      .where(eq(onboardingConnectedAccounts.id, accountId))

    try {
      let scrapedContent

      // Scrape based on account type
      if (account.accountType === 'instagram') {
        scrapedContent = await scrapeInstagram(account.accountIdentifier)
      } else if (account.accountType === 'website') {
        scrapedContent = await scrapeWebsite(account.profileUrl || account.accountIdentifier)
      } else {
        throw new Error(`Unsupported account type: ${account.accountType}`)
      }

      // Import images to S3
      const importedAssets = []
      const maxImages = 20 // Limit to 20 images

      for (const image of scrapedContent.images.slice(0, maxImages)) {
        try {
          // Download image
          const imageResponse = await fetch(image.url)
          if (!imageResponse.ok) continue

          const imageBuffer = await imageResponse.arrayBuffer()
          const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

          // Generate S3 key
          const fileExtension = contentType.split('/')[1] || 'jpg'
          const s3Key = `onboarding/${session.user.id}/${nanoid()}.${fileExtension}`

          // Upload to S3
          await s3Client.send(
            new PutObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET || '',
              Key: s3Key,
              Body: Buffer.from(imageBuffer),
              ContentType: contentType
            })
          )

          const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`

          // Create imported asset record
          const [asset] = await db
            .insert(onboardingImportedAssets)
            .values({
              userId: session.user.id,
              sourceAccountId: accountId,
              sourceType: account.accountType,
              sourceUrl: image.url,
              sourceCaption: image.alt,
              s3Key,
              s3Url,
              fileName: `${nanoid()}.${fileExtension}`,
              mimeType: contentType,
              width: image.width,
              height: image.height,
              importStatus: 'completed'
            })
            .returning()

          importedAssets.push(asset)
        } catch (error) {
          console.error('Error importing image:', error)
          // Continue with next image
        }
      }

      // Update account with scraped data
      await db
        .update(onboardingConnectedAccounts)
        .set({
          scrapingStatus: 'completed',
          lastScrapedAt: new Date(),
          extractedData: {
            imageCount: scrapedContent.images.length,
            hasLogo: !!scrapedContent.logoUrl,
            metadata: scrapedContent.metadata
          },
          avatarUrl: scrapedContent.logoUrl,
          updatedAt: new Date()
        })
        .where(eq(onboardingConnectedAccounts.id, accountId))

      return NextResponse.json({
        success: true,
        account,
        importedAssets,
        scrapedContent: {
          totalImages: scrapedContent.images.length,
          importedImages: importedAssets.length,
          logoUrl: scrapedContent.logoUrl,
          title: scrapedContent.title,
          description: scrapedContent.description
        }
      })
    } catch (error) {
      // Update scraping status to failed
      await db
        .update(onboardingConnectedAccounts)
        .set({
          scrapingStatus: 'failed',
          scrapingError: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date()
        })
        .where(eq(onboardingConnectedAccounts.id, accountId))

      throw error
    }
  } catch (error) {
    console.error('Scrape error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to scrape account' },
      { status: 500 }
    )
  }
}
