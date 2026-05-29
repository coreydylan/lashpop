import { NextRequest, NextResponse } from 'next/server'
import { desc, eq, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { adminAuditLog } from '@/db/schema/admin_audit_log'
import { websiteSettings } from '@/db/schema/website_settings'
import { user as userSchema } from '@/db/schema/auth_user'
import { requireAdminApi } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

/** Friendly labels for the history list (dotted action → human text). */
const ACTION_LABELS: Record<string, string> = {
  'founder-letter.update': 'Founder letter',
  'hero-copy.update': 'Hero copy',
  'team-intro.update': 'Team intro',
  'footer-content.update': 'Footer',
  'navigation.update': 'Navigation',
  'studio.update': 'Studio info',
  'seo.update': 'SEO',
  'content.restore': 'Restored a version',
}

/**
 * GET — recent restorable changes (website_settings sections, which store a full
 * before/after in the audit log). Powers the chrome's History panel.
 */
export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  const db = getDb()
  const rows = await db
    .select({
      id: adminAuditLog.id,
      action: adminAuditLog.action,
      targetType: adminAuditLog.targetType,
      targetId: adminAuditLog.targetId,
      diff: adminAuditLog.diff,
      createdAt: adminAuditLog.createdAt,
      actorName: userSchema.name,
    })
    .from(adminAuditLog)
    .leftJoin(userSchema, eq(userSchema.id, adminAuditLog.actorUserId))
    .where(eq(adminAuditLog.targetType, 'website_settings'))
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(40)

  const entries = rows
    .filter(r => r.diff && (r.diff as Record<string, unknown>).before !== undefined)
    .map(r => ({
      id: r.id,
      label: ACTION_LABELS[r.action] ?? r.action.replace(/\.update$/, ''),
      section: r.targetId,
      actorName: r.actorName ?? null,
      createdAt: r.createdAt,
    }))

  return NextResponse.json({ entries })
}

/**
 * POST — restore a website_settings section to the `before` snapshot captured in
 * an audit entry (one-click rollback). Records the restore as its own audit event.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  let id: string
  try {
    id = (await req.json())?.id
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const db = getDb()
  const [entry] = await db.select().from(adminAuditLog).where(eq(adminAuditLog.id, id)).limit(1)
  if (!entry) return NextResponse.json({ error: 'History entry not found' }, { status: 404 })
  if (entry.targetType !== 'website_settings' || !entry.targetId) {
    return NextResponse.json({ error: 'This change can’t be rolled back' }, { status: 400 })
  }
  const before = (entry.diff as Record<string, unknown> | null)?.before
  if (before === undefined) {
    return NextResponse.json({ error: 'No prior version recorded for this change' }, { status: 400 })
  }

  await db
    .insert(websiteSettings)
    .values({ section: entry.targetId, config: before as Record<string, unknown> })
    .onConflictDoUpdate({
      target: websiteSettings.section,
      set: { config: before as Record<string, unknown>, updatedAt: sql`now()` },
    })

  await recordAdminAction({
    action: 'content.restore',
    surface: 'inline',
    targetType: 'website_settings',
    targetId: entry.targetId,
    diff: { restoredFromAuditId: id, after: before },
  })

  revalidatePath('/', 'page')
  return NextResponse.json({ ok: true })
}
