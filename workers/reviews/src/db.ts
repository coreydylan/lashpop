import type { NormalizedReview } from './types'

type JsonBinding = { kind: 'json'; value: unknown }
type ListBinding = { kind: 'list'; values: unknown[] }

export interface Sql {
  <T extends object[] = Array<Record<string, unknown>>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T>
  json(value: unknown): JsonBinding
  list(values: unknown[]): ListBinding
  unsafe(statement: string): Promise<void>
  end(): Promise<void>
}

const JSON_COLUMNS = new Set(['source_urls', 'config', 'admin_locked_fields'])

function toD1Value(value: unknown): string | number | null {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'string' || typeof value === 'number') return value
  throw new TypeError(`Unsupported D1 binding type: ${typeof value}`)
}

function decodeRow(row: Record<string, unknown>): Record<string, unknown> {
  for (const column of JSON_COLUMNS) {
    const value = row[column]
    if (typeof value === 'string') {
      try { row[column] = JSON.parse(value) } catch { /* retain malformed source data */ }
    }
  }
  return row
}

export function openDb(database: D1Database): Sql {
  const query = async <T extends object[]>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T> => {
    let statement = strings[0]
    const params: Array<string | number | null> = []

    for (let index = 0; index < values.length; index++) {
      const value = values[index]
      if (value && typeof value === 'object' && (value as JsonBinding).kind === 'json') {
        statement += '?'
        params.push(JSON.stringify((value as JsonBinding).value))
      } else if (value && typeof value === 'object' && (value as ListBinding).kind === 'list') {
        const list = (value as ListBinding).values
        statement += list.length ? list.map(() => '?').join(', ') : 'NULL'
        params.push(...list.map(toD1Value))
      } else {
        statement += '?'
        params.push(toD1Value(value))
      }
      statement += strings[index + 1]
    }

    const result = await database.prepare(statement).bind(...params).all<Record<string, unknown>>()
    return result.results.map(decodeRow) as T
  }

  const sql = query as Sql
  sql.json = (value) => ({ kind: 'json', value })
  sql.list = (values) => ({ kind: 'list', values })
  sql.unsafe = async (statement) => {
    if (/^SET\s+/i.test(statement.trim())) return
    await database.prepare(statement).run()
  }
  sql.end = async () => undefined
  return sql
}

export async function closeDb(sql: Sql): Promise<void> {
  await sql.end()
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
 * Coarse fingerprint used to SHORTLIST cross-platform dedup candidates from
 * Postgres. Mirrors the `reviews_fingerprint()` SQL function added in migration
 * `reviews_add_source_urls`. We pull every row whose first-100 chars match;
 * the in-memory verifier below then decides whether the candidate is actually
 * the same review (200-char text overlap + reviewer-name first-token match).
 *
 * Same review copy-pasted across Google/Yelp/Vagaro collapses to the same
 * fingerprint regardless of how the reviewer's name differs (e.g. "Renna M"
 * vs "Renna Ming").
 */
function fingerprint(reviewText: string): string {
  return reviewText.slice(0, 100).toLowerCase().replace(/\s+/g, ' ')
}

/** Longer text comparison used to verify a fingerprint match isn't a false
 *  positive. Two unrelated reviews can share the first 100 chars (e.g.
 *  "LashPop is amazing! The staff is so friendly..."); they basically never
 *  share the first 200. */
function textKey(reviewText: string): string {
  return reviewText.slice(0, 200).toLowerCase().replace(/\s+/g, ' ')
}

/** First whitespace-separated token of a reviewer name, lowercased. Used as
 *  an additional dedup gate so "Cindi" and "Cindi D." collapse together but
 *  "Cindi" and "Cynthia" (or "Cindi" and a different reviewer who happens to
 *  start the same way) stay distinct. */
function namePrefix(name: string | null | undefined): string {
  if (!name) return ''
  const trimmed = name.trim().toLowerCase()
  // First whitespace-separated token, stripped of trailing punctuation
  // ("Cindi D." → "cindi", "Renna M" → "renna").
  const first = trimmed.split(/\s+/)[0] ?? ''
  return first.replace(/[^a-z0-9]/g, '')
}

/**
 * Decide whether an incoming review (`incoming`) actually represents the same
 * review as a stored row that already shares the 100-char fingerprint.
 *
 * Two gates:
 *  - 200-char text key matches (catches near-identical text, tolerates minor
 *    whitespace / punctuation drift past the first 100 chars)
 *  - reviewer name first-token matches (e.g. "Cindi" ↔ "Cindi D.", "Renna M"
 *    ↔ "Renna Ming"), OR the stored row has no name (placeholder/anonymous)
 *
 * Either gate alone is too loose — text-only folds "Cindi"'s review into a
 * different "Cindi D" with the same opener; name-only folds two unrelated
 * reviews from people named Kelly. Together they catch the same-person
 * cross-platform case without false positives.
 */
