/**
 * Friend Booking Requests Schema
 *
 * Manages appointment bookings made on behalf of friends with consent flow
 */

import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { user } from './auth_user'
import { services } from './services'
import { teamMembers } from './team_members'
import { appointments } from './appointments'

export const friendBookingRequests = pgTable('friend_booking_requests', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Requester (who's making the booking)
  requesterUserId: text('requester_user_id')
    .notNull()
    .references(() => user.id),
  requesterPhone: text('requester_phone').notNull(),

  // Friend (who the booking is for)
  friendPhone: text('friend_phone').notNull(),
  friendUserId: text('friend_user_id').references(() => user.id), // NULL if not yet a user
  friendName: text('friend_name'), // Optional name provided by requester

  // Appointment details
  serviceId: uuid('service_id').references(() => services.id),
  teamMemberId: uuid('team_member_id').references(() => teamMembers.id),
  requestedDateTime: timestamp('requested_date_time'),

  // Request state
  status: text('status').default('pending'), // pending, accepted, declined, expired
  consentToken: text('consent_token').unique().notNull(),
  consentTokenExpiresAt: timestamp('consent_token_expires_at').notNull(),

  // Response tracking
  consentedAt: timestamp('consented_at'),
  declinedAt: timestamp('declined_at'),
  declinedReason: text('declined_reason'),

  // If accepted, link to created appointment
  appointmentId: uuid('appointment_id').references(() => appointments.id),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export type FriendBookingRequest = typeof friendBookingRequests.$inferSelect
export type NewFriendBookingRequest = typeof friendBookingRequests.$inferInsert
