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
  // ========================================
  // EXISTING FIELDS
  // ========================================

  // View preferences
  gridViewMode: 'square' | 'aspect'

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

  // Sort preferences
  sortBy?: 'uploadDate' | 'fileName' | 'modified' | 'fileSize'
  sortOrder?: 'asc' | 'desc'

  // ========================================
  // COMMAND PALETTE INTELLIGENCE
  // ========================================
  commandPalette?: {
    // Manual favorites (pinned commands)
    favorites: string[]  // Command IDs

    // Hidden commands
    hidden: string[]  // Command IDs

    // Usage tracking
    commandUsage: Record<string, {
      count: number
      lastUsed: string  // ISO timestamp
      avgTimeToSelect: number  // milliseconds
      timeOfDayPattern: Record<string, number>  // hour → count
      dayOfWeekPattern: Record<string, number>  // day → count
    }>

    // Co-occurrence tracking (commands used together)
    commandPairs: Record<string, {
      followedBy: Record<string, number>  // commandId → count
      precededBy: Record<string, number>  // commandId → count
    }>

    // Group preferences
    collapsedGroups: string[]  // Groups that start collapsed
    groupOrder: string[]  // Custom group ordering
    hiddenGroups: string[]  // Completely hidden groups

    // Display preferences
    showFrequentlyUsed: boolean  // Show "Frequently Used" section
    frequentlyUsedLimit: number  // How many to show (default 5)
    groupByUsage: boolean  // Auto-organize by frequency
    showSuggestions: boolean  // Show context-aware suggestions
    suggestionCount: number  // How many suggestions (default 3)

    // Autocomplete preferences
    enableAutocomplete: boolean  // Enable guided autocomplete
    showPreviews: boolean  // Show command effect previews
    autoExecuteSimpleCommands: boolean  // Auto-execute single-step commands

    // NLP preferences
    enableNaturalLanguage: boolean  // Enable NLP parsing
    nlpConfidenceThreshold: number  // Min confidence for NLP match (0-1)
    preferNLPOverAutocomplete: boolean  // Which to prioritize

    // Settings metadata
    lastModified: string  // ISO timestamp
    version: number  // Schema version for migrations
  }

  // ========================================
  // WORKSPACE MANAGEMENT
  // ========================================
  workspaces?: Array<{
    id: string
    name: string
    description?: string
    emoji?: string  // Optional emoji icon

    // Saved state
    filters: DamSettingsData['activeFilters']
    groupBy: string[]
    sortBy?: string
    sortOrder?: string
    activeCollection?: string
    gridViewMode: 'square' | 'aspect'

    // Metadata
    createdAt: string
    lastUsed: string
    useCount: number
  }>

  // ========================================
  // UNDO/REDO SYSTEM
  // ========================================
  actionHistory?: {
    enabled: boolean
    maxStackSize: number  // Default 50
    currentStack: Array<{
      id: string
      type: 'tag' | 'untag' | 'delete' | 'teamAssign' | 'teamRemove'
      timestamp: string

      // Reversion data
      affectedAssetIds: string[]
      previousState: any  // What to restore
      newState: any  // What was changed to

      // Metadata
      commandId?: string  // Which command triggered this
      description: string  // Human-readable description
    }>
    currentIndex: number  // Where we are in the stack
  }

  // ========================================
  // SEARCH HISTORY
  // ========================================
  searchHistory?: {
    queries: Array<{
      query: string
      timestamp: string
      resultCount: number
      executed: boolean  // Did they execute a command from results?
    }>
    maxHistory: number  // Default 50
  }
}
