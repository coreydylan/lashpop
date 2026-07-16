/**
 * Per-review admin override endpoint.
 *
 * PATCH body fields are all optional. Any field that comes through is
 * pushed into reviews.admin_locked_fields so the AI editor stops touching it.
 *
 *   { qualityScore?, teamMemberId?, showOnWebsite?, hiddenReason?,
 *     editorNotes?, unlock?: ["quality_score","team_member_id",...] }
 *
 *   unlock removes column names from admin_locked_fields so the editor
 *   takes over again on the next pass.
 */
import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { reviews } from '@/db/schema/reviews'
import { requireAdminApi } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'

export const dynamic = 'force-dynamic'

interface PatchBody {
  qualityScore?: number | null
  teamMemberId?: string | null
  showOnWebsite?: boolean
  hiddenReason?: string | null
  editorNotes?: string | null
  unlock?: string[]
}

const LOCKABLE_COLUMNS = new Set([
  'quality_score',
  'team_member_id',
  'show_on_website',
  'editor_notes',
])

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi(['owner', 'publisher'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const body = (await req.json()) as PatchBody

  const setClauses: Record<string, unknown> = { updatedAt: new Date() }
  const lockColumns = new Set<string>()

  if (body.qualityScore !== undefined) {
    if (body.qualityScore === null) {
      setClauses.qualityScore = null
      setClauses.qualityScoredAt = null
    } else {
      const n = Math.max(1, Math.min(10, Math.round(body.qualityScore)))
      setClauses.qualityScore = n
      setClauses.qualityScoredAt = new Date()
    }
    lockColumns.add('quality_score')
  }
  if (body.teamMemberId !== undefined) {
    setClauses.teamMemberId = body.teamMemberId
    lockColumns.add('team_member_id')
  }
  if (body.showOnWebsite !== undefined) {
    setClauses.showOnWebsite = body.showOnWebsite
    // When admin un-hides, clear any auto-set hidden_reason
    if (body.showOnWebsite) setClauses.hiddenReason = null
    lockColumns.add('show_on_website')
  }
  if (body.hiddenReason !== undefined) {
    setClauses.hiddenReason = body.hiddenReason
    lockColumns.add('show_on_website')
  }
  if (body.editorNotes !== undefined) {
    setClauses.editorNotes = body.editorNotes
    lockColumns.add('editor_notes')
  }

  const db = getDb()
  const [before] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1)
  if (!before) return NextResponse.json({ error: 'review not found' }, { status: 404 })

  // Update locks in application code so the query works identically on D1.
  if (lockColumns.size > 0 || (body.unlock && body.unlock.length > 0)) {
    const unlockArr = (body.unlock ?? []).filter(c => LOCKABLE_COLUMNS.has(c))
    const addArr = Array.from(lockColumns).filter(c => LOCKABLE_COLUMNS.has(c))
    const [existing] = await db
      .select({ adminLockedFields: reviews.adminLockedFields })
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1)
    const merged = new Set(existing?.adminLockedFields ?? [])
    for (const column of addArr) merged.add(column)
    for (const column of unlockArr) merged.delete(column)
    setClauses.adminLockedFields = Array.from(merged)
  }

  const result = await db
    .update(reviews)
    .set(setClauses)
    .where(eq(reviews.id, id))
    .returning({ id: reviews.id })

  if (result.length === 0) {
    return NextResponse.json({ error: 'review not found' }, { status: 404 })
  }

  const [after] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1)
  await recordAdminAction({
    action: 'review.override.update',
    targetType: 'review',
    targetId: id,
    actorUserId: auth.userId,
    diff: { before, after, requestedFields: Object.keys(body) },
  })
  return NextResponse.json({ success: true, id })
}