function isSameReview(
  incoming: { reviewText: string; reviewerName: string | null | undefined },
  stored: { textKey: string; namePrefix: string },
): boolean {
  if (textKey(incoming.reviewText) !== stored.textKey) return false
  const incomingPrefix = namePrefix(incoming.reviewerName)
  // Stored row may not have a name (anonymous Vagaro reviews, etc.) — still
  // accept those as same-review when the 200-char text key matches.
  if (!stored.namePrefix) return true
  if (!incomingPrefix) return true
  return incomingPrefix === stored.namePrefix
}

/**
 * Insert new rows into `reviews`. Dedup runs cross-platform via the SQL
 * `reviews_fingerprint(review_text)` to SHORTLIST candidates, then verified
 * in-memory by 200-char text key + reviewer-name first-token match. When a
 * verified match exists from any source, this batch's source URL is appended
 * to that row's `source_urls` jsonb array instead of inserting a duplicate.
 * Returns count inserted.
 */
export async function upsertReviews(sql: Sql, batch: NormalizedReview[]): Promise<UpsertStats> {
  if (!batch.length) {
    return { source: batch[0]?.source ?? 'unknown', parsed: 0, inserted: 0, testimonials: 0 }
  }
  const source = batch[0].source

  // Pull every existing row that shares a fingerprint with anything in this
  // batch. Scoped to the fingerprints we care about — fast even for big tables.
  // We need review_text + reviewer_name back too so the in-memory verifier
  // can confirm the 200-char + name-prefix gates before folding.
  const existing = await sql<Array<{
    id: string
    review_text: string
    reviewer_name: string | null
    source_urls: Array<{ source: string; url: string }>
  }>>`
    SELECT id, review_text, reviewer_name, source_urls
    FROM reviews
  `
  // A single fingerprint can map to MULTIPLE distinct stored rows (different
  // reviewers with same opener). Keep them all and let the verifier pick.
  const byFp = new Map<string, Array<{
    id: string
    textKey: string
    namePrefix: string
    sourceUrls: Array<{ source: string; url: string }>
  }>>()
  for (const row of existing) {
    const fp = fingerprint(row.review_text)
    const list = byFp.get(fp) ?? []
    list.push({
      id: row.id,
      textKey: textKey(row.review_text),
      namePrefix: namePrefix(row.reviewer_name),
      sourceUrls: row.source_urls ?? [],
    })
    byFp.set(fp, list)
  }

  let insertedReviews = 0
  let insertedTestimonials = 0
  const fresh: NormalizedReview[] = []

  for (const r of batch) {
    const fp = fingerprint(r.reviewText)
    const candidates = byFp.get(fp) ?? []
    const match = candidates.find(c =>
      isSameReview({ reviewText: r.reviewText, reviewerName: r.reviewerName }, c),
    )
    if (match) {
      // Cross-platform duplicate — append this source URL to the surviving
      // row instead of inserting a new one. No-op if already there.
      const already = match.sourceUrls.some(
        su => su.source === r.source && su.url === r.sourceUrl,
      )
      if (!already && r.sourceUrl) {
        const entry = { source: r.source, url: r.sourceUrl }
        const sourceUrls = [...match.sourceUrls, entry]
        await sql`
          UPDATE reviews
          SET source_urls = ${sql.json(sourceUrls)},
              updated_at = ${Date.now()}
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
      ? [{ source: r.source, url: r.sourceUrl }]
      : []

    await sql`
      INSERT INTO reviews (
        id, source, source_url, source_urls, reviewer_name, subject, team_member_id, review_text,
        rating, review_date, response_text, response_date, raw_payload
      ) VALUES (
        ${crypto.randomUUID()}, ${r.source}, ${r.sourceUrl}, ${sql.json(sourceUrlSeed)}, ${r.reviewerName}, ${r.subject}, ${r.teamMemberId ?? null}, ${r.reviewText},
        ${r.rating}, ${reviewDate}, ${r.responseText}, ${responseDate}, ${null}
      )
    `
    insertedReviews++

    // Mirror the saveTestimonials behavior: insert into testimonials too (auto-approved),
    // also deduped by clientName+reviewText.
    const dupTestimonial = await sql<Array<{ found: boolean }>>`
      SELECT EXISTS(
        SELECT 1 FROM testimonials
        WHERE lower(client_name) = ${r.reviewerName.toLowerCase()}
          AND lower(review_text) = ${buildTestimonialText(r).toLowerCase()}
      ) AS found
    `
    if (!dupTestimonial[0]?.found) {
      const [{ max_display_order }] = await sql<Array<{ max_display_order: number }>>`
        SELECT COALESCE(MAX(display_order), 0) AS max_display_order FROM testimonials
      `
      await sql`
        INSERT INTO testimonials (
          id, client_name, review_text, service_id, rating, client_image,
          is_featured, is_approved, display_order, created_at, updated_at
        ) VALUES (
          ${crypto.randomUUID()}, ${r.reviewerName}, ${buildTestimonialText(r)}, ${null}, ${r.rating}, ${null},
          ${false}, ${true}, ${(max_display_order ?? 0) + 1},
          ${reviewDate ?? new Date()}, ${Date.now()}
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
