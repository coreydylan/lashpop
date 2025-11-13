/**
 * BetterAuth User Schema
 *
 * Core authentication table managed by BetterAuth
 */

import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),

  // Phone authentication (primary)
  phoneNumber: text('phone_number').unique(),
  phoneNumberVerified: boolean('phone_number_verified').default(false),

  // Email (optional, added later)
  email: text('email').unique(),
  emailVerified: boolean('email_verified').default(false),

  // Basic info
  name: text('name'),
  image: text('image'),

  // DAM Access Control
  damAccess: boolean('dam_access').default(false),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
