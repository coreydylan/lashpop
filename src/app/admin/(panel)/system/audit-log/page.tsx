import { ScrollText } from 'lucide-react'
import { desc, eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin/auth'
import { getDb } from '@/db'
import { adminAuditLog } from '@/db/schema/admin_audit_log'
import { user as userSchema } from '@/db/schema/auth_user'

export const dynamic = 'force-dynamic'

const SURFACE_STYLES: Record<string, string> = {
  admin: 'bg-ocean-mist/15 text-ocean-mist border-ocean-mist/30',
  dam: 'bg-dusty-rose/15 text-dusty-rose border-dusty-rose/30',
  system: 'bg-sage/15 text-sage border-sage/30',
}

function formatWhen(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default async function AuditLogPage() {
  await requireAdmin()

  const db = getDb()
  const entries = await db
    .select({
      id: adminAuditLog.id,
      surface: adminAuditLog.surface,
      action: adminAuditLog.action,
      targetType: adminAuditLog.targetType,
      targetId: adminAuditLog.targetId,
      notes: adminAuditLog.notes,
      createdAt: adminAuditLog.createdAt,
      actorName: userSchema.name,
      actorPhone: userSchema.phoneNumber,
    })
    .from(adminAuditLog)
    .leftJoin(userSchema, eq(adminAuditLog.actorUserId, userSchema.id))
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(200)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="border-b border-black/10 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">Settings</p>
        <h1 className="mt-2 flex items-center gap-3 font-serif text-3xl text-[#292a27] sm:text-4xl">
          <ScrollText className="size-7 text-[#9f4c33]" aria-hidden="true" /> Activity history
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60">
          The latest {entries.length} persistent admin and media changes, with the operator and affected record.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-black/10 bg-white p-12 text-center">
          <ScrollText className="mx-auto mb-4 size-10 text-black/20" />
          <p className="text-sm text-black/50">No persistent changes have been recorded yet.</p>
        </div>
      ) : (
        <ol className="overflow-hidden rounded-xl border border-black/10 bg-white divide-y divide-black/10">
          {entries.map((e) => (
            <li key={e.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-start">
              <span className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SURFACE_STYLES[e.surface] ?? 'bg-black/[0.03] text-black/55 border-black/10'}`}>
                {e.surface}
              </span>
              <div className="min-w-0">
                <div className="text-sm text-[#292a27]">
                  <span className="font-mono text-[13px] text-[#9f4c33]">{e.action}</span>
                  {e.targetType && (
                    <span className="text-black/45"> · {e.targetType}{e.targetId ? ` (${e.targetId})` : ''}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-black/45">{e.actorName || e.actorPhone || 'system'}{e.notes ? ` · ${e.notes}` : ''}</p>
              </div>
              <time className="text-xs text-black/35">{formatWhen(e.createdAt)}</time>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
