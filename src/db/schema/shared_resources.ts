/**
 * Shared Resources Schema
 *
 * Manages sharing permissions for resources between users
 */

import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core'
import { user } from './auth_user'

export const sharedResources = pgTable('shared_resources', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Resource information
  resourceType: text('resource_type').notNull(), // 'asset', 'set', 'tag_category', etc.
  resourceId: uuid('resource_id').notNull(),

  // Ownership and sharing
  ownerId: text('owner_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  sharedWithUserId: text('shared_with_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Permission level: 'view', 'edit', 'admin'
  permissionLevel: text('permission_level').notNull(),

  // Who created this share
  createdBy: text('created_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Optional expiration
  expiresAt: timestamp('expires_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  resourceTypeIdx: index('shared_resources_resource_type_idx').on(table.resourceType),
  resourceIdIdx: index('shared_resources_resource_id_idx').on(table.resourceId),
  ownerIdIdx: index('shared_resources_owner_id_idx').on(table.ownerId),
  sharedWithUserIdIdx: index('shared_resources_shared_with_user_id_idx').on(table.sharedWithUserId),
  resourceCompositeIdx: index('shared_resources_resource_composite_idx').on(table.resourceType, table.resourceId)
}))

export type SharedResource = typeof sharedResources.$inferSelect
export type NewSharedResource = typeof sharedResources.$inferInsert
