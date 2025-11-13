/**
 * Vagaro Sync Mappings Schema
 *
 * Links LashPop users to Vagaro customers for bidirectional sync
 */

import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth_user'
import { profiles } from './profiles'

export const vagaroSyncMappings = pgTable('vagaro_sync_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),

  // LashPop side
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }),

  // Vagaro side
  vagaroCustomerId: text('vagaro_customer_id').unique().notNull(),
  vagaroBusinessIds: text('vagaro_business_ids').array().default([]),

  // Sync metadata
  syncStatus: text('sync_status').default('active'), // active, pending, failed
  lastSyncedAt: timestamp('last_synced_at'),
  syncDirection: text('sync_direction').default('bidirectional'), // bidirectional, lashpop_to_vagaro, vagaro_to_lashpop

  // Conflict resolution
  conflictResolutionStrategy: text('conflict_resolution_strategy').default('vagaro_wins'), // vagaro_wins, lashpop_wins, manual
  lastConflictAt: timestamp('last_conflict_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export type VagaroSyncMapping = typeof vagaroSyncMappings.$inferSelect
export type NewVagaroSyncMapping = typeof vagaroSyncMappings.$inferInsert
