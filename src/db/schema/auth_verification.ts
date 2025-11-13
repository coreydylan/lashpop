/**
 * BetterAuth Verification Schema
 *
 * Stores OTP codes for phone/email verification
 */

import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(), // phone number or email
  value: text('value').notNull(), // OTP code
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export type Verification = typeof verification.$inferSelect
export type NewVerification = typeof verification.$inferInsert
