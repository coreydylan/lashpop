/**
 * Re-score a single review with mesh-claude on demand. Writes
 * quality_score + editor_notes. Respects admin lock — if the column is
 * locked, returns 409 without touching the DB.
 */
import { NextResponse } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { reviews } from '@/db/schema/reviews'
import { askMeshClaude } from '@/lib/mesh-claude'
import { requireAdminApi } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

const SYSTEM = `You are the editor of the LashPop Studios homepage review carousel. \
Score this review 1-10 for suitability as a homepage social-proof card. \
10 = specific story with named service or stylist, vivid detail, authentic voice. \
1 = generic praise, off-topic, or could apply to any business. \
Respond JSON: {"score": int 1-10, "notes": short string}.`

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const db = getDb()

  const [review] = await db
    .select({
      reviewerName: reviews.reviewerName,
      reviewText: reviews.reviewText,
      rating: reviews.rating,
      source: reviews.source,
      subject: reviews.subject,
      adminLockedFields: reviews.adminLockedFields,
    })
    .from(reviews)
    .where(eq(reviews.id, id))
    .limit(1)

  if (!review) return NextResponse.json({ error: 'review not found' }, { status: 404 })
  if (review.adminLockedFields?.includes('quality_score')) {
    return NextResponse.json(
      { error: 'quality_score is admin-locked; unlock first to allow rescoring' },
      { status: 409 },
    )
  }

  const prompt = `source: ${review.source} | rating: ${review.rating} | stylist: ${review.subject ?? 'unknown'}\n\n"${review.reviewText.slice(0, 1500)}"`
  const reply = await askMeshClaude(prompt, { system: SYSTEM, timeoutMs: 25_000 })
  if (!reply) {
    return NextResponse.json({ error: 'mesh-claude bridge unreachable' }, { status: 502 })
  }
  const match = reply.match(/\{[\s\S]*\}/)
  if (!match) {
    return NextResponse.json({ error: 'unparseable bridge reply', raw: reply.slice(0, 300) }, { status: 502 })
  }
  let parsed: { score?: number; notes?: string }
  try {
    parsed = JSON.parse(match[0])
  } catch {
    return NextResponse.json({ error: 'json parse failed' }, { status: 502 })
  }
  if (typeof parsed.score !== 'number') {
    return NextResponse.json({ error: 'no score in reply' }, { status: 502 })
  }
  const clamped = Math.max(1, Math.min(10, Math.round(parsed.score)))

  await db
    .update(reviews)
    .set({
      qualityScore: clamped,
      qualityScoredAt: new Date(),
      editorNotes: parsed.notes ?? null,
      updatedAt: new Date(),
    })
    .where(and(
      eq(reviews.id, id),
      sql`NOT EXISTS (
        SELECT 1
        FROM json_each(COALESCE(${reviews.adminLockedFields}, '[]'))
        WHERE value = 'quality_score'
      )`,
    ))

  return NextResponse.json({ score: clamped, notes: parsed.notes ?? null })
}
