/**
 * DAM User Actions Schema
 *
 * Tracks user interactions within the Digital Asset Management system
 * for analytics, auditing, and behavior analysis
 */

import { pgTable, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { user } from './auth_user'

export const damUserActions = pgTable('dam_user_actions', {
  id: text('id').primaryKey(),

  // User reference
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Action type
  actionType: text('action_type').notNull(),
  // Possible values: 'upload', 'tag_add', 'tag_remove', 'delete', 'filter_change',
  // 'search', 'collection_create', 'collection_add', 'view_change', 'group_change', etc.

  // Action data (flexible structure based on action type)
  actionData: jsonb('action_data'),

  // Timestamp
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('dam_user_actions_user_id_idx').on(table.userId),
  actionTypeIdx: index('dam_user_actions_action_type_idx').on(table.actionType),
  createdAtIdx: index('dam_user_actions_created_at_idx').on(table.createdAt)
}))

export type DamUserAction = typeof damUserActions.$inferSelect
export type NewDamUserAction = typeof damUserActions.$inferInsert

/**
 * Action Data Structures (stored in JSONB)
 */

export interface UploadActionData {
  assetIds: string[]
  fileCount: number
  totalSize: number
}

export interface TagActionData {
  assetIds: string[]
  tagId: string
  tagName: string
  categoryId: string
  categoryName: string
}

export interface DeleteActionData {
  assetIds: string[]
  fileNames: string[]
}

export interface FilterActionData {
  filters: Array<{
    categoryId: string
    categoryName: string
    optionId: string
    optionName: string
  }>
}

export interface SearchActionData {
  query: string
  resultCount: number
}

export interface CollectionActionData {
  collectionId: string
  collectionName: string
  assetIds?: string[]
}

export interface ViewChangeActionData {
  viewMode: 'square' | 'aspect' | 'masonry'
}

export interface GroupChangeActionData {
  groupBy: string[]
}

export type DamActionData =
  | UploadActionData
  | TagActionData
  | DeleteActionData
  | FilterActionData
  | SearchActionData
  | CollectionActionData
  | ViewChangeActionData
  | GroupChangeActionData
