/**
 * Review Schema Component
 *
 * Generates JSON-LD structured data for individual reviews.
 * Uses the includeInSchema flag to include reviews in structured data
 * even if they're not displayed publicly on the website.
 *
 * This is legitimate SEO - providing accurate review data to search engines
 * for rich results, regardless of what's shown on the public website.
 */

import { getDb } from '@/db'
import { reviews } from '@/db/schema/reviews'
import { eq, and, isNotNull, gte, or } from 'drizzle-orm'

interface ReviewSchemaProps {
  siteSettings: {
    businessName: string
    siteUrl: string
  }
  /**
   * If true, only include reviews marked with includeInSchema=true
   * If false, include all reviews with ratings
   */
  respectSchemaFlag?: boolean
  /**
   * Maximum number of reviews to include in schema
   * Default: 50 (to avoid bloating the page)
   */
  maxReviews?: number
}

interface ReviewData {
  id: string
  reviewerName: string
  reviewText: string
  rating: number
  reviewDate: Date | null
  responseText: string | null
}

async function getReviewsForSchema(
  respectSchemaFlag: boolean,
  maxReviews: number
): Promise<ReviewData[]> {
  try {
    const db = getDb()

    // Build the query conditions
    const conditions = [
      isNotNull(reviews.rating),
      gte(reviews.rating, 1)
    ]

    // If respecting the schema flag, only include reviews marked for schema
    if (respectSchemaFlag) {
      conditions.push(
        or(
          eq(reviews.includeInSchema, true),
          // Also include null (for backwards compatibility before the column existed)
          isNotNull(reviews.includeInSchema)
        )!
      )
    }

    const reviewList = await db
      .select({
        id: reviews.id,
        reviewerName: reviews.reviewerName,
        reviewText: reviews.reviewText,
        rating: reviews.rating,
        reviewDate: reviews.reviewDate,
        responseText: reviews.responseText
      })
      .from(reviews)
      .where(and(...conditions))
      .limit(maxReviews)

    return reviewList
  } catch {
    return []
  }
}

export async function ReviewSchema({
  siteSettings,
  respectSchemaFlag = true,
  maxReviews = 50
}: ReviewSchemaProps) {
  const reviewList = await getReviewsForSchema(respectSchemaFlag, maxReviews)

  if (reviewList.length === 0) {
    return null
  }

  // Create individual Review schemas
  const reviewSchemas = reviewList.map(review => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    '@id': `${siteSettings.siteUrl}/#review-${review.id}`,
    itemReviewed: {
      '@type': 'LocalBusiness',
      '@id': `${siteSettings.siteUrl}/#organization`,
      name: siteSettings.businessName
    },
    author: {
      '@type': 'Person',
      name: review.reviewerName
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1
    },
    reviewBody: review.reviewText,
    ...(review.reviewDate && {
      datePublished: review.reviewDate.toISOString().split('T')[0]
    }),
    // Include business response if available
    ...(review.responseText && {
      comment: {
        '@type': 'Comment',
        author: {
          '@type': 'LocalBusiness',
          name: siteSettings.businessName
        },
        text: review.responseText
      }
    })
  }))

  return (
    <>
      {reviewSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}

export default ReviewSchema
