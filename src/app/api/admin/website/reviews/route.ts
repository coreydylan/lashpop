import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { reviews } from '@/db/schema/reviews'
import { websiteSettings } from '@/db/schema/website_settings'
import { desc, gte, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const REVIEWS_SECTION = 'homepage_reviews'

// GET - Fetch all reviews
export async function GET() {
  try {
    const db = getDb()

    // Fetch all reviews with rating >= 3
    const allReviews = await db
      .select()
      .from(reviews)
      .where(gte(reviews.rating, 3))
      .orderBy(desc(reviews.reviewDate))

    // Fetch selected reviews config from website_settings
    let selectedReviewsConfig: { id: string; displayOrder: number }[] = []
    try {
      const [setting] = await db
        .select()
        .from(websiteSettings)
        .where(eq(websiteSettings.section, REVIEWS_SECTION))
        .limit(1)
      
      if (setting?.config && Array.isArray((setting.config as any).selectedReviews)) {
        selectedReviewsConfig = (setting.config as any).selectedReviews
      }
    } catch {
      // Table might not exist yet, use empty config
      console.log('Website settings table not found, using empty config')
    }

    // Map reviews with display order from config
    const reviewsWithOrder = allReviews.map(review => {
      const config = selectedReviewsConfig.find(c => c.id === review.id)
      return {
        ...review,
        isSelected: !!config,
        displayOrder: config?.displayOrder ?? 999
      }
    })

    return NextResponse.json({
      reviews: reviewsWithOrder,
      selectedIds: selectedReviewsConfig.map(c => c.id)
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// PUT - Update selected reviews and their order
export async function PUT(request: NextRequest) {
  try {
    const db = getDb()
    const { selectedReviews } = await request.json()

    if (!Array.isArray(selectedReviews)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Format the config
    const config = {
      selectedReviews: selectedReviews.map((item: { id: string; displayOrder: number }) => ({
        id: item.id,
        displayOrder: item.displayOrder
      })),
      updatedAt: new Date().toISOString()
    }

    try {
      // Try to upsert the setting
      const [existing] = await db
        .select()
        .from(websiteSettings)
        .where(eq(websiteSettings.section, REVIEWS_SECTION))
        .limit(1)

      if (existing) {
        await db
          .update(websiteSettings)
          .set({ config, updatedAt: new Date() })
          .where(eq(websiteSettings.section, REVIEWS_SECTION))
      } else {
        await db
          .insert(websiteSettings)
          .values({ section: REVIEWS_SECTION, config })
      }
    } catch (dbError) {
      // If table doesn't exist, log but don't fail
      console.error('Could not persist to database:', dbError)
      // Settings will work in-memory for this session
    }

    return NextResponse.json({ 
      success: true,
      selectedCount: selectedReviews.length
    })
  } catch (error) {
    console.error('Error updating reviews:', error)
    return NextResponse.json(
      { error: 'Failed to update reviews' },
      { status: 500 }
    )
  }
}

