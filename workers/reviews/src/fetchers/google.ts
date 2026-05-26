/**
 * Google Maps reviews via stored preview/place URL + cookies.
 *
 * Discovered architecture:
 *   - The /maps/preview/place response embeds the 8 most recent reviews inline.
 *   - When called with a static curl, Google returns a stripped 35KB response
 *     (place metadata only). Real Chrome gets 102KB with the reviews block.
 *   - The discriminator is the request URL itself (Google's JS mints a session
 *     token embedded in the !pb= param) PLUS the NID cookie set during a real
 *     browser session.
 *   - Once minted by Playwright/real Chrome, the same URL + cookies replay
 *     cleanly from plain urllib/fetch — no browser needed at the call site.
 *
 * So the Worker stores the URL + cookies as secrets, refreshed periodically
 * by a local Mac script (`scripts/mint-google-session.py`). At cron time the
 * Worker just GETs that URL with that Cookie header and parses the response.
 *
 * Parsed shape of preview/place response:
 *   resp = JSON.parse(body.split('\n', 1)[1])
 *   reviews = resp[6][175][9][0][0]    (length ~8)
 *   review[0][0]                       → stable encrypted ID (dedup key)
 *   review[0][1][2]                    → microseconds-since-epoch timestamp
 *   review[0][1][4][5][0]              → reviewer display name
 *   review[0][1][4][5][1]              → reviewer profile photo URL
 *   review[0][1][6]                    → "N months ago" relative time
 *   review[0][2][0][0]                 → integer 1..5 star rating
 *   review[0][2][15][0][0]             → review body text
 *   review[0][3][1]                    → owner reply timestamp (micros)
 *   review[0][3][15][0][0]             → owner reply text
 *
 * Session refresh: run `scripts/mint-google-session.py` from the Mac. It opens
 * a real Chrome, captures the rich response, and updates the Worker secrets.
 * When reviews stop syncing (cookies expire — typically days to a week), re-run.
 */

import type { Env, FetcherResult, NormalizedReview } from '../types'

function safe<T>(fn: () => T): T | undefined {
  try { return fn() } catch { return undefined }
}

function microsToIso(micros: unknown): string | null {
  if (typeof micros !== 'number' || !Number.isFinite(micros)) return null
  if (micros < 1_000_000_000_000_000 || micros > 5_000_000_000_000_000) return null
  return new Date(micros / 1000).toISOString()
}

function normalizeOne(node: any, sourceUrl: string): NormalizedReview | null {
  const externalId = safe(() => node[0][0] as string) ?? null
  const ts = safe(() => node[0][1][2] as number)
  const authorName = safe(() => node[0][1][4][5][0] as string)
  const authorPhoto = safe(() => node[0][1][4][5][1] as string) ?? null
  const rating = safe(() => node[0][2][0][0] as number)
  const text = safe(() => node[0][2][15][0][0] as string)
  const replyText = safe(() => node[0][3][15][0][0] as string) ?? null
  const replyTs = safe(() => node[0][3][1] as number)

  if (!authorName || !text || typeof rating !== 'number') return null

  return {
    source: 'google',
    externalId,
    sourceUrl,
    reviewerName: authorName.trim(),
    reviewText: text.trim(),
    reviewDate: microsToIso(ts),
    subject: null,
    rating,
    responseText: replyText?.trim() ?? null,
    responseDate: microsToIso(replyTs),
    reviewerPhoto: authorPhoto,
  }
}

function parseInlineReviews(body: string, sourceUrl: string): NormalizedReview[] {
  const nl = body.indexOf('\n')
  const payload = nl >= 0 ? body.slice(nl + 1) : body
  let json: any
  try {
    json = JSON.parse(payload)
  } catch {
    return []
  }
  const arr = safe(() => json[6][175][9][0][0] as any[])
  if (!Array.isArray(arr)) return []
  return arr
    .map(item => normalizeOne(item, sourceUrl))
    .filter((r): r is NormalizedReview => r !== null)
}

/**
 * Extract Google's published "total review count" from the place response.
 *
 * The reviews block lives at json[6][175][9] — there's a sibling counter at
 * json[6][175][9][2] in many places that holds the integer total. Also seen
 * at json[6][4][8] (place card "[rating, count]" tuple). We try the known
 * paths in order and accept the first plausible integer (1..100_000). When
 * none match we return undefined and the post-sync falls back to local count.
 */
function parseTotalReviewCount(body: string): number | undefined {
  const nl = body.indexOf('\n')
  const payload = nl >= 0 ? body.slice(nl + 1) : body
  let json: any
  try {
    json = JSON.parse(payload)
  } catch {
    return undefined
  }
  const candidates: Array<() => unknown> = [
    () => json[6][175][9][2],
    () => json[6][175][9][3],
    () => json[6][4][8],
    () => json[6][4][7],
    () => json[6][175][9][0][1],
  ]
  for (const get of candidates) {
    const v = safe(get)
    if (typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 100_000) {
      return v
    }
  }
  return undefined
}

export async function fetchGoogleReviews(env: Env): Promise<FetcherResult> {
  const errors: string[] = []
  const reviews: NormalizedReview[] = []

  if (!env.GOOGLE_PREVIEW_URL || !env.GOOGLE_COOKIES) {
    return {
      source: 'google',
      reviews: [],
      errors: [
        'GOOGLE_PREVIEW_URL / GOOGLE_COOKIES secrets not set — run ' +
          'scripts/mint-google-session.py from the Mac to refresh',
      ],
    }
  }

  const fid = env.GOOGLE_PLACE_FID ?? '0x80dc73710da0172f:0x49e879bec593fc5e'
  const placeName = env.GOOGLE_PLACE_NAME ?? 'LashPop Studios'
  const displaySourceUrl = `https://www.google.com/maps/place/?q=place_id:${fid}`

  try {
    const res = await fetch(env.GOOGLE_PREVIEW_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        Origin: 'https://www.google.com',
        Referer: `https://www.google.com/maps?q=${encodeURIComponent(placeName)}&ftid=${encodeURIComponent(fid)}&hl=en`,
        'X-Same-Domain': '1',
        'X-Maps-Diversion-Context-Bin': 'CAE=',
        Cookie: env.GOOGLE_COOKIES,
      },
    })
    if (!res.ok) {
      errors.push(`preview/place HTTP ${res.status}`)
      return { source: 'google', reviews, errors }
    }
    const body = await res.text()
    if (body.length < 50_000) {
      errors.push(
        `preview/place stripped to ${body.length}B (expected >=50KB) — ` +
          `cookies likely expired. Re-run scripts/mint-google-session.py.`,
      )
      return { source: 'google', reviews, errors }
    }
    const parsed = parseInlineReviews(body, displaySourceUrl)
    reviews.push(...parsed)
    if (!parsed.length) {
      errors.push(`parsed 0 reviews from ${body.length}B body — schema may have shifted`)
    }
    const totalAvailable = parseTotalReviewCount(body)
    return { source: 'google', reviews, totalAvailable, errors }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err))
  }

  return { source: 'google', reviews, errors }
}
