/**
 * Per-stylist highlight reel admin endpoint.
 *
 *   GET    → current 3 reels + candidate pool
 *   PUT    → replace the reels (array of { reviewId, rank }) — all marked as
 *            __ADMIN_PINNED__ in editor_notes so the editor doesn't overwrite
 *   DELETE → remove all pins for this stylist; editor takes over next pass
 */
import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, gte, isNotNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { reviews } from '@/db/schema/reviews'
import { teamMemberHighlights } from '@/db/schema/team_member_highlights'
import { teamMembers } from '@/db/schema/team_members'
import { requireAdminApi } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'

export const dynamic = 'force-dynamic'

const ADMIN_PIN_MARKER = '__ADMIN_PINNED__'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const db = getDb()

  const [member] = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.id, id))
    .limit(1)
  if (!member) return NextResponse.json({ error: 'team member not found' }, { status: 404 })

  const currentHighlights = await db
    .select({
      id: teamMemberHighlights.id,
      reviewId: teamMemberHighlights.reviewId,
      rank: teamMemberHighlights.rank,
      editorNotes: teamMemberHighlights.editorNotes,
      review: {
        id: reviews.id,
        reviewerName: reviews.reviewerName,
        reviewText: reviews.reviewText,
        rating: reviews.rating,
        source: reviews.source,
        reviewDate: reviews.reviewDate,
        qualityScore: reviews.qualityScore,
      },
    })
    .from(teamMemberHighlights)
    .leftJoin(reviews, eq(reviews.id, teamMemberHighlights.reviewId))
    .where(eq(teamMemberHighlights.teamMemberId, id))
    .orderBy(teamMemberHighlights.rank)

  // Candidate pool: linked, visible, rating>=4, decent length, newest 30
  const candidates = await db
    .select({
      id: reviews.id,
      reviewerName: reviews.reviewerName,
      reviewText: reviews.reviewText,
      rating: reviews.rating,
      source: reviews.source,
      reviewDate: reviews.reviewDate,
      qualityScore: reviews.qualityScore,
    })
    .from(reviews)
    .where(
      and(
        eq(reviews.teamMemberId, id),
        eq(reviews.showOnWebsite, true),
        gte(reviews.rating, 4),
        sql`length(${reviews.reviewText}) >= 60`,
      ),
    )
    .orderBy(desc(reviews.qualityScore), desc(reviews.reviewDate))
    .limit(30)

  return NextResponse.json({
    teamMember: { id: member.id, name: member.name },
    highlights: currentHighlights,
    candidates,
  })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi(['owner', 'publisher'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const body = (await req.json()) as { reels: Array<{ reviewId: string; rank: number }> }
  const reels = Array.isArray(body.reels) ? body.reels.slice(0, 10) : []

  // Validate: every reviewId must be linked to this team member.
  if (reels.length > 0) {
    const reviewIds = reels.map(r => r.reviewId)
    const linked = await getDb()
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.teamMemberId, id), isNotNull(reviews.id)))
    const linkedIds = new Set(linked.map(r => r.id))
    const invalid = reviewIds.filter(rid => !linkedIds.has(rid))
    if (invalid.length) {
      return NextResponse.json(
        { error: `review(s) not linked to this stylist: ${invalid.join(', ')}` },
        { status: 400 },
      )
    }
  }

  const db = getDb()
  const before = await db
    .select({ reviewId: teamMemberHighlights.reviewId, rank: teamMemberHighlights.rank })
    .from(teamMemberHighlights)
    .where(eq(teamMemberHighlights.teamMemberId, id))
    .orderBy(teamMemberHighlights.rank)
  await db.delete(teamMemberHighlights).where(eq(teamMemberHighlights.teamMemberId, id))
  if (reels.length > 0) {
    await db.insert(teamMemberHighlights).values(
      reels.map(r => ({
        teamMemberId: id,
        reviewId: r.reviewId,
        rank: r.rank,
        editorNotes: ADMIN_PIN_MARKER,
      })),
    )
  }

  await recordAdminAction({
    action: 'team.highlights.update',
    targetType: 'team_member',
    targetId: id,
    actorUserId: auth.userId,
    diff: { before, after: reels },
  })

  return NextResponse.json({ success: true, count: reels.length })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi(['owner', 'publisher'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const db = getDb()
  const before = await db
    .delete(teamMemberHighlights)
    .where(eq(teamMemberHighlights.teamMemberId, id))
    .returning({ reviewId: teamMemberHighlights.reviewId, rank: teamMemberHighlights.rank })
  await recordAdminAction({
    action: 'team.highlights.clear',
    targetType: 'team_member',
    targetId: id,
    actorUserId: auth.userId,
    diff: { before, after: [] },
  })
  return NextResponse.json({ success: true, note: 'pins cleared — editor will rebuild on next pass' })
}
