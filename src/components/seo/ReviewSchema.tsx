/**
 * Review Schema Component
 *
 * Renders the reviews that are visibly present on the homepage as one JSON-LD
 * graph. Keeping the markup aligned with visible content is both faster and
 * consistent with search-engine structured-data guidelines.
 *
 * When a review has team_member_id, the schema's itemReviewed points at the
 * team member's @id (`siteUrl/team/{slug}#person`) so AI search engines
 * (Perplexity, ChatGPT, Claude) can answer "who's the best stylist at LashPop"
 * with grounded citations.
 */

import { serializeJsonLd } from '@/lib/serialize-json-ld'

interface ReviewSchemaProps {
  siteSettings: {
    businessName: string
    siteUrl: string
  }
  reviews: ReviewData[]
  /** Cap on visible rows emitted. */
  maxReviews?: number
}

interface ReviewData {
  id: string
  reviewerName: string
  reviewText: string
  rating: number
  reviewDate: Date | null
  responseText?: string | null
  responseDate?: Date | null
  teamMemberId?: string | null
  stylistName?: string | null
  includeInSchema?: boolean | null
}

function teamMemberSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function ReviewSchema({
  siteSettings,
  reviews,
  maxReviews = 15,
}: ReviewSchemaProps) {
  const reviewList = reviews
    .filter(review => review.rating >= 1 && review.includeInSchema !== false)
    .slice(0, maxReviews)
  if (reviewList.length === 0) return null

  const orgId = `${siteSettings.siteUrl}/#organization`

  const reviewSchemas = reviewList.map(review => {
    // If linked to a team member, point itemReviewed at their canonical @id.
    // Falls back to the organization for venue-level reviews.
    const itemReviewedId = review.teamMemberId && review.stylistName
      ? `${siteSettings.siteUrl}/team/${teamMemberSlug(review.stylistName)}#person`
      : orgId

    return {
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

  const graph = {
    '@context': 'https://schema.org',
    '@graph': reviewSchemas,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }}
    />
  )
}

export default ReviewSchema
