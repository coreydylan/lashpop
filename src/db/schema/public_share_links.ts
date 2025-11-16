/**
 * Public Share Links Schema
 *
 * Manages public shareable links for resources with optional password protection
 */

import { pgTable, text, timestamp, uuid, integer, boolean, index } from 'drizzle-orm/pg-core'
import { user } from './auth_user'

export const publicShareLinks = pgTable('public_share_links', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Unique token for the share link
  token: text('token').notNull().unique(),

  // Resource information
  resourceType: text('resource_type').notNull(), // 'asset', 'set', 'tag_category', etc.
  resourceId: uuid('resource_id').notNull(),

  // Creator
  createdBy: text('created_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Permission level: 'view', 'download'
  permissionLevel: text('permission_level').notNull(),

  // Optional password protection
  passwordHash: text('password_hash'),

  // Expiration and limits
  expiresAt: timestamp('expires_at'),
  maxViews: integer('max_views'),
  viewCount: integer('view_count').notNull().default(0),

  // Status
  isActive: boolean('is_active').notNull().default(true),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastAccessedAt: timestamp('last_accessed_at')
}, (table) => ({
  tokenIdx: index('public_share_links_token_idx').on(table.token),
  resourceTypeIdx: index('public_share_links_resource_type_idx').on(table.resourceType),
  resourceIdIdx: index('public_share_links_resource_id_idx').on(table.resourceId),
  createdByIdx: index('public_share_links_created_by_idx').on(table.createdBy),
  isActiveIdx: index('public_share_links_is_active_idx').on(table.isActive),
  resourceCompositeIdx: index('public_share_links_resource_composite_idx').on(table.resourceType, table.resourceId)
}))

export type PublicShareLink = typeof publicShareLinks.$inferSelect
export type NewPublicShareLink = typeof publicShareLinks.$inferInsert
