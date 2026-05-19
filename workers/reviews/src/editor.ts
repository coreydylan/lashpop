/**
 * Weekly editor pass.
 *
 * Three jobs:
 *   1. Score newly inserted reviews (1-10) for homepage-carousel suitability.
 *   2. Re-check stale-team-member hide using LLM semantic match — catches
 *      paraphrases the regex misses (e.g. "Kayla M. who used to work here").
 *   3. Rebuild per-stylist highlight reels — top 3 reviews per active team
 *      member, ranked for profile pages + AI-search.
 *
 * Routed through mesh-claude → Mac-side claude-agent-sdk → Corey's CC
 * subscription. Zero direct Anthropic API spend.
 */
import type { Sql } from './db'
import { askMeshClaude, type MeshBridgeBindings } from './mesh-claude'

// Default — overridable by settings.highlights_per_stylist via runEditor's
// arg. Kept as a local for backwards-compat with the constant references.
let HIGHLIGHTS_PER_MEMBER = 3
const SCORING_BATCH_SIZE = 12 // reviews per LLM call

export interface EditorStats {
  scored: number
  hiddenByLLM: number
  highlightsBuilt: number
  errors: string[]
}

interface ReviewRow {
  id: string
  reviewer_name: string
  review_text: string
  rating: number
  source: string
  subject: string | null
  team_member_id: string | null
  review_date: Date | null
}

const SYSTEM_SCORE = `You are the editor of the LashPop Studios homepage review carousel. \
Score each review 1-10 for suitability as a homepage social-proof card. \
10 = specific story with named service or stylist, vivid detail, authentic voice. \
1 = generic praise, off-topic, or could apply to any business. \
Mid-range = real review but light on detail. \
Always respond with strict JSON: a single object mapping the review id (string) to {"score": int 1-10, "notes": short string}.`

const SYSTEM_STALE = `You are checking customer reviews to find any that praise a stylist \
who no longer works at LashPop Studios. Respond JSON: a single object mapping review id (string) \
to {"hide": boolean, "matchedName": string or null, "reason": short string}. \
Match paraphrases like "Kayla, who isn't here anymore" and "I miss Renee." \
Do NOT hide reviews that only describe the venue or services without naming a stylist.`

const SYSTEM_HIGHLIGHT = `You are picking the 3 best reviews about each stylist for their public profile page. \
Prefer reviews that show off the stylist's strengths, mention specific services, and have authentic voice. \
Respond JSON: a single object mapping stylist id (string) to an ordered array of \
{"reviewId": string, "rank": 1|2|3, "notes": short string} — at most 3 entries per stylist, \
ranks distinct, best first. If fewer than 3 candidates exist for a stylist, return what you can.`

/** Helper: extract the first {...} JSON blob from a possibly-markdown-fenced LLM response. */
function extractJson<T>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) as T } catch { return null }
}

/** STEP 1 — score every review missing quality_score, in chunks.
 *  Skips reviews where admin has locked the quality_score column. */
async function scoreNewReviews(sql: Sql, env: MeshBridgeBindings, errors: string[]): Promise<number> {
  const rows = await sql<ReviewRow[]>`
    SELECT id, reviewer_name, review_text, rating, source, subject, team_member_id, review_date
    FROM reviews
    WHERE quality_score IS NULL
      AND show_on_website = true
      AND length(review_text) >= 20
      AND NOT (admin_locked_fields ? 'quality_score')
    ORDER BY review_date DESC NULLS LAST
    LIMIT 200
  `
  if (!rows.length) return 0

  let scored = 0
  for (let i = 0; i < rows.length; i += SCORING_BATCH_SIZE) {
    const batch = rows.slice(i, i + SCORING_BATCH_SIZE)
    const prompt = batch
      .map(
        r => `--- review ${r.id} ---
source: ${r.source} | rating: ${r.rating} | stylist: ${r.subject ?? 'unknown'}
"${r.review_text.slice(0, 800)}"`,
      )
      .join('\n\n')

    const reply = await askMeshClaude(env, prompt, { system: SYSTEM_SCORE })
    const parsed = extractJson<Record<string, { score: number; notes?: string }>>(reply)
    if (!parsed) {
      errors.push(`score batch ${i}: unparseable bridge reply (len=${reply.length})`)
      continue
    }

    for (const r of batch) {
      const entry = parsed[r.id]
      if (!entry || typeof entry.score !== 'number') continue
      const clamped = Math.max(1, Math.min(10, Math.round(entry.score)))
      // Final lock check — race-safe in case admin locked while we were thinking.
      const result = await sql`
        UPDATE reviews
        SET quality_score = ${clamped},
            quality_scored_at = NOW(),
            editor_notes = ${entry.notes ?? null}
        WHERE id = ${r.id}
          AND NOT (admin_locked_fields ? 'quality_score')
        RETURNING id
      `
      if (result.length) scored++
    }
  }
  return scored
}

