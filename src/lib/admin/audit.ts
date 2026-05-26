import { randomUUID } from 'crypto'
import { getDb } from '@/db'
import { adminAuditLog, type AdminAuditSurface } from '@/db/schema/admin_audit_log'
import { getAdminSession } from '@/lib/admin/auth'

export interface RecordAdminActionInput {
  /** Dotted namespace, e.g. 'studio.update', 'reviews.pin', 'hero.preset.create'. */
  action: string
  /** Where the write came from. Defaults to 'admin'. */
  surface?: AdminAuditSurface
  /** Table or logical entity affected. */
  targetType?: string
  /** Row id (or synthetic identifier — e.g. the `section` of a website_settings row). */
  targetId?: string
  /** Optional before/after diff or arbitrary structured context. */
  diff?: unknown
  /** Optional free-form note. */
  notes?: string
  /** Override the actor (e.g. for system writes performed on a user's behalf). */
  actorUserId?: string | null
}

/**
 * Record an admin action. Best-effort: failures are logged but don't throw,
 * so write paths can't be broken by audit-log issues.
 *
 * Pulls the actor from the current admin session unless `actorUserId` is
 * passed explicitly.
 */
export async function recordAdminAction(input: RecordAdminActionInput): Promise<void> {
  try {
    let actor: string | null = null
    if (input.actorUserId !== undefined) {
      actor = input.actorUserId
    } else {
      const sess = await getAdminSession()
      actor = sess?.userId ?? null
    }

    const db = getDb()
    await db.insert(adminAuditLog).values({
      id: randomUUID(),
      actorUserId: actor,
      surface: input.surface ?? 'admin',
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      diff: input.diff as Record<string, unknown> | null,
      notes: input.notes,
    })
  } catch (err) {
    // Audit failures should never break the write that triggered them.
    console.error('[admin-audit] failed to record action', input.action, err)
  }
}
