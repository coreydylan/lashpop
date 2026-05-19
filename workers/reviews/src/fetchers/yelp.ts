/**
 * Yelp fetcher — calls www.yelp.com/gql/batch via Cloak Mesh.
 *
 * Cloak Mesh terminates the request on officemac in a real CloakBrowser context
 * (DataDome-blessed cookies, real Chrome TLS fingerprint, residential IP). We
 * just need to send the right persisted-query body to /gql/batch.
 *
 * Approach (from letsgosandiego/scripts/yelp-gql-direct.ts):
 *   1. POST /gql/batch with operation GetLocalBusinessJsonLinkedData → encBizId
 *   2. POST /gql/batch with operation GetBusinessReviewFeed, paginate via cursor
 *
 * Each operation is dispatched by a stable documentId (Yelp's persisted-query
 * extension protocol). These IDs were captured from www.yelp.com and have been
 * stable for months; if Yelp re-mints them we'll see HTTP 200 with empty data.
 */

import type { Env, FetcherResult, NormalizedReview } from '../types'

const DEFAULT_BIZ_URL = 'https://www.yelp.com/biz/lashpop-studios-oceanside'
const DEFAULT_CLOAK_BASE = 'https://cloak.experialstudio.com'
const SERVICE = 'yelp'
const MAX_REVIEWS = 200
const PAGE_SIZE = 10

const DOC_IDS = {
  GetBusinessReviewFeed: '68eb1f35ced5d05ed897dd2b1e40ae1770fdc99c509ea396b7f2021eab28ccf7',
  GetLocalBusinessJsonLinkedData: '909af465a714ffea4f01914086e4efb4788f1ac1f5f67169be1340dd588639ca',
} as const

interface CloakFetchOpts {
  env: Env
  /** Fully-qualified Yelp URL — Cloak rewrites it to /svc/yelp/www.yelp.com/<path>. */
  url: string
  init?: RequestInit
}

