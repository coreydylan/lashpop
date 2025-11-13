import { sql } from "drizzle-orm"

import { getDb } from "../db"
import { reviews } from "../db/schema/reviews"
import { testimonials } from "../db/schema/testimonials"

export type NormalizedReview = {
  reviewerName: string
  reviewText: string
  reviewDate: Date | null
  subject?: string | null
  responseText?: string | null
  responseDate?: Date | null
  rating?: number | null
  source: string
  sourceUrl: string
}

export function buildReviewText(entry: Pick<NormalizedReview, "subject" | "reviewText" | "responseText" | "responseDate">) {
  const parts = []
  if (entry.subject && entry.subject !== "Venue") {
    parts.push(`Service provider: ${entry.subject}`)
  }
  parts.push(entry.reviewText)
  if (entry.responseText) {
    const responseDate = entry.responseDate
      ? entry.responseDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : null
    const responseLabel = responseDate ? `Response (${responseDate})` : "Response"
    parts.push(`${responseLabel}: ${entry.responseText}`)
  }
  return parts.filter(Boolean).join("\n\n")
}

export function reviewKey(entry: Pick<NormalizedReview, "reviewerName" | "reviewText">) {
  return `${entry.reviewerName.toLowerCase()}|${entry.reviewText.toLowerCase()}`
}

export function rawReviewKey(entry: Pick<NormalizedReview, "source" | "reviewerName" | "reviewText">) {
  return `${entry.source.toLowerCase()}|${reviewKey(entry)}`
}

export async function saveRawReviews(rawReviews: NormalizedReview[], db = getDb()) {
  if (!rawReviews.length) {
    return 0
  }

  const existing = await db.select({
    source: reviews.source,
    reviewerName: reviews.reviewerName,
    reviewText: reviews.reviewText
  }).from(reviews)

  const existingKeys = new Set(existing.map(row =>
    `${row.source.toLowerCase()}|${row.reviewerName.toLowerCase()}|${row.reviewText.toLowerCase()}`
  ))

  const newReviews = rawReviews.filter(review => !existingKeys.has(rawReviewKey(review)))

  if (!newReviews.length) {
    console.log("No new reviews to insert (raw table up to date).")
    return 0
  }

  await db.insert(reviews).values(
    newReviews.map(review => ({
      source: review.source,
      sourceUrl: review.sourceUrl,
      reviewerName: review.reviewerName,
      subject: review.subject || null,
      reviewText: review.reviewText,
      rating: review.rating ?? 5,
      reviewDate: review.reviewDate,
      responseText: review.responseText || null,
      responseDate: review.responseDate || null,
      rawPayload: null
    }))
  )

  const count = newReviews.length
  console.log(`Inserted ${count} new raw review${count === 1 ? "" : "s"}.`)
  return count
}

export async function saveTestimonials(rawReviews: NormalizedReview[], db = getDb()) {
  if (!rawReviews.length) {
    console.log("No reviews detected for testimonials sync.")
    return 0
  }

  const existing = await db.select({
    clientName: testimonials.clientName,
    reviewText: testimonials.reviewText
  }).from(testimonials)

  const existingKeys = new Set(existing.map(row => `${row.clientName.toLowerCase()}|${row.reviewText.toLowerCase()}`))

  const newReviews = rawReviews.filter(review => !existingKeys.has(reviewKey(review)))

  if (!newReviews.length) {
    console.log("All reviews already imported. No new records to insert.")
    return 0
  }

  const [{ maxDisplayOrder }] = await db.select({
    maxDisplayOrder: sql<number>`coalesce(max(${testimonials.displayOrder}), 0)`
  }).from(testimonials)

  let displayOrder = maxDisplayOrder ?? 0
  const now = new Date()

  await db.insert(testimonials).values(
    newReviews.map(review => {
      displayOrder += 1
      return {
        clientName: review.reviewerName,
        reviewText: buildReviewText(review),
        serviceId: null,
        rating: review.rating ?? 5,
        clientImage: null,
        isFeatured: false,
        isApproved: true,
        displayOrder,
        createdAt: review.reviewDate ?? now,
        updatedAt: now
      }
    })
  )

  const count = newReviews.length
  console.log(`Inserted ${count} new testimonial${count === 1 ? "" : "s"}.`)
  return count
}

export async function syncReviews(rawReviews: NormalizedReview[], options?: { skipTestimonials?: boolean }) {
  const db = getDb()
  const insertedRaw = await saveRawReviews(rawReviews, db)
  let insertedTestimonials = 0
  if (!options?.skipTestimonials) {
    insertedTestimonials = await saveTestimonials(rawReviews, db)
  }
  return { insertedRaw, insertedTestimonials }
}
