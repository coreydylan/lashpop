/**
 * DAM User Settings Schema
 *
 * Persists user preferences for the Digital Asset Management system
 * including view modes, filters, grouping, and card display settings
 */

import { pgTable, text, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth_user'

export const damUserSettings = pgTable('dam_user_settings', {
  id: text('id').primaryKey(),

  // User reference
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Settings stored as JSONB for flexibility
  // Structure: DamUserSettings interface
  settings: jsonb('settings').notNull().default('{}'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export type DamUserSettings = typeof damUserSettings.$inferSelect
export type NewDamUserSettings = typeof damUserSettings.$inferInsert

/**
 * Settings Structure (stored in JSONB)
 */
export interface DamSettingsData {
  // View preferences
  gridViewMode: 'square' | 'aspect'
  thumbnailSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'  // Thumbnail size preference

  // Filter state
  activeFilters: Array<{
    categoryId: string
    categoryName: string
    categoryDisplayName: string
    categoryColor?: string
    optionId: string
    optionName: string
    optionDisplayName: string
    imageUrl?: string
  }>

  // Grouping preferences
  groupByCategories: string[]  // e.g., ['team', 'lash_type']

  // Card display
  visibleCardTags: string[]  // Category IDs to show on cards (empty = show all)

  // Active collection
  activeCollectionId?: string

  // Sort preferences (future)
  sortBy?: 'uploadDate' | 'fileName' | 'modified'
  sortOrder?: 'asc' | 'desc'
}
