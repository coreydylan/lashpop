import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { executeDatabaseBatch, getDb } from '@/db'
import {
  NEWSLETTER_SUBSCRIBER_STATUSES,
  newsletterSubscriptions,
  type NewsletterSubscriberStatus,
} from '@/db/schema/newsletter_subscriptions'
import { requireAdminApi } from '@/lib/admin/auth'

const MAX_NOTES_LENGTH = 2_000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStatus(value: unknown): value is NewsletterSubscriberStatus {
  return typeof value === 'string' && NEWSLETTER_SUBSCRIBER_STATUSES.includes(value as NewsletterSubscriberStatus)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(['owner', 'publisher'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const payload: unknown = await request.json().catch(() => null)
  if (!isRecord(payload)) {
    return NextResponse.json({ error: 'A JSON object is required.' }, { status: 400 })
  }

  const hasStatus = Object.prototype.hasOwnProperty.call(payload, 'status')
  const hasNotes = Object.prototype.hasOwnProperty.call(payload, 'notes')
  if (!hasStatus && !hasNotes) {
    return NextResponse.json({ error: 'No subscriber changes were provided.' }, { status: 400 })
  }
  if (hasStatus && !isStatus(payload.status)) {
    return NextResponse.json({ error: 'Subscriber status is invalid.' }, { status: 400 })
  }
  if (hasNotes && payload.notes !== null && typeof payload.notes !== 'string') {
    return NextResponse.json({ error: 'Notes must be text.' }, { status: 400 })
  }

  const notes = hasNotes && typeof payload.notes === 'string' ? payload.notes.trim() : null
  if (notes && notes.length > MAX_NOTES_LENGTH) {
    return NextResponse.json({ error: `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.` }, { status: 400 })
  }

  const db = getDb()
  const [existing] = await db
    .select()
    .from(newsletterSubscriptions)
    .where(eq(newsletterSubscriptions.id, id))
    .limit(1)

  if (!existing) {
    return NextResponse.json({ error: 'Subscriber not found.' }, { status: 404 })
  }

  const now = new Date()
  const nextStatus = hasStatus ? payload.status as NewsletterSubscriberStatus : existing.status
  const nextNotes = hasNotes ? notes || null : existing.notes
  const nextUnsubscribedAt = nextStatus === 'active'
    ? null
    : nextStatus === 'unsubscribed'
      ? existing.unsubscribedAt ?? now
      : existing.unsubscribedAt
  const auditDiff = JSON.stringify({
    ...(hasStatus ? { status: { before: existing.status, after: nextStatus } } : {}),
    ...(hasNotes ? { notesChanged: existing.notes !== nextNotes } : {}),
  })

  // The consent-ledger update and its audit event are one D1 transaction. A
  // successful mutation can never exist without the corresponding activity
  // record, and note/email contents are intentionally excluded from the log.
  await executeDatabaseBatch([
    {
      sql: `UPDATE newsletter_subscriptions
            SET status = ?, notes = ?, unsubscribed_at = ?, updated_at = ?
            WHERE id = ?`,
      params: [nextStatus, nextNotes, nextUnsubscribedAt?.getTime() ?? null, now.getTime(), id],
      method: 'run',
    },
    {
      sql: `INSERT INTO admin_audit_log
              (id, actor_user_id, surface, action, target_type, target_id, diff, created_at)
            SELECT ?, ?, 'admin', 'newsletter.subscriber.update',
              'newsletter_subscription', ?, ?, ?
            WHERE changes() = 1`,
      params: [randomUUID(), auth.userId, id, auditDiff, now.getTime()],
      method: 'run',
    },
  ])

  const [updated] = await db
    .select()
    .from(newsletterSubscriptions)
    .where(eq(newsletterSubscriptions.id, id))
    .limit(1)

  return NextResponse.json({ subscriber: updated })
}
