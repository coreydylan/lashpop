/**
 * User Roles Schema
 *
 * Defines user roles for permission-based access control
 */

import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core'
import { user } from './auth_user'

export const userRoles = pgTable('user_roles', {
  id: uuid('id').defaultRandom().primaryKey(),

  // User reference
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Role type: 'admin', 'editor', 'viewer', etc.
  role: text('role').notNull(),

  // Timestamp
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('user_roles_user_id_idx').on(table.userId),
  roleIdx: index('user_roles_role_idx').on(table.role)
}))

export type UserRole = typeof userRoles.$inferSelect
export type NewUserRole = typeof userRoles.$inferInsert
