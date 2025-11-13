/**
 * User Profiles Schema
 *
 * Extended user profile with preferences, lash history, and loyalty data
 */

import { pgTable, uuid, text, date, boolean, integer, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth_user'
import { businessLocations } from './business_locations'
import { teamMembers } from './team_members'

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Contact info (progressive enrichment)
  firstName: text('first_name'),
  lastName: text('last_name'),
  dateOfBirth: date('date_of_birth'),

  // Marketing preferences
  smsMarketingOptIn: boolean('sms_marketing_opt_in').default(false),
  emailMarketingOptIn: boolean('email_marketing_opt_in').default(false),

  // Preferences
  preferredLocationId: uuid('preferred_location_id').references(() => businessLocations.id),
  preferredTeamMemberId: uuid('preferred_team_member_id').references(() => teamMembers.id),

  // Lash history & preferences
  lashType: text('lash_type'), // classic, hybrid, volume, mega
  lashCurl: text('lash_curl'), // C, D, L, etc.
  lashLength: text('lash_length'), // 9mm, 10mm, etc.
  allergies: text('allergies'),
  notes: text('notes'),

  // Loyalty/tier
  loyaltyPoints: integer('loyalty_points').default(0),
  tier: text('tier').default('standard'), // standard, vip, elite

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  onboardingCompleted: boolean('onboarding_completed').default(false),
  profileCompletionPercentage: integer('profile_completion_percentage').default(0)
})

export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
