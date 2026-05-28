import postgres from 'postgres'

import type { NormalizedReview } from './types'

export type Sql = postgres.Sql

export function openDb(databaseUrl: string): Sql {
  return postgres(databaseUrl.trim(), {
    prepare: false,
    max: 1,
    idle_timeout: 5,
    max_lifetime: 60,
    connect_timeout: 30,
    connection: { application_name: 'lashpop_reviews_worker' },
  })
}

export async function closeDb(sql: Sql): Promise<void> {
  await sql.end({ timeout: 5 })
}

/**
 * Fetch all team_members and build a normalized name → id map.
 *
 * Returns lowercased + whitespace-trimmed keys so it matches whatever a source
 * gives us (Vagaro: "Emily Rogers", "  Kelly Katona  ", etc.). When the table
 * has duplicates with the same name (currently happens for inactive/active
 * splits like "Evie Ells") the *active* row wins — that's what users expect a
 * profile link to surface.
 */
export async function buildTeamMemberIndex(
  sql: Sql,
): Promise<{ resolve: (name: string | null | undefined) => string | null }> {
  const rows = await sql<Array<{ id: string; name: string; is_active: boolean }>>`
    SELECT id, name, is_active FROM team_members
  `
  const map = new Map<string, { id: string; isActive: boolean }>()
  for (const row of rows) {
    const key = row.name.trim().toLowerCase()
    const existing = map.get(key)
    if (!existing || (!existing.isActive && row.is_active)) {
      map.set(key, { id: row.id, isActive: row.is_active })
    }
  }
  return {
    resolve(name) {
      if (!name) return null
      return map.get(name.trim().toLowerCase())?.id ?? null
    },
  }
}

export interface UpsertStats {
  source: string
  parsed: number
  inserted: number
  testimonials: number
}

/**
 * Compute the fingerprint used for cross-platform dedup. Mirrors the
 * `reviews_fingerprint()` SQL function added in migration
 * `reviews_add_source_urls`. Same review copy-pasted across Google/Yelp/Vagaro
 * collapses to the same fingerprint regardless of how the reviewer's name
 * differs (e.g. "Renna M" vs "Renna Ming").
 */
function fingerprint(reviewText: string): string {
  return reviewText.slice(0, 100).toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Insert new rows into `reviews`. Dedup runs cross-platform via
 * `reviews_fingerprint(review_text)`: when a matching row already exists from
 * any source, this batch's source URL is appended to that row's `source_urls`
 * jsonb array instead of inserting a duplicate. Returns count inserted.
 */
export async function upsertReviews(sql: Sql, batch: NormalizedReview[]): Promise<UpsertStats> {
  if (!batch.length) {
    return { source: batch[0]?.source ?? 'unknown', parsed: 0, inserted: 0, testimonials: 0 }
  }
  const source = batch[0].source

  // Pull every existing row that shares a fingerprint with anything in this
  // batch. Scoped to the fingerprints we care about — fast even for big tables.
  const batchFingerprints = Array.from(new Set(batch.map(r => fingerprint(r.reviewText))))
  const existing = await sql<Array<{ id: string; fp: string; source_urls: Array<{ source: string; url: string }> }>>`
    SELECT id, reviews_fingerprint(review_text) AS fp, source_urls
    FROM reviews
    WHERE reviews_fingerprint(review_text) = ANY(${batchFingerprints})
  `
  const byFp = new Map<string, { id: string; sourceUrls: Array<{ source: string; url: string }> }>()
  for (const row of existing) {
    byFp.set(row.fp, { id: row.id, sourceUrls: row.source_urls ?? [] })
  }

  let insertedReviews = 0
  let insertedTestimonials = 0
  const fresh: NormalizedReview[] = []

  for (const r of batch) {
    const fp = fingerprint(r.reviewText)
    const match = byFp.get(fp)
    if (match) {
      // Cross-platform duplicate — append this source URL to the surviving
      // row instead of inserting a new one. No-op if already there.
      const already = match.sourceUrls.some(
        su => su.source === r.source && su.url === r.sourceUrl,
      )
      if (!already && r.sourceUrl) {
        const entry = { source: r.source, url: r.sourceUrl }
        await sql`
          UPDATE reviews
          SET source_urls = source_urls || ${sql.json([entry])}::jsonb,
              updated_at = now()
          WHERE id = ${match.id}
        `
        match.sourceUrls.push(entry)
      }
      continue
    }
    fresh.push(r)
  }

  if (!fresh.length) {
    return { source, parsed: batch.length, inserted: 0, testimonials: 0 }
  }

  for (const r of fresh) {
    const reviewDate = r.reviewDate ? new Date(r.reviewDate) : null
    const responseDate = r.responseDate ? new Date(r.responseDate) : null
    const sourceUrlSeed = r.sourceUrl
      ? sql.json([{ source: r.source, url: r.sourceUrl }])
      : sql.json([])

    await sql`
      INSERT INTO reviews (
        source, source_url, source_urls, reviewer_name, subject, team_member_id, review_text,
        rating, review_date, response_text, response_date, raw_payload
      ) VALUES (
        ${r.source}, ${r.sourceUrl}, ${sourceUrlSeed}::jsonb, ${r.reviewerName}, ${r.subject}, ${r.teamMemberId ?? null}, ${r.reviewText},
        ${r.rating}, ${reviewDate}, ${r.responseText}, ${responseDate}, ${null}
      )
    `
    insertedReviews++

    // Mirror the saveTestimonials behavior: insert into testimonials too (auto-approved),
    // also deduped by clientName+reviewText.
    const dupTestimonial = await sql<Array<{ exists: boolean }>>`
      SELECT EXISTS(
        SELECT 1 FROM testimonials
        WHERE lower(client_name) = ${r.reviewerName.toLowerCase()}
          AND lower(review_text) = ${buildTestimonialText(r).toLowerCase()}
      ) AS exists
    `
    if (!dupTestimonial[0]?.exists) {
      const [{ max_display_order }] = await sql<Array<{ max_display_order: number }>>`
        SELECT COALESCE(MAX(display_order), 0) AS max_display_order FROM testimonials
      `
      await sql`
        INSERT INTO testimonials (
          client_name, review_text, service_id, rating, client_image,
          is_featured, is_approved, display_order, created_at, updated_at
        ) VALUES (
          ${r.reviewerName}, ${buildTestimonialText(r)}, ${null}, ${r.rating}, ${null},
          ${false}, ${true}, ${(max_display_order ?? 0) + 1},
          ${reviewDate ?? new Date()}, NOW()
        )
      `
      insertedTestimonials++
    }
  }

  return { source, parsed: batch.length, inserted: insertedReviews, testimonials: insertedTestimonials }
}

/** Mirrors buildReviewText() in src/lib/reviews-sync.ts. */
function buildTestimonialText(r: NormalizedReview): string {
  const parts: string[] = []
  if (r.subject && r.subject !== 'Venue') {
    parts.push(`Service provider: ${r.subject}`)
  }
  parts.push(r.reviewText)
  if (r.responseText) {
    const responseDateLabel = r.responseDate
      ? new Date(r.responseDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null
    parts.push(`${responseDateLabel ? `Response (${responseDateLabel})` : 'Response'}: ${r.responseText}`)
  }
  return parts.filter(Boolean).join('\n\n')
}
