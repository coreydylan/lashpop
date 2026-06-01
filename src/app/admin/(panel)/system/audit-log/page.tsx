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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sage/30 to-sage/10 flex items-center justify-center">
          <ScrollText className="w-6 h-6 text-sage" />
        </div>
        <div>
          <h1 className="h2 text-dune">Activity Log</h1>
          <p className="text-sm text-dune/60">Recent admin changes (latest {entries.length})</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="glass rounded-3xl border border-sage/20 p-12 text-center">
          <ScrollText className="w-12 h-12 text-dune/20 mx-auto mb-4" />
          <p className="text-dune/60">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="glass rounded-3xl border border-sage/20 divide-y divide-sage/10">
          {entries.map((e) => (
            <div key={e.id} className="px-5 py-3 flex items-start gap-3 hover:bg-cream/40 transition-colors">
              <span className={`mt-0.5 px-2 py-0.5 text-[11px] rounded-full border shrink-0 ${SURFACE_STYLES[e.surface] ?? 'bg-sage/10 text-dune/60 border-sage/20'}`}>
                {e.surface}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-dune">
                  <span className="font-mono text-[13px] text-dune/80">{e.action}</span>
                  {e.targetType && (
                    <span className="text-dune/50"> · {e.targetType}{e.targetId ? ` (${e.targetId})` : ''}</span>
                  )}
                </div>
                <div className="text-xs text-dune/50">
                  {e.actorName || e.actorPhone || 'system'} · {formatWhen(e.createdAt)}
                  {e.notes ? ` · ${e.notes}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
