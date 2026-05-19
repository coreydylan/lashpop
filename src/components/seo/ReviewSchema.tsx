/**
 * Review Schema Component
 *
 * Renders one <script type="application/ld+json"> per review on the page.
 * Used on the homepage (app/page.tsx) only — not in the global layout — so
 * the review corpus is attached to one canonical URL.
 *
 * When a review has team_member_id, the schema's itemReviewed points at the
 * team member's @id (`siteUrl/team/{slug}#person`) so AI search engines
 * (Perplexity, ChatGPT, Claude) can answer "who's the best stylist at LashPop"
 * with grounded citations.
 */

import { getDb } from '@/db'
import { reviews } from '@/db/schema/reviews'
import { teamMembers } from '@/db/schema/team_members'
import { eq, and, isNotNull, gte, or, sql } from 'drizzle-orm'

interface ReviewSchemaProps {
  siteSettings: {
    businessName: string
    siteUrl: string
  }
  /** When true, honor reviews.include_in_schema. Defaults to true. */
  respectSchemaFlag?: boolean
  /** Cap on rows emitted. Default 1000 — sized for the whole corpus. */
  maxReviews?: number
}

interface ReviewData {
  id: string
  reviewerName: string
  reviewText: string
  rating: number
  reviewDate: Date | null
  responseText: string | null
  responseDate: Date | null
  teamMemberId: string | null
  teamMemberName: string | null
}

async function getReviewsForSchema(
  respectSchemaFlag: boolean,
  maxReviews: number,
): Promise<ReviewData[]> {
  try {
    const db = getDb()

    const conditions = [
      isNotNull(reviews.rating),
      gte(reviews.rating, 1),
      eq(reviews.showOnWebsite, true), // never emit hidden reviews
    ]

    if (respectSchemaFlag) {
      conditions.push(
        or(
          eq(reviews.includeInSchema, true),
          isNotNull(reviews.includeInSchema),
        )!,
      )
    }

    return await db
      .select({
        id: reviews.id,
        reviewerName: reviews.reviewerName,
        reviewText: reviews.reviewText,
        rating: reviews.rating,
        reviewDate: reviews.reviewDate,
        responseText: reviews.responseText,
        responseDate: reviews.responseDate,
        teamMemberId: reviews.teamMemberId,
        teamMemberName: teamMembers.name,
      })
      .from(reviews)
      .leftJoin(teamMembers, eq(reviews.teamMemberId, teamMembers.id))
      .where(and(...conditions))
      .orderBy(sql`${reviews.reviewDate} DESC NULLS LAST`)
      .limit(maxReviews)
  } catch {
    return []
  }
}

function teamMemberSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function ReviewSchema({
  siteSettings,
  respectSchemaFlag = true,
  maxReviews = 1000,
}: ReviewSchemaProps) {
  const reviewList = await getReviewsForSchema(respectSchemaFlag, maxReviews)
  if (reviewList.length === 0) return null

  const orgId = `${siteSettings.siteUrl}/#organization`

  const reviewSchemas = reviewList.map(review => {
    // If linked to a team member, point itemReviewed at their canonical @id.
    // Falls back to the organization for venue-level reviews.
    const itemReviewedId = review.teamMemberId && review.teamMemberName
      ? `${siteSettings.siteUrl}/team/${teamMemberSlug(review.teamMemberName)}#person`
      : orgId

    return {
      '@context': 'https://schema.org',
      '@type': 'Review',
      '@id': `${siteSettings.siteUrl}/#review-${review.id}`,
      itemReviewed: { '@id': itemReviewedId },
      author: { '@type': 'Person', name: review.reviewerName },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: review.reviewText,
      ...(review.reviewDate && {
        datePublished: review.reviewDate.toISOString().split('T')[0],
      }),
      ...(review.responseText && {
        comment: {
          '@type': 'Comment',
          author: { '@id': orgId },
          text: review.responseText,
          ...(review.responseDate && {
            datePublished: review.responseDate.toISOString().split('T')[0],
          }),
        },
      }),
    }
  })

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
