/**
 * Suggest a team_member for an unlinked review by feeding its text to
 * mesh-claude alongside the list of active stylist names. Used by the
 * admin re-tag drawer when the FK is null.
 */
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { reviews } from '@/db/schema/reviews'
import { teamMembers } from '@/db/schema/team_members'
import { askMeshClaude } from '@/lib/mesh-claude'
import { requireAdminApi } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'

export const dynamic = 'force-dynamic'

const SYSTEM = `You are tagging a customer review with the stylist it primarily \
discusses. Choose ONE from the provided list, or "none" if the review is about \
the venue / multiple stylists / no specific stylist. \
Respond JSON: {"teamMemberId": "uuid-or-none", "confidence": 1-10, "reason": "short"}.`

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi(['owner', 'publisher'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const db = getDb()

  const [review] = await db
    .select({ reviewText: reviews.reviewText, subject: reviews.subject })
    .from(reviews)
    .where(eq(reviews.id, id))
    .limit(1)
  if (!review) return NextResponse.json({ error: 'review not found' }, { status: 404 })

  const staff = await db
    .select({ id: teamMembers.id, name: teamMembers.name })
    .from(teamMembers)
    .where(eq(teamMembers.isActive, true))
    .orderBy(teamMembers.name)

  const prompt =
    `Active stylists:\n` +
    staff.map(s => `  ${s.id}  ${s.name}`).join('\n') +
    `\n\nReview text${review.subject ? ` (Vagaro subject: "${review.subject}")` : ''}:\n` +
    `"${review.reviewText.slice(0, 1500)}"`

  const startedAt = Date.now()
  const requestSummary = {
    candidateCount: staff.length,
    reviewCharactersSent: Math.min(review.reviewText.length, 1500),
    subjectProvided: Boolean(review.subject),
  }
  const reply = await askMeshClaude(prompt, { system: SYSTEM, timeoutMs: 25_000 })
  if (!reply) {
    await recordAdminAction({
      action: 'review.stylist.suggest',
      surface: 'admin',
      targetType: 'review',
      targetId: id,
      actorUserId: auth.userId,
      diff: {
        request: requestSummary,
        outcome: { status: 'failed', reason: 'bridge_unreachable', durationMs: Date.now() - startedAt },
      },
    })
    return NextResponse.json({ error: 'mesh-claude bridge unreachable' }, { status: 502 })
  }
  const match = reply.match(/\{[\s\S]*\}/)
  if (!match) {
    await recordAdminAction({
      action: 'review.stylist.suggest',
      surface: 'admin',
      targetType: 'review',
      targetId: id,
      actorUserId: auth.userId,
      diff: {
        request: requestSummary,
        outcome: { status: 'failed', reason: 'unparseable_reply', durationMs: Date.now() - startedAt },
      },
    })
    return NextResponse.json({ error: 'unparseable bridge reply', raw: reply.slice(0, 300) }, { status: 502 })
  }
  let parsed: { teamMemberId?: string; confidence?: number; reason?: string }
  try {
    parsed = JSON.parse(match[0])
  } catch {
    await recordAdminAction({
      action: 'review.stylist.suggest',
      surface: 'admin',
      targetType: 'review',
      targetId: id,
      actorUserId: auth.userId,
      diff: {
        request: requestSummary,
        outcome: { status: 'failed', reason: 'invalid_json', durationMs: Date.now() - startedAt },
      },
    })
    return NextResponse.json({ error: 'json parse failed', raw: match[0].slice(0, 300) }, { status: 502 })
  }

  const validIds = new Set(staff.map(s => s.id))
  const teamMemberId =
    parsed.teamMemberId && validIds.has(parsed.teamMemberId) ? parsed.teamMemberId : null
  await recordAdminAction({
    action: 'review.stylist.suggest',
    surface: 'admin',
    targetType: 'review',
    targetId: id,
    actorUserId: auth.userId,
    diff: {
      request: requestSummary,
      outcome: {
        status: 'completed',
        teamMemberId,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : null,
        reasonProvided: typeof parsed.reason === 'string' && parsed.reason.length > 0,
        durationMs: Date.now() - startedAt,
      },
    },
  })
  return NextResponse.json({
    teamMemberId,
    teamMemberName: teamMemberId ? staff.find(s => s.id === teamMemberId)?.name : null,
    confidence: parsed.confidence ?? null,
    reason: parsed.reason ?? null,
  })
}