/** STEP 2 — re-check ex-staff hide using LLM. Reviews not already auto-hidden,
 * not pinned to homepage, that haven't been semantically reviewed in a week. */
async function recheckStaleStaff(sql: Sql, env: MeshBridgeBindings, errors: string[]): Promise<number> {
  // Pull active vs inactive team member names so the LLM has context.
  const members = await sql<Array<{ name: string; is_active: boolean }>>`
    SELECT name, is_active FROM team_members
  `
  const inactive = members.filter(m => !m.is_active).map(m => m.name)
  if (!inactive.length) return 0

  // Candidates: visible reviews where the FK is null (Yelp/Google text-mention case).
  // Already-FK-linked rows are handled by the deterministic FK pass; the LLM is for
  // catching mentions in free text only. Skip admin-locked.
  const rows = await sql<Pick<ReviewRow, 'id' | 'review_text' | 'reviewer_name' | 'source'>[]>`
    SELECT id, review_text, reviewer_name, source FROM reviews
    WHERE show_on_website = true
      AND hidden_reason IS NULL
      AND team_member_id IS NULL
      AND length(review_text) >= 40
      AND NOT (admin_locked_fields ? 'show_on_website')
    ORDER BY review_date DESC NULLS LAST
    LIMIT 80
  `
  if (!rows.length) return 0

  let hidden = 0
  for (let i = 0; i < rows.length; i += SCORING_BATCH_SIZE) {
    const batch = rows.slice(i, i + SCORING_BATCH_SIZE)
    const prompt = `Inactive stylists: ${inactive.join(', ')}.\n\n` + batch
      .map(r => `--- review ${r.id} ---\n"${r.review_text.slice(0, 800)}"`)
      .join('\n\n')

    const reply = await askMeshClaude(env, prompt, { system: SYSTEM_STALE })
    const parsed = extractJson<Record<string, { hide: boolean; matchedName?: string; reason?: string }>>(reply)
    if (!parsed) {
      errors.push(`stale batch ${i}: unparseable bridge reply`)
      continue
    }

    const toHide = batch
      .filter(r => parsed[r.id]?.hide === true)
      .map(r => r.id)
    if (toHide.length) {
      const result = await sql`
        UPDATE reviews
        SET show_on_website = false,
            hidden_reason = 'stale_team_member',
            updated_at = NOW()
        WHERE id = ANY(${toHide}::uuid[])
          AND NOT (admin_locked_fields ? 'show_on_website')
        RETURNING id
      `
      hidden += result.length
    }
  }
  return hidden
}

