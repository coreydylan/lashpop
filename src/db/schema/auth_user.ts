/**
 * BetterAuth User Schema
 *
 * Core authentication table managed by BetterAuth
 */

import { pgTable, pgEnum, text, boolean, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core'
import { teamMembers } from './team_members'

export const userRole = pgEnum('user_role', ['super_admin', 'admin', 'editor', 'viewer'])

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

  // DAM Access Control (Legacy - kept for backward compatibility)
  damAccess: boolean('dam_access').default(false),

  // Staff Permissions System
  role: userRole('role').default('viewer'),
  permissions: jsonb('permissions').default('{}').notNull().$type<Record<string, any>>(),
  teamMemberId: uuid('team_member_id').references(() => teamMembers.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').default(true).notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
