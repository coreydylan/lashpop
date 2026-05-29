/**
 * Post-sync DB passes: stale-team-member filter + auto-promote rotation.
 *
 * Mirrors src/lib/review-filters.ts in the main app, but ported to the Worker
 * so the cron is self-contained (no HTTP hop into Next.js). The two
 * implementations should stay in sync — when one changes, update the other.
 *
 * Both functions take a ReviewPipelineSettings object so admin-tuned values
 * (capacity, diversity caps, recency window, etc.) flow through without
 * Worker redeploys.
 */
import type { Sql } from './db'
import type { ReviewPipelineSettings } from './settings'

const STALE = 'stale_team_member'

export interface StaleStats {
  hidden: number
  restored: number
  inactiveCount: number
}

export interface AutoPromoteStats {
  promoted: number
  homepageSize: number
  pinned: number
  capacity: number
}

export interface ReviewStatsRow {
  source: string
  rating: number
  reviewCount: number
}

export interface ReviewStatsResult {
  updated: ReviewStatsRow[]
}

/**
 * Refresh the `review_stats` table from current `reviews` data + each fetcher's
 * upstream `totalAvailable`. This is the table that powers the public review
 * counter on the homepage (hero chip + carousel header). Without this the
 * counter is frozen at whatever number was last written by the old BrightData
 * cron that this Worker replaced.
 *
 * Precedence per source:
 *   - upstream totalAvailable wins when known — that's what the platform
 *     publicly shows right now, and it's what users compare the counter to
 *   - fall back to count(*) of rows we hold if upstream is null/missing (e.g.
 *     Google's fetcher doesn't report a total, or a fetcher errored this cycle)
 *
 * NB: we deliberately DON'T take max(local, upstream). Local can drift higher
 * than upstream when platforms remove reviews (deletes/flags) — those rows
 * stick in our DB but no longer count on the platform. Counter should match
 * the platform.
 *
 * The average rating is computed from the rows we hold. Sources we didn't
 * fetch this cycle are left alone so a flaky fetcher run doesn't blank the
 * count.
 */
export async function updateReviewStats(
  sql: Sql,
  fetcherTotals: Partial<Record<'google' | 'vagaro' | 'yelp', number | undefined>>,
): Promise<ReviewStatsResult> {
  // Count per-platform via source_urls instead of the `source` column. Cross-
  // platform dedup (see workers/reviews/src/db.ts upsertReviews) folds a
  // matching review into ONE row whose `source` is the oldest platform but
  // whose `source_urls` carries the URLs for every platform the review
  // appears on. Counting `source` alone undercounts every platform that lost
  // duplicates to an older sibling, which read on the homepage as "Yelp
  // count went down by 13" after the dedup backfill landed.
  // Average rating still comes from rows where that platform is the primary
  // `source` — every platform has plenty of solo rows so this stays stable.
  // Cross-platform dedup folds a matching review into ONE row whose `source`
  // is the oldest platform but whose `source_urls` carries every platform the
  // review appears on. Use BOTH counts: rows where primary source matches
  // (covers solo + pre-migration rows) UNION rows where any source_urls entry
  // matches (covers folded cross-platform dupes). The DISTINCT id then counts
  // each row once per platform it appears on.
  const aggregates = await sql<Array<{ source: string; count: number; avg_rating: string }>>`
    WITH per_platform AS (
      SELECT id, source AS platform FROM reviews
      WHERE source IN ('google', 'vagaro', 'yelp')
      UNION
      SELECT r.id, su->>'source' AS platform
      FROM reviews r, LATERAL jsonb_array_elements(r.source_urls) AS su
      WHERE su->>'source' IN ('google', 'vagaro', 'yelp')
    ),
    counts AS (
      SELECT platform AS source, COUNT(DISTINCT id)::int AS count
      FROM per_platform GROUP BY platform
    ),
    ratings AS (
      SELECT source, AVG(rating)::numeric(3,1)::text AS avg_rating
      FROM reviews WHERE source IN ('google', 'vagaro', 'yelp')
      GROUP BY source
    ),
    current_db AS (
      SELECT source, review_count FROM review_stats
      WHERE source IN ('google', 'vagaro', 'yelp')
    )
    SELECT c.source, c.count, r.avg_rating
    FROM counts c
    LEFT JOIN ratings r USING (source)
  `

  // Ratchet: review_count can only INCREASE between syncs. Platforms remove
  // reviews server-side fairly often (Yelp's "not currently recommended"
  // filter shuffles a few each week), and our cron previously rewrote
  // review_stats down to whatever the upstream fetcher reported — which is
  // how Yelp drifted from 201 → 191 even though no reviews were truly
  // deleted. MAX(upstream, localCount, currentDb) holds the high-water
  // mark; reviews truly removed by Yelp eventually wash out in the dedup
  // table itself, not in the counter.
  const currentRows = await sql<Array<{ source: string; review_count: number }>>`
    SELECT source, review_count FROM review_stats
    WHERE source IN ('google', 'vagaro', 'yelp')
  `
  const currentBySource = new Map(currentRows.map(r => [r.source, r.review_count]))

  const updated: ReviewStatsRow[] = []
  for (const row of aggregates) {
    const source = row.source as 'google' | 'vagaro' | 'yelp'
    const upstreamTotal = fetcherTotals[source] ?? 0
    const localCount = row.count
    const currentDb = currentBySource.get(source) ?? 0
    const reviewCount = Math.max(upstreamTotal, localCount, currentDb)
    const ratingNum = Number(row.avg_rating)
    const rating = Number.isFinite(ratingNum) && ratingNum > 0 ? ratingNum : 5.0
    const ratingStr = rating.toFixed(1)

    await sql`
      INSERT INTO review_stats (source, rating, review_count, updated_at)
      VALUES (${source}, ${ratingStr}::numeric, ${reviewCount}, NOW())
      ON CONFLICT (source) DO UPDATE
      SET rating = EXCLUDED.rating,
          review_count = EXCLUDED.review_count,
          updated_at = NOW()
    `
    updated.push({ source, rating, reviewCount })
  }
  return { updated }
}

