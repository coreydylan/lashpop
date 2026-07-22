/**
 * Vagaro fetcher — uses the OAuth Merchant API directly. No scraping.
 *
 * Endpoint: GET /us02/api/v2/merchants/{businessId}/reviews?pageNumber=N&pageSize=50
 * Auth:     `accessToken` request header (NOT Bearer)
 * Dedup:    each review has a stable `reviewIds` we surface as externalId
 *
 * Note: businessId goes URL-encoded into the path. The API validator reports
 * "merchantId required" when it's missing — confusing but it's the same value.
 */

import type { Env, FetcherResult, NormalizedReview } from '../types'

const DEFAULT_BASE = 'https://api.vagaro.com'
const DEFAULT_REGION = 'us02'
const PAGE_SIZE = 50
// Daily cron × 25-call ceiling = at most 750 metered calls in 30 days.
// Current volume is 9 calls/cycle (1 auth + 8 pages for 400 reviews).
const MAX_METERED_CALLS_PER_CYCLE = 25

type MeteredUsage = NonNullable<FetcherResult['meteredUsage']>

interface VagaroAuthResp {
  status?: number
  responseCode?: number
  data?: { access_token: string; expires_in: number }
  message?: string
}

interface VagaroReviewRow {
  reviewIds: string
  reviewer: string
  averageRank: number
  serviceProviderName: string
  reviewerPhoto: string
  venueReview: string
  serviceProviderReview: string
  publishDate: string // "MM/DD/YYYY HH:MM:SS"
  businessResponseDateFormat?: string
  responseModifiedDateFormat?: string
  businessResponse?: string
}

interface VagaroReviewsResp {
  status?: number
  responseCode?: number
  data?: {
    pageNumber: number
    pageSize: number
    totalPages: number
    totalRecords: number
    nextPage: string | null
    records: VagaroReviewRow[]
  }
}

function recordMeteredCall(usage: MeteredUsage, endpoint: string, kind: 'auth' | 'api'): void {
  if (usage.totalCalls >= usage.maxCallsPerCycle) {
    throw new Error(
      `Vagaro review call budget exhausted before ${endpoint} ` +
      `(${usage.totalCalls}/${usage.maxCallsPerCycle} attempted this cycle)`,
    )
  }
  if (kind === 'auth') usage.authCalls++
  else usage.apiCalls++
  usage.totalCalls++
  usage.byEndpoint[endpoint] = (usage.byEndpoint[endpoint] ?? 0) + 1
}

async function getAccessToken(env: Env, usage: MeteredUsage): Promise<string> {
  const base = env.VAGARO_API_BASE_URL ?? DEFAULT_BASE
  const region = env.VAGARO_REGION ?? DEFAULT_REGION
  const endpoint = '/api/v2/merchants/generate-access-token'
  recordMeteredCall(usage, endpoint, 'auth')
  const res = await fetch(`${base}/${region}${endpoint}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: env.VAGARO_CLIENT_ID,
      clientSecretKey: env.VAGARO_CLIENT_SECRET,
      scope: 'read access',
    }),
  })
  if (!res.ok) throw new Error(`Vagaro auth HTTP ${res.status}: ${await res.text()}`)
  const j = (await res.json()) as VagaroAuthResp
  if (j.status !== 200 || j.responseCode !== 1000 || !j.data?.access_token) {
    throw new Error(`Vagaro auth response invalid: ${j.message ?? JSON.stringify(j)}`)
  }
  return j.data.access_token
}

/**
 * "11/01/2018 10:38:42" → ISO string in UTC. Vagaro stores their merchant timezone
 * but the API doesn't include offset info — close enough for ordering/display.
 */
function parsePublishDate(s: string): string | null {
  if (!s) return null
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/)
  if (!m) return null
  const [, mo, d, y, h, mi, sec] = m
  const iso = new Date(
    Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(sec)),
  ).toISOString()
  return iso
}

function normalize(row: VagaroReviewRow): NormalizedReview | null {
  const name = row.reviewer?.trim()
  // Prefer venueReview, fall back to serviceProviderReview, then concat both if both present.
  const venue = row.venueReview?.trim() ?? ''
  const provider = row.serviceProviderReview?.trim() ?? ''
  const text = venue && provider && venue !== provider
    ? `${venue}\n\n${provider}`
    : (venue || provider)

  if (!name || !text) return null

  return {
    source: 'vagaro',
    externalId: row.reviewIds || null,
    sourceUrl: 'https://www.vagaro.com/lashpop32/reviews',
    reviewerName: name,
    reviewText: text,
    reviewDate: parsePublishDate(row.publishDate),
    subject: row.serviceProviderName?.trim() || null,
    rating: Number(row.averageRank) || 5,
    responseText: row.businessResponse?.trim() || null,
    responseDate: row.responseModifiedDateFormat
      ? parsePublishDate(row.responseModifiedDateFormat)
      : null,
    reviewerPhoto: row.reviewerPhoto || null,
  }
}

export async function fetchVagaroReviews(env: Env): Promise<FetcherResult> {
  const errors: string[] = []
  const reviews: NormalizedReview[] = []
  const meteredUsage: MeteredUsage = {
    authCalls: 0,
    apiCalls: 0,
    totalCalls: 0,
    maxCallsPerCycle: MAX_METERED_CALLS_PER_CYCLE,
    byEndpoint: {},
  }

  if (!env.VAGARO_CLIENT_ID || !env.VAGARO_CLIENT_SECRET || !env.VAGARO_BUSINESS_ID) {
    return {
      source: 'vagaro',
      reviews: [],
      meteredUsage,
      errors: ['Missing VAGARO_CLIENT_ID / VAGARO_CLIENT_SECRET / VAGARO_BUSINESS_ID'],
    }
  }

  const base = env.VAGARO_API_BASE_URL ?? DEFAULT_BASE
  const region = env.VAGARO_REGION ?? DEFAULT_REGION
  const bizPath = encodeURIComponent(env.VAGARO_BUSINESS_ID)

  let token: string
  try {
    token = await getAccessToken(env, meteredUsage)
  } catch (err) {
    return {
      source: 'vagaro',
      reviews: [],
      meteredUsage,
      errors: [err instanceof Error ? err.message : String(err)],
    }
  }

  let pageNumber = 1
  let totalPages = 1
  let totalRecords: number | undefined

  while (pageNumber <= totalPages) {
    const endpoint = '/api/v2/merchants/{businessId}/reviews'
    try {
      recordMeteredCall(meteredUsage, endpoint, 'api')
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err))
      break
    }
    const url =
      `${base}/${region}/api/v2/merchants/${bizPath}/reviews` +
      `?pageNumber=${pageNumber}&pageSize=${PAGE_SIZE}`
    const res = await fetch(url, {
      headers: { accessToken: token, Accept: 'application/json' },
    })
    if (!res.ok) {
      errors.push(`page ${pageNumber}: HTTP ${res.status} ${await res.text()}`.slice(0, 200))
      break
    }
    const j = (await res.json()) as VagaroReviewsResp
    if (j.responseCode !== 1000 || !j.data) {
      errors.push(`page ${pageNumber}: responseCode=${j.responseCode}`)
      break
    }

    totalPages = j.data.totalPages
    totalRecords = j.data.totalRecords

    for (const row of j.data.records) {
      const n = normalize(row)
      if (n) reviews.push(n)
    }

    pageNumber += 1
    if (pageNumber > totalPages) break
  }

  return { source: 'vagaro', reviews, totalAvailable: totalRecords, meteredUsage, errors }
}