async function cloakFetch({ env, url, init }: CloakFetchOpts): Promise<Response> {
  if (!env.CLOAK_TOKEN) {
    throw new Error('CLOAK_TOKEN not set — cannot call Yelp via Cloak Mesh')
  }
  const target = new URL(url)
  const path = target.pathname.replace(/^\//, '') + target.search
  const base = (env.CLOAK_BASE ?? DEFAULT_CLOAK_BASE).replace(/\/$/, '')
  const rewritten = `${base}/svc/${SERVICE}/${encodeURIComponent(target.host)}/${path}`

  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${env.CLOAK_TOKEN}`)

  return fetch(rewritten, { ...init, headers })
}

/**
 * Yelp's GQL response is a top-level array `[{data: {...}, errors?: [...]}]`,
 * not `{data: [...]}`. We unwrap to the single op's `.data`.
 */
type GqlBatchResp = Array<{ data?: Record<string, any>; errors?: any[] }>

async function gqlCall(
  env: Env,
  operationName: keyof typeof DOC_IDS,
  variables: Record<string, unknown>,
): Promise<{ ok: boolean; data: Record<string, any> | null; raw: any }> {
  const body = JSON.stringify([
    {
      operationName,
      variables,
      extensions: { operationType: 'query', documentId: DOC_IDS[operationName] },
    },
  ])

  const res = await cloakFetch({
    env,
    url: 'https://www.yelp.com/gql/batch',
    init: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Origin: 'https://www.yelp.com',
        Referer: 'https://www.yelp.com/',
      },
      body,
    },
  })

  if (!res.ok) {
    return { ok: false, data: null, raw: { status: res.status, body: await res.text() } }
  }
  const parsed = (await res.json()) as GqlBatchResp
  const first = Array.isArray(parsed) ? parsed[0] : undefined
  if (!first?.data) {
    return { ok: false, data: null, raw: parsed }
  }
  return { ok: true, data: first.data, raw: parsed }
}

async function resolveEncBizId(env: Env): Promise<string | null> {
  // GetLocalBusinessJsonLinkedData takes encBizId itself in variables, but
  // we can also pass `alias`. Easiest: scrape the meta tag from the business page.
  const bizUrl = env.YELP_BUSINESS_URL ?? DEFAULT_BIZ_URL
  const res = await cloakFetch({ env, url: bizUrl })
  if (!res.ok) return null
  const html = await res.text()
  const m = html.match(/<meta[^>]+name=["']yelp-biz-id["'][^>]+content=["']([^"']+)["']/i)
  return m?.[1] ?? null
}

interface YelpReviewEdge {
  node: {
    encid: string
    rating: number
    text?: { full?: string; partial?: string }
    /** Yelp returns this object with localDateTimeForBusiness as the canonical
     *  field. The string carries a timezone offset, e.g. "2026-03-17T13:57:28-07:00". */
    createdAt?: { localDateTimeForBusiness?: string; utcDateTime?: string }
    author?: { displayName?: string; profilePhotoUrl?: { url?: string } | string }
    bizUserPublicReply?: { text?: { full?: string }; createdAt?: { localDateTimeForBusiness?: string; utcDateTime?: string } }
  }
}

interface YelpReviewFeed {
  totalCount?: number
  edges?: YelpReviewEdge[]
  pageInfo?: { hasNextPage?: boolean; endCursor?: string | null }
}

function pickAuthorPhoto(photo: YelpReviewEdge['node']['author']) {
  if (!photo) return null
  if (typeof photo === 'string') return photo
  // newer Yelp shape: { url, url133x, … } object
  if (typeof photo === 'object' && photo !== null) {
    const p = (photo as any).profilePhotoUrl
    if (typeof p === 'string') return p
    if (p && typeof p === 'object' && typeof p.url === 'string') return p.url
  }
  return null
}

function normalize(node: YelpReviewEdge['node'], sourceUrl: string): NormalizedReview | null {
  const name = node.author?.displayName?.trim()
  const text = (node.text?.full ?? node.text?.partial ?? '').trim()
  if (!name || !text) return null

  const reviewDate =
    node.createdAt?.utcDateTime ??
    node.createdAt?.localDateTimeForBusiness ??
    null

  const replyText = node.bizUserPublicReply?.text?.full?.trim() || null
  const replyDateRaw =
    node.bizUserPublicReply?.createdAt?.utcDateTime ??
    node.bizUserPublicReply?.createdAt?.localDateTimeForBusiness ??
    null

  return {
    source: 'yelp',
    externalId: node.encid || null,
    sourceUrl,
    reviewerName: name,
    reviewText: text,
    reviewDate: reviewDate ? new Date(reviewDate).toISOString() : null,
    subject: null,
    rating: Number(node.rating) || 5,
    responseText: replyText,
    responseDate: replyDateRaw ? new Date(replyDateRaw).toISOString() : null,
    reviewerPhoto: pickAuthorPhoto(node.author),
  }
}

export async function fetchYelpReviews(env: Env): Promise<FetcherResult> {
  const errors: string[] = []
  const reviews: NormalizedReview[] = []

  if (!env.CLOAK_TOKEN) {
    return { source: 'yelp', reviews: [], errors: ['CLOAK_TOKEN not set'] }
  }

  const sourceUrl = env.YELP_BUSINESS_URL ?? DEFAULT_BIZ_URL

  let encBizId: string | null
  try {
    encBizId = await resolveEncBizId(env)
  } catch (err) {
    return { source: 'yelp', reviews: [], errors: [err instanceof Error ? err.message : String(err)] }
  }
  if (!encBizId) {
    return { source: 'yelp', reviews: [], errors: ['could not extract encBizId from business page'] }
  }

  let cursor: string | null = null
  let totalCount: number | undefined
  let pagesFetched = 0
  const MAX_PAGES = Math.ceil(MAX_REVIEWS / PAGE_SIZE)

  while (pagesFetched < MAX_PAGES) {
    const r = await gqlCall(env, 'GetBusinessReviewFeed', {
      encBizId,
      reviewsPerPage: PAGE_SIZE,
      selectedReviewEncId: '',
      hasSelectedReview: false,
      sortBy: 'DATE_DESC',
      ratings: [5, 4, 3, 2, 1],
      queryText: '',
      isSearching: false,
      after: cursor,
      isTranslating: false,
      translateLanguageCode: 'en',
      reactionsSourceFlow: 'businessPageReviewSection',
      eliteAllStarSourceFlow: 'biz_page_review_feed',
      fetchMediaReviewContent: false,
      minConfidenceLevel: 'HIGH_CONFIDENCE',
      highlightType: '',
      highlightIdentifier: '',
      isHighlighting: false,
      shouldFetchAddress: true,
    })

    if (!r.ok) {
      errors.push(`page ${pagesFetched + 1}: ${JSON.stringify(r.raw).slice(0, 200)}`)
      break
    }

    const feed = r.data?.business?.reviews as YelpReviewFeed | undefined
    if (!feed?.edges?.length) break

    totalCount = feed.totalCount ?? totalCount
    for (const edge of feed.edges) {
      const n = normalize(edge.node, sourceUrl)
      if (n) reviews.push(n)
      if (reviews.length >= MAX_REVIEWS) break
    }
    pagesFetched++

    if (!feed.pageInfo?.hasNextPage || !feed.pageInfo.endCursor) break
    cursor = feed.pageInfo.endCursor
    if (reviews.length >= MAX_REVIEWS) break

    // Gentle pacing between pages — Cloak handles real-Chrome timing but no
    // sense being aggressive on Yelp.
    await new Promise(resolve => setTimeout(resolve, 600))
  }

  return { source: 'yelp', reviews, totalAvailable: totalCount, errors }
}
