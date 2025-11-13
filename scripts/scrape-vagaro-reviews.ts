/**
 * Scrape Vagaro reviews (via read-only proxy) and import them into the reviews + testimonials tables.
 *
 * The Vagaro reviews page is protected by Imperva, so we fetch the public content via
 * https://r.jina.ai which mirrors the rendered page as Markdown. The parser extracts
 * reviewer name, optional review date, optional provider/venue target, and review text,
 * then saves them into the testimonials table (deduping by reviewer + text).
 *
 * Usage:
 *   npx tsx scripts/scrape-vagaro-reviews.ts
 */

import { config } from 'dotenv'
import { getDb } from '../src/db'
import { teamMembers } from '../src/db/schema/team_members'
import { NormalizedReview, syncReviews } from '../src/lib/reviews-sync'

config({ path: '.env.local' })

const DEFAULT_SOURCE_URL = 'https://r.jina.ai/https://www.vagaro.com/lashpop32/reviews'

type ParsedReview = Omit<NormalizedReview, 'source' | 'sourceUrl' | 'rating'>

async function fetchReviewMarkdown(sourceUrl: string) {
  const response = await fetch(sourceUrl, {
    headers: {
      'User-Agent': 'lashpop-reviews-scraper/1.0 (+https://www.vagaro.com/lashpop32)'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch reviews (${response.status})`)
  }

  return response.text()
}

function extractContentBody(markdown: string) {
  const marker = 'Markdown Content:'
  const index = markdown.indexOf(marker)
  if (index === -1) {
    return markdown
  }
  return markdown.slice(index + marker.length).trim()
}

function splitParagraphs(content: string) {
  return content
    .split(/\n\s*\n/g)
    .map(block => block.trim())
    .filter(Boolean)
}

function looksLikeName(segment: string) {
  if (!segment) return false
  const cleaned = segment.replace(/[^A-Za-z0-9 .,'’\-]/g, '').trim()
  if (!cleaned) return false
  const words = cleaned.split(/\s+/)
  if (words.length === 1 && words[0].length <= 1) return false
  if (words.length > 4) return false
  if (segment.length > 40) return false
  if (/[.!?]/.test(segment)) return false
  return true
}

function normalizeName(value: string) {
  return value
    .split(/\s+/)
    .map(part => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part))
    .join(' ')
    .trim()
}

function isDateSegment(segment: string) {
  return /^[A-Za-z]{3} \d{2}, \d{4}$/.test(segment.trim())
}

function parseDate(segment: string) {
  if (!segment) return null
  const parsed = new Date(segment)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function appendResponse(previous: ParsedReview[], responseDate: Date | null, responseText: string) {
  if (!previous.length) return
  const lastReview = previous[previous.length - 1]
  lastReview.responseDate = responseDate
  lastReview.responseText = responseText.trim()
}

function parseReviews(markdown: string, providerNames: Set<string>): ParsedReview[] {
  const body = extractContentBody(markdown)
  const paragraphs = splitParagraphs(body)
  const reviews: ParsedReview[] = []
  const providerLookup = new Set(Array.from(providerNames).map(normalizeName))

  let i = 0
  while (i < paragraphs.length) {
    const current = paragraphs[i]

    if (!current) {
      i++
      continue
    }

    if (current === 'Response From Business') {
      i++
      const possibleDate = paragraphs[i]
      let responseDate: Date | null = null
      if (possibleDate && isDateSegment(possibleDate)) {
        responseDate = parseDate(possibleDate)
        i++
      }
      const responseText = paragraphs[i] || ''
      if (responseText) {
        appendResponse(reviews, responseDate, responseText)
        i++
      }
      continue
    }

    if (!looksLikeName(current)) {
      i++
      continue
    }

    const reviewerName = normalizeName(current)
    i++

    let reviewDate: Date | null = null
    if (i < paragraphs.length && isDateSegment(paragraphs[i])) {
      reviewDate = parseDate(paragraphs[i])
      i++
    }

    let createdEntry = false

    const consumeReview = (subject: string | null, textSegment: string | undefined) => {
      if (!textSegment) return
      reviews.push({
        reviewerName,
        reviewDate,
        subject,
        reviewText: textSegment.trim()
      })
      createdEntry = true
      i++
    }

    while (i < paragraphs.length) {
      const segment = paragraphs[i]
      if (!segment) {
        i++
        continue
      }
      if (segment === 'Response From Business') {
        break
      }
      const normalizedSegment = normalizeName(segment)
      const isProvider = providerLookup.has(normalizedSegment)
      const nextParagraph = paragraphs[i + 1]

      if (isProvider) {
        i++
        consumeReview(normalizedSegment, nextParagraph)
        continue
      }

      if (createdEntry || looksLikeName(segment)) {
        break
      }

      consumeReview(null, segment)
      break
    }

    if (!createdEntry) {
      // Avoid infinite loop if nothing was consumed for this reviewer
      continue
    }

    // Additional provider-specific notes for the same reviewer
    while (i < paragraphs.length) {
      const segment = paragraphs[i]
      if (!segment) {
        i++
        continue
      }
      const normalizedSegment = normalizeName(segment)
      if (!providerLookup.has(normalizedSegment)) {
        break
      }
      const textSegment = paragraphs[i + 1]
      i++
      consumeReview(normalizedSegment, textSegment)
    }
  }

  return reviews
}

async function scrapeVagaroReviews() {
  try {
    const sourceUrl = process.env.VAGARO_REVIEWS_SOURCE || DEFAULT_SOURCE_URL
    console.log(`Fetching reviews from ${sourceUrl} ...`)
    const markdown = await fetchReviewMarkdown(sourceUrl)

    const db = getDb()
    const providers = await db.select({ name: teamMembers.name }).from(teamMembers)
    const providerNames = new Set<string>(['Venue'])
    providers.forEach(provider => {
      if (provider.name) {
        providerNames.add(provider.name)
      }
    })

    const parsed = parseReviews(markdown, providerNames).map(review => ({
      ...review,
      source: 'vagaro',
      sourceUrl,
      rating: 5
    }))
    console.log(`Parsed ${parsed.length} review entries.`)

    await syncReviews(parsed)
    console.log('Done!')
    process.exit(0)
  } catch (error) {
    console.error('Failed to scrape Vagaro reviews:', error)
    process.exit(1)
  }
}

scrapeVagaroReviews()
