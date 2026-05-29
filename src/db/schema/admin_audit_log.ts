/**
 * Admin Audit Log
 *
 * Records every write performed via any admin surface (`/admin/*` and `/dam/*`).
 * Complements `dam_user_actions`, which is DAM-specific and includes
 * non-write events like filter changes — this table is strictly for
 * persistent writes that change site state.
 *
 * `action` is a dotted namespace: `studio.update`, `hero.preset.create`,
 * `team.member.update`, `reviews.pin`, etc. Keep these stable — they show
 * up in the activity log UI and any future filter/search.
 */

import { pgTable, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { user } from './auth_user'

export const adminAuditLog = pgTable('admin_audit_log', {
  id: text('id').primaryKey(),

  // Who did it. NULL if the actor was a system process (cron, webhook).
  actorUserId: text('actor_user_id').references(() => user.id, { onDelete: 'set null' }),

  // Where it came from. 'admin' for /admin/*, 'dam' for /dam/*, 'system' for
  // crons/webhooks/workers writing on the studio's behalf.
  surface: text('surface').notNull(),

  // What was done. Dotted namespace, e.g. 'studio.update', 'reviews.pin'.
  action: text('action').notNull(),

  // What was affected. `targetType` is the table or logical entity
  // ('website_settings', 'team_member', 'review'); `targetId` is the row id
  // or a synthetic identifier (e.g. the `section` of a website_settings row).
  targetType: text('target_type'),
  targetId: text('target_id'),

  // Optional before/after diff. Schema is loose so each action type can
  // record what's most useful — fields changed, ids added/removed, etc.
  diff: jsonb('diff'),

  // Free-form context for the action (e.g. user-supplied note on a manual
  // override, or the http request id for tracing).
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  actorIdx: index('admin_audit_log_actor_idx').on(table.actorUserId),
  surfaceIdx: index('admin_audit_log_surface_idx').on(table.surface),
  actionIdx: index('admin_audit_log_action_idx').on(table.action),
  targetIdx: index('admin_audit_log_target_idx').on(table.targetType, table.targetId),
  createdAtIdx: index('admin_audit_log_created_at_idx').on(table.createdAt),
}))

export type AdminAuditLogEntry = typeof adminAuditLog.$inferSelect
export type NewAdminAuditLogEntry = typeof adminAuditLog.$inferInsert

export type AdminAuditSurface = 'admin' | 'dam' | 'system' | 'inline'
