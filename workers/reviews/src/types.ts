/**
 * NormalizedReview — wire format every fetcher emits.
 * Matches the existing reviews table shape used by src/lib/reviews-sync.ts
 * in the main lashpop app, so the schema stays in sync.
 */
export interface NormalizedReview {
  source: 'google' | 'yelp' | 'vagaro'
  /** Stable external id when the source provides one (Vagaro: reviewIds, Yelp: encid). null if not available. */
  externalId: string | null
  /** Canonical URL of the source listing (used for display + dedup fallback). */
  sourceUrl: string
  reviewerName: string
  reviewText: string
  /** ISO timestamp string, or null if the source can't supply one. */
  reviewDate: string | null
  /** Optional staff member the review is about (Vagaro: serviceProviderName). */
  subject: string | null
  /**
   * Canonical FK to team_members(id). Populated by the worker after fetching
   * via a name → id lookup; null when no active or inactive team member matches
   * the `subject` (e.g. "Venue", anonymous reviews, or staff who pre-date the
   * team_members table).
   */
  teamMemberId?: string | null
  rating: number
  /** Owner reply text, if any. */
  responseText: string | null
  responseDate: string | null
  /** Profile photo URL, if the source returned one. */
  reviewerPhoto?: string | null
}

export interface FetcherResult {
  source: 'google' | 'yelp' | 'vagaro'
  reviews: NormalizedReview[]
  /** Total available at source, when known. Helps surface "we're behind" signals. */
  totalAvailable?: number
  errors: string[]
}

export interface Env {
  DATABASE_URL: string

  VAGARO_CLIENT_ID: string
  VAGARO_CLIENT_SECRET: string
  VAGARO_BUSINESS_ID: string
  VAGARO_API_BASE_URL?: string
  VAGARO_REGION?: string

  /** LashPop's Google Maps FID in the form "0xAAAA…:0xBBBB…". Optional — defaults to LashPop. */
  GOOGLE_PLACE_FID?: string
  /** Business name for the Maps search query. Defaults to "LashPop Studios". */
  GOOGLE_PLACE_NAME?: string
  /** Full /maps/preview/place URL minted by scripts/mint-google-session.py. */
  GOOGLE_PREVIEW_URL?: string
  /** "name=value; name=value" cookie header captured by the same mint script. */
  GOOGLE_COOKIES?: string

  YELP_BUSINESS_URL?: string
  CLOAK_TOKEN?: string
  CLOAK_BASE?: string

  MANUAL_TRIGGER_SECRET?: string

  // Mesh-claude bridge (routes through Mac's claude-agent-sdk → CC subscription).
  // Optional: until the Cloudflare API token has Workers VPC permissions the
  // MESH binding is absent and the editor pass falls back to a no-op.
  MESH?: { fetch: typeof fetch }
  BRIDGE_HOST?: string
  BRIDGE_PORT?: string
  BRIDGE_SECRET?: string

  // Durable Object namespace for the ReviewEditor (single instance, named "lashpop")
  REVIEW_EDITOR: DurableObjectNamespace
}