/** STEP 3 — rebuild per-stylist highlight reels (top 3 per active member). */
async function rebuildHighlights(sql: Sql, env: MeshBridgeBindings, errors: string[]): Promise<number> {
  const members = await sql<Array<{ id: string; name: string }>>`
    SELECT id, name FROM team_members WHERE is_active = true ORDER BY name
  `
  if (!members.length) return 0

  let built = 0
  for (const m of members) {
    // Candidate pool: linked + visible + reasonable length, newest first
    const rows = await sql<Pick<ReviewRow, 'id' | 'review_text' | 'rating' | 'source' | 'review_date'>[]>`
      SELECT id, review_text, rating, source, review_date FROM reviews
      WHERE team_member_id = ${m.id}
        AND show_on_website = true
        AND length(review_text) >= 60
        AND rating >= 4
      ORDER BY review_date DESC NULLS LAST
      LIMIT 25
    `
    if (rows.length === 0) continue

    let picks: Array<{ reviewId: string; rank: number; notes: string | null }> = []

    if (rows.length <= HIGHLIGHTS_PER_MEMBER) {
      // Not enough to pick from — take what we have.
      picks = rows.map((r, idx) => ({ reviewId: r.id, rank: idx + 1, notes: null }))
    } else {
      const prompt = `Stylist: ${m.name} (id: ${m.id})\n\nCandidate reviews:\n\n` + rows
        .map(r => `--- review ${r.id} ---\nrating: ${r.rating} | source: ${r.source}\n"${r.review_text.slice(0, 800)}"`)
        .join('\n\n')

      const reply = await askMeshClaude(env, prompt, { system: SYSTEM_HIGHLIGHT })
      const parsed = extractJson<Record<string, Array<{ reviewId: string; rank: number; notes?: string }>>>(reply)
      const picksRaw = parsed?.[m.id] ?? []
      const validIds = new Set(rows.map(r => r.id))
      picks = picksRaw
        .filter(p => validIds.has(p.reviewId) && [1, 2, 3].includes(p.rank))
        .slice(0, HIGHLIGHTS_PER_MEMBER)
        .map(p => ({ reviewId: p.reviewId, rank: p.rank, notes: p.notes ?? null }))

      // Fallback if LLM returned nothing usable
      if (picks.length === 0) {
        picks = rows.slice(0, HIGHLIGHTS_PER_MEMBER).map((r, idx) => ({ reviewId: r.id, rank: idx + 1, notes: null }))
      }
    }

    // Admin can pin specific reviews to a stylist's reel by setting
    // editor_notes = '__ADMIN_PINNED__' on a team_member_highlights row.
    // Pinned rows survive editor rebuilds; LLM picks fill the rest.
    const adminPinned = await sql<Array<{ id: string; review_id: string; rank: number }>>`
      SELECT id, review_id, rank
      FROM team_member_highlights
      WHERE team_member_id = ${m.id}
        AND editor_notes = '__ADMIN_PINNED__'
      ORDER BY rank ASC
    `
    const pinnedReviewIds = new Set(adminPinned.map(p => p.review_id))
    const pinnedRanks = new Set(adminPinned.map(p => p.rank))

    // Wipe only the non-pinned rows.
    await sql`
      DELETE FROM team_member_highlights
      WHERE team_member_id = ${m.id}
        AND (editor_notes IS NULL OR editor_notes <> '__ADMIN_PINNED__')
    `

    // Fill in LLM picks for slots not occupied by an admin pin, skipping
    // any reviewId already pinned and any rank already taken.
    let inserted = 0
    for (const p of picks) {
      if (pinnedReviewIds.has(p.reviewId)) continue
      if (pinnedRanks.has(p.rank)) {
        // bump to next free rank
        let r = 1
        while (pinnedRanks.has(r) && r <= 10) r++
        if (r > HIGHLIGHTS_PER_MEMBER) continue
        p.rank = r
        pinnedRanks.add(r)
      }
      try {
        await sql`
          INSERT INTO team_member_highlights (team_member_id, review_id, rank, editor_notes)
          VALUES (${m.id}, ${p.reviewId}, ${p.rank}, ${p.notes})
          ON CONFLICT DO NOTHING
        `
        inserted++
      } catch (err) {
        errors.push(`highlight insert ${m.name}/${p.rank}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    built += adminPinned.length + inserted
  }
  return built
}

export async function runEditor(
  sql: Sql,
  env: Partial<MeshBridgeBindings>,
  options: { highlightsPerMember?: number } = {},
): Promise<EditorStats> {
  const errors: string[] = []
  let scored = 0
  let hiddenByLLM = 0
  let highlightsBuilt = 0

  if (options.highlightsPerMember && options.highlightsPerMember > 0) {
    HIGHLIGHTS_PER_MEMBER = options.highlightsPerMember
  }

  // Bridge needs host/port/secret. MESH binding is optional (we fall back
  // to plain fetch when it's absent).
  if (!env.BRIDGE_HOST || !env.BRIDGE_PORT || !env.BRIDGE_SECRET) {
    return {
      scored: 0,
      hiddenByLLM: 0,
      highlightsBuilt: 0,
      errors: ['mesh-claude bridge env not set (BRIDGE_HOST/PORT/SECRET) — editor pass skipped'],
    }
  }
  const bridge = env as MeshBridgeBindings

  try {
    scored = await scoreNewReviews(sql, bridge, errors)
  } catch (err) {
    errors.push(`scoreNewReviews: ${err instanceof Error ? err.message : String(err)}`)
  }
  try {
    hiddenByLLM = await recheckStaleStaff(sql, bridge, errors)
  } catch (err) {
    errors.push(`recheckStaleStaff: ${err instanceof Error ? err.message : String(err)}`)
  }
  try {
    highlightsBuilt = await rebuildHighlights(sql, bridge, errors)
  } catch (err) {
    errors.push(`rebuildHighlights: ${err instanceof Error ? err.message : String(err)}`)
  }

  return { scored, hiddenByLLM, highlightsBuilt, errors }
}