/** Hide reviews whose team_member_id points at an inactive staff member;
 *  restore previously-hidden reviews whose linked staff are active again.
 *  Skips reviews where admin has locked the show_on_website column. */
export async function applyStaleTeamMemberFilter(sql: Sql): Promise<StaleStats> {
  const members = await sql<Array<{ id: string; name: string; is_active: boolean }>>`
    SELECT id, name, is_active FROM team_members
  `
  const inactiveIds = members.filter(m => !m.is_active).map(m => m.id)
  const inactiveCount = inactiveIds.length

  // Hide FK-linked reviews about inactive staff (skip manually-hidden + admin-locked).
  let hidden = 0
  if (inactiveIds.length) {
    const result = await sql`
      UPDATE reviews
      SET show_on_website = false,
          hidden_reason = ${STALE},
          updated_at = NOW()
      WHERE team_member_id = ANY(${inactiveIds}::uuid[])
        AND hidden_reason IS NULL
        AND NOT (admin_locked_fields ? 'show_on_website')
      RETURNING id
    `
    hidden = result.length
  }

  // Restore previously-auto-hidden reviews whose FK now points at active staff.
  const restored = await sql`
    UPDATE reviews
    SET show_on_website = true,
        hidden_reason = NULL,
        updated_at = NOW()
    WHERE hidden_reason = ${STALE}
      AND team_member_id IS NOT NULL
      AND NOT (admin_locked_fields ? 'show_on_website')
      AND (
        ${inactiveIds.length === 0}::boolean
        OR team_member_id <> ALL(${inactiveIds}::uuid[])
      )
    RETURNING id
  `
  return { hidden, restored: restored.length, inactiveCount }
}

/**
 * Rebuild auto-rotating slots in homepage_reviews.
 *
 * Pinned rows (is_pinned=true) are admin-curated and immortal.
 * Auto rows (is_pinned=false) get wiped + re-inserted every run with the
 * newest 5★ visible-non-dismissed reviews until we hit the cap.
 *
 * Filters + sort:
 *   - rating=5, visible, not dismissed, not pinned
 *   - team_member_id is null OR points at active stylist
 *   - text length ≥ settings.auto_promote_min_text_length
 *   - review_date within settings.auto_promote_recency_months
 *   - quality_score ≥ settings.auto_promote_min_quality_score (NULL allowed
 *     so newly-arrived unscored reviews can still get a slot)
 *   - sort by quality_score DESC NULLS LAST, review_date DESC NULLS LAST
 *   - diversity: ≤ settings.diversity_cap_per_source per source
 *   - diversity: ≤ settings.diversity_cap_per_stylist per linked stylist
 */
