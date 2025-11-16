/**
 * Permission Audit Log Schema
 *
 * Tracks all changes to user permissions and roles for compliance and debugging
 */

import { pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { user } from './auth_user'

export const permissionAudit = pgTable('permission_audit', {
  id: serial('id').primaryKey(),

  // Who was affected by this change
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Who made this change (admin/super_admin)
  changedBy: text('changed_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Type of action performed
  action: text('action').notNull(), // e.g., 'role_changed', 'permission_granted', 'permission_revoked', 'user_activated', 'user_deactivated'

  // Change details
  oldValue: jsonb('old_value').$type<Record<string, any>>(),
  newValue: jsonb('new_value').$type<Record<string, any>>(),

  // Optional explanation for the change
  reason: text('reason'),

  // When the change occurred
  timestamp: timestamp('timestamp').defaultNow().notNull()
})

export type PermissionAudit = typeof permissionAudit.$inferSelect
export type NewPermissionAudit = typeof permissionAudit.$inferInsert
