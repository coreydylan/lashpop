/**
 * BetterAuth Session Schema
 *
 * Manages user sessions
 */

import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth_user'

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export type Session = typeof session.$inferSelect
export type NewSession = typeof session.$inferInsert
