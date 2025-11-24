import { getDb } from '@/db'
import { teamMembers } from '@/db/schema/team_members'
import { NormalizedReview, syncReviews } from '../reviews-sync'

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

// Common UI/navigation text that should never be treated as reviewer names
const JUNK_PATTERNS = [
  /^cancel$/i,
  /^submit$/i,
  /^continue$/i,
  /^back$/i,
  /select location/i,
  /type of service/i,
  /for businesses/i,
  /for customers/i,
  /find businesses/i,
  /business software/i,
  /business features/i,
  /business products/i,
  /^company$/i,
  /^resources$/i,
  /united states?/i,
  /australia/i,
  /canada/i,
  /united kingdom/i,
  /javascript:/i,
  /^\[.*\]$/,  // Markdown links like [Back]
  /^#+\s/,    // Markdown headers
  /^\*\s/,    // Markdown list items
  /^-\s*\[/,  // Markdown checkbox items
]

function isJunkText(text: string): boolean {
  const trimmed = text.trim()
  return JUNK_PATTERNS.some(pattern => pattern.test(trimmed))
}

function looksLikeName(segment: string) {
  if (!segment) return false
  // Reject junk UI text immediately
  if (isJunkText(segment)) return false
  const cleaned = segment.replace(/[^A-Za-z0-9 .,''\-]/g, '').trim()
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
      const trimmedText = textSegment.trim()
      // Skip empty or junk review text (contains javascript links, markdown navigation, etc.)
      if (!trimmedText || isJunkText(trimmedText) || trimmedText.includes('javascript:')) return
      // Minimum review length - real reviews are at least a few words
      if (trimmedText.length < 10) return
      reviews.push({
        reviewerName,
        reviewDate,
        subject,
        reviewText: trimmedText
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
      continue
    }

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

export async function syncVagaroReviews() {
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
  const result = await syncReviews(parsed)

  return {
    source: 'vagaro',
    parsed: parsed.length,
    inserted: result.insertedRaw,
    testimonials: result.insertedTestimonials
  }
}