export async function autoPromoteToHomepage(
  sql: Sql,
  settings: ReviewPipelineSettings,
): Promise<AutoPromoteStats> {
  const capacity = settings.homepage_capacity

  const pinned = await sql<Array<{ review_id: string; display_order: number }>>`
    SELECT review_id, display_order
    FROM homepage_reviews
    WHERE is_pinned = true
    ORDER BY display_order ASC
  `

  await sql`DELETE FROM homepage_reviews WHERE is_pinned = false`

  const remaining = Math.max(0, capacity - pinned.length)
  if (remaining === 0) {
    return {
      promoted: 0,
      homepageSize: pinned.length,
      pinned: pinned.length,
      capacity,
    }
  }

  const pinnedIds = pinned.map(p => p.review_id)
  const inactiveStaff = await sql<Array<{ id: string }>>`
    SELECT id FROM team_members WHERE is_active = false
  `
  const inactiveIds = inactiveStaff.map(r => r.id)

  const minLen = settings.auto_promote_min_text_length
  const months = settings.auto_promote_recency_months
  const minScore = settings.auto_promote_min_quality_score
  // Days of age → 1 point of quality erosion. Sort by an "effective score"
  // = quality_score - days_old / decay. Unscored reviews are treated as 5
  // (mid) so they aren't excluded, but won't outrank a high-quality fresh one.
  const decay = Math.max(1, settings.recency_decay_days_per_point)

  // Generic / anonymized reviewer names that should never make the carousel —
  // Vagaro and other platforms use these as placeholders when the reviewer
  // didn't share their name. Real reviews, just no human signal to display.
  // Kept in JSON-LD / aggregate rating; only excluded from the visual rotation.
  const candidates = await sql<Array<{ id: string; source: string; team_member_id: string | null }>>`
    SELECT id, source, team_member_id FROM reviews
    WHERE rating = 5
      AND show_on_website = true
      AND homepage_dismissed = false
      AND length(review_text) >= ${minLen}
      AND review_date IS NOT NULL
      AND review_date >= NOW() - (${months}::int * INTERVAL '1 month')
      AND (quality_score IS NULL OR quality_score >= ${minScore})
      AND lower(trim(reviewer_name)) NOT IN (
        'verified', 'venue', 'anonymous', 'guest', 'customer', 'client', 'user', 'ok'
      )
      AND length(trim(reviewer_name)) >= 2
      AND reviewer_name !~* '(cancel|appt|appointment|booking)'
      AND (
        ${pinnedIds.length === 0}::boolean
        OR id <> ALL(${pinnedIds}::uuid[])
      )
      AND (
        ${inactiveIds.length === 0}::boolean
        OR team_member_id IS NULL
        OR team_member_id <> ALL(${inactiveIds}::uuid[])
      )
    ORDER BY (
      COALESCE(quality_score, 5)
      - EXTRACT(EPOCH FROM (NOW() - review_date)) / 86400 / ${decay}
    ) DESC NULLS LAST,
    review_date DESC NULLS LAST
    LIMIT 80
  `

  const sourceCount = new Map<string, number>()
  const staffCount = new Map<string, number>()
  const picked: Array<{ id: string }> = []
  for (const row of candidates) {
    if ((sourceCount.get(row.source) ?? 0) >= settings.diversity_cap_per_source) continue
    const staffKey = row.team_member_id
    if (staffKey && (staffCount.get(staffKey) ?? 0) >= settings.diversity_cap_per_stylist) continue
    picked.push({ id: row.id })
    sourceCount.set(row.source, (sourceCount.get(row.source) ?? 0) + 1)
    if (staffKey) staffCount.set(staffKey, (staffCount.get(staffKey) ?? 0) + 1)
    if (picked.length >= remaining) break
  }

  if (picked.length === 0) {
    return {
      promoted: 0,
      homepageSize: pinned.length,
      pinned: pinned.length,
      capacity,
    }
  }

  const maxPinnedOrder = pinned.length
    ? Math.max(...pinned.map(p => p.display_order))
    : -1

  for (let i = 0; i < picked.length; i++) {
    await sql`
      INSERT INTO homepage_reviews (review_id, display_order, is_pinned)
      VALUES (${picked[i].id}, ${maxPinnedOrder + i + 1}, ${false})
    `
  }

  return {
    promoted: picked.length,
    homepageSize: pinned.length + picked.length,
    pinned: pinned.length,
    capacity,
  }
}
