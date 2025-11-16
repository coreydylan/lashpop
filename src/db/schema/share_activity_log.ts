/**
 * Share Activity Log Schema
 *
 * Tracks all sharing-related actions for auditing and analytics
 */

import { pgTable, text, timestamp, uuid, jsonb, index } from 'drizzle-orm/pg-core'
import { user } from './auth_user'

export const shareActivityLog = pgTable('share_activity_log', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Resource information
  resourceType: text('resource_type').notNull(), // 'asset', 'set', 'tag_category', etc.
  resourceId: uuid('resource_id').notNull(),

  // Action details
  action: text('action').notNull(),
  // Possible values: 'share_created', 'share_revoked', 'permission_changed',
  // 'link_accessed', 'link_created', 'link_disabled', etc.

  // Actor (who performed the action)
  actorId: text('actor_id')
    .references(() => user.id, { onDelete: 'set null' }),

  // Target user (if applicable)
  targetUserId: text('target_user_id')
    .references(() => user.id, { onDelete: 'set null' }),

  // Additional metadata (flexible structure)
  metadata: jsonb('metadata'),

  // Request information for security auditing
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),

  // Timestamp
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  resourceTypeIdx: index('share_activity_log_resource_type_idx').on(table.resourceType),
  resourceIdIdx: index('share_activity_log_resource_id_idx').on(table.resourceId),
  actionIdx: index('share_activity_log_action_idx').on(table.action),
  actorIdIdx: index('share_activity_log_actor_id_idx').on(table.actorId),
  targetUserIdIdx: index('share_activity_log_target_user_id_idx').on(table.targetUserId),
  createdAtIdx: index('share_activity_log_created_at_idx').on(table.createdAt),
  resourceCompositeIdx: index('share_activity_log_resource_composite_idx').on(table.resourceType, table.resourceId)
}))

export type ShareActivityLog = typeof shareActivityLog.$inferSelect
export type NewShareActivityLog = typeof shareActivityLog.$inferInsert

/**
 * Activity Metadata Structures (stored in JSONB)
 */

export interface ShareCreatedMetadata {
  permissionLevel: string
  expiresAt?: string
}

export interface ShareRevokedMetadata {
  reason?: string
}

export interface PermissionChangedMetadata {
  oldPermission: string
  newPermission: string
}

export interface LinkAccessedMetadata {
  linkToken: string
  passwordProtected: boolean
  success: boolean
}

export interface LinkCreatedMetadata {
  linkToken: string
  permissionLevel: string
  expiresAt?: string
  maxViews?: number
  passwordProtected: boolean
}

export type ShareActivityMetadata =
  | ShareCreatedMetadata
  | ShareRevokedMetadata
  | PermissionChangedMetadata
  | LinkAccessedMetadata
  | LinkCreatedMetadata
