import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getDb } from '@/db'
import { reviews } from '@/db/schema/reviews'
import { homepageReviews } from '@/db/schema/website_settings'
import { desc, gte, asc, inArray, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// GET - Fetch all reviews and selected IDs
export async function GET() {
  try {
    const db = getDb()
    // Fetch all reviews ≥3★. Order by quality_score (admin overrides + LLM
    // editor) then recency, so the highest-signal stuff floats to the top
    // of the admin list.
    const allReviews = await db
      .select()
      .from(reviews)
      .where(gte(reviews.rating, 3))
      .orderBy(desc(reviews.qualityScore), desc(reviews.reviewDate))

    // Fetch admin-pinned reviews from homepage_reviews (we ignore the
    // auto-promoted rows here so the admin UI shows their own curation only).
    const selectedReviewsData = await db
      .select()
      .from(homepageReviews)
      .where(eq(homepageReviews.isPinned, true))
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
    const db = getDb()
    const body = await request.json()
    console.log('[Reviews API] PUT request body:', body)

    const { selectedReviews } = body

    if (!Array.isArray(selectedReviews)) {
      console.error('[Reviews API] Invalid body - selectedReviews is not an array')
      return NextResponse.json(
        { error: 'Invalid request body - selectedReviews must be an array' },
        { status: 400 }
      )
    }

    console.log(`[Reviews API] Saving ${selectedReviews.length} reviews`)

    // Diff old admin-pinned selection vs new. Only touch is_pinned=true rows;
    // auto-promoted rows (is_pinned=false) are managed by the Worker cron and
    // we leave them alone here.
    const previous = await db
      .select({ reviewId: homepageReviews.reviewId })
      .from(homepageReviews)
      .where(eq(homepageReviews.isPinned, true))
    const previousIds = new Set(previous.map(r => r.reviewId))
    const newIds = new Set(selectedReviews.map((item: { id: string }) => item.id))

    const removedIds = Array.from(previousIds).filter(id => !newIds.has(id))
    const addedIds = Array.from(newIds).filter(id => !previousIds.has(id))

    // Clear existing pinned selections (preserve auto-promoted rows)
    await db.delete(homepageReviews).where(eq(homepageReviews.isPinned, true))
    console.log('[Reviews API] Cleared existing pinned selections')

    // Insert new pins
    if (selectedReviews.length > 0) {
      const insertData = selectedReviews.map((item: { id: string; displayOrder: number }) => ({
        reviewId: item.id,
        displayOrder: item.displayOrder,
        isPinned: true,
      }))

      await db.insert(homepageReviews).values(insertData)
      console.log('[Reviews API] Inserted new pinned selections')
    }

    // Update homepageDismissed flags so cron auto-promote respects admin intent.
    if (removedIds.length > 0) {
      await db
        .update(reviews)
        .set({ homepageDismissed: true, updatedAt: new Date() })
        .where(inArray(reviews.id, removedIds))
      console.log(`[Reviews API] Marked ${removedIds.length} reviews as dismissed`)
    }
    if (addedIds.length > 0) {
      await db
        .update(reviews)
        .set({ homepageDismissed: false, updatedAt: new Date() })
        .where(inArray(reviews.id, addedIds))
      console.log(`[Reviews API] Cleared dismissed flag on ${addedIds.length} reviews`)
    }

    // Revalidate the homepage so it fetches fresh reviews
    revalidatePath('/')
    console.log('[Reviews API] Revalidated homepage cache')

    return NextResponse.json({ 
      success: true,
      selectedCount: selectedReviews.length
    })
  } catch (error) {
    console.error('[Reviews API] Error updating reviews:', error)
    return NextResponse.json(
      { error: 'Failed to update reviews', details: String(error) },
      { status: 500 }
    )
  }
}
