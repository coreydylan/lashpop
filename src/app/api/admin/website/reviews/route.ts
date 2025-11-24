import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { reviews } from '@/db/schema/reviews'
import { homepageReviews } from '@/db/schema/website_settings'
import { desc, gte, eq, asc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// GET - Fetch all reviews and selected IDs
export async function GET() {
  try {
    // Fetch all reviews with rating >= 3
    const allReviews = await db
      .select()
      .from(reviews)
      .where(gte(reviews.rating, 3))
      .orderBy(desc(reviews.reviewDate))

    // Fetch selected reviews from homepage_reviews table
    const selectedReviewsData = await db
      .select()
      .from(homepageReviews)
      .orderBy(asc(homepageReviews.displayOrder))

    // Create a map of selected review IDs to their display order
    const selectedMap = new Map(
      selectedReviewsData.map(r => [r.reviewId, r.displayOrder])
    )

    // Map reviews with selection status and display order
    const reviewsWithOrder = allReviews.map(review => ({
      ...review,
      isSelected: selectedMap.has(review.id),
      displayOrder: selectedMap.get(review.id) ?? 999
    }))

    return NextResponse.json({
      reviews: reviewsWithOrder,
      selectedIds: selectedReviewsData.map(r => r.reviewId)
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews', details: String(error) },
      { status: 500 }
    )
  }
}

// PUT - Update selected reviews and their order
export async function PUT(request: NextRequest) {
  try {
    const { selectedReviews } = await request.json()

    if (!Array.isArray(selectedReviews)) {
      return NextResponse.json(
        { error: 'Invalid request body - selectedReviews must be an array' },
        { status: 400 }
      )
    }

    // Clear existing selections and insert new ones
    await db.delete(homepageReviews)

    // Insert new selections
    if (selectedReviews.length > 0) {
      const insertData = selectedReviews.map((item: { id: string; displayOrder: number }) => ({
        reviewId: item.id,
        displayOrder: item.displayOrder
      }))

      await db.insert(homepageReviews).values(insertData)
    }

    return NextResponse.json({ 
      success: true,
      selectedCount: selectedReviews.length
    })
  } catch (error) {
    console.error('Error updating reviews:', error)
    return NextResponse.json(
      { error: 'Failed to update reviews', details: String(error) },
      { status: 500 }
    )
  }
}
