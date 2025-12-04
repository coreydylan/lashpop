'use client'

import React from 'react'

interface Review {
  reviewerName: string
  reviewText: string
  rating: number
  reviewDate: Date | null
  source: string
}

interface ReviewSchemaProps {
  reviews: Review[]
}

export default function ReviewSchema({ reviews }: ReviewSchemaProps) {
  // Take first 10 reviews
  const reviewsToShow = reviews.slice(0, 10)

  // Generate review schema objects
  const reviewSchemas = reviewsToShow.map((review) => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.reviewerName,
    },
    reviewBody: review.reviewText,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating.toString(),
      bestRating: '5',
      worstRating: '1',
    },
    datePublished: review.reviewDate ? review.reviewDate.toISOString() : undefined,
    publisher: {
      '@type': 'Organization',
      name: review.source,
    },
    itemReviewed: {
      '@type': 'LocalBusiness',
      name: 'LashPop Studios',
      '@id': 'https://lashpopstudios.com/#business',
    },
  }))

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(reviewSchemas),
      }}
    />
  )
}
