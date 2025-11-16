/**
 * Command Palette Scoring Algorithm
 * Phase 4: Intelligence & Ranking System
 *
 * This module provides intelligent command scoring and ranking based on:
 * - User behavior patterns (usage frequency, recency, time patterns)
 * - Context awareness (selection state, filters, lightbox mode)
 * - Search relevance
 * - Manual user preferences (pins, hidden commands)
 */

import type { DamSettingsData } from "@/db/schema/dam_user_settings"

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CommandItem {
  id: string
  label: string
  group: string
  description?: string
  badge?: string
  isActive?: boolean
  disabled?: boolean
  onSelect: () => void
  avatarUrl?: string
}

export interface ScoredCommand extends CommandItem {
  score: number
  scoreBreakdown?: ScoreBreakdown
}

export interface ScoreBreakdown {
  pinBonus: number
  frequencyScore: number
  recencyScore: number
  contextScore: number
  timeOfDayScore: number
  dayOfWeekScore: number
  coOccurrenceScore: number
  searchScore: number
  total: number
}

export interface ScoringContext {
  // Selection state
  selectionCount: number
  hasSelection: boolean

  // Lightbox state
  lightboxOpen: boolean
  activeAssetName?: string

  // Filter state
  activeFilterCount: number
  hasFilters: boolean

  // Asset state
  totalAssets: number
  isEmpty: boolean

  // Search state
  searchQuery: string

  // Recent command context
  lastCommandId?: string

  // Current time context
  currentHour: number // 0-23
  currentDayOfWeek: number // 0-6, where 0 = Sunday
}

export interface ScoringOptions {
  includeBreakdown?: boolean
  maxResults?: number
  minScore?: number
  boostMultiplier?: number // Global multiplier for all scores (default 1.0)
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SCORE_WEIGHTS = {
  PIN_BONUS: 1000,          // Manual pins get highest priority
  FREQUENCY_MAX: 100,       // Max points from usage frequency
  RECENCY_MAX: 50,          // Max points from recent usage
  CONTEXT_MAX: 200,         // Max points from context relevance
  TIME_OF_DAY_MAX: 30,      // Max points from time-of-day patterns
  DAY_OF_WEEK_MAX: 20,      // Max points from day-of-week patterns
  CO_OCCURRENCE_MAX: 50,    // Max points from command co-occurrence
  SEARCH_MATCH_MAX: 100,    // Max points from search query match
} as const

// Recency decay half-life (commands lose half their recency score after this many days)
const RECENCY_HALF_LIFE_DAYS = 7

// Minimum usage count to start considering frequency patterns
const MIN_USAGE_FOR_PATTERNS = 3

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

/**
 * Scores and ranks commands based on user behavior and current context
 *
 * @param commands - Array of commands to score
 * @param context - Current application context
 * @param userSettings - User's command palette settings
 * @param options - Scoring options
 * @returns Sorted array of scored commands
 */
export function scoreAndRankCommands(
  commands: CommandItem[],
  context: ScoringContext,
  userSettings?: DamSettingsData['commandPalette'],
  options: ScoringOptions = {}
): ScoredCommand[] {
  const {
    includeBreakdown = false,
    maxResults,
    minScore = -1,
    boostMultiplier = 1.0
  } = options

  const scoredCommands: ScoredCommand[] = commands.map(command => {
    // Check if command is hidden
    if (userSettings?.hidden?.includes(command.id)) {
      return {
        ...command,
        score: -1,
        scoreBreakdown: includeBreakdown ? createEmptyBreakdown() : undefined
      }
    }

    const breakdown = calculateScoreBreakdown(
      command,
      context,
      userSettings
    )

    // Apply global boost multiplier
    const total = breakdown.total * boostMultiplier

    return {
      ...command,
      score: total,
      scoreBreakdown: includeBreakdown ? { ...breakdown, total } : undefined
    }
  })

  // Filter out hidden commands and those below minimum score
  const filtered = scoredCommands.filter(cmd => cmd.score >= minScore)

  // Sort by score (descending)
  const sorted = filtered.sort((a, b) => b.score - a.score)

  // Apply max results limit if specified
  if (maxResults && maxResults > 0) {
    return sorted.slice(0, maxResults)
  }

  return sorted
}

// ============================================================================
// SCORE CALCULATION
// ============================================================================

function calculateScoreBreakdown(
  command: CommandItem,
  context: ScoringContext,
  userSettings?: DamSettingsData['commandPalette']
): ScoreBreakdown {
  const breakdown: ScoreBreakdown = {
    pinBonus: 0,
    frequencyScore: 0,
    recencyScore: 0,
    contextScore: 0,
    timeOfDayScore: 0,
    dayOfWeekScore: 0,
    coOccurrenceScore: 0,
    searchScore: 0,
    total: 0
  }

  // 1. Pin Bonus (1000 points)
  breakdown.pinBonus = calculatePinBonus(command.id, userSettings)

  // 2. Frequency Score (0-100 points)
  breakdown.frequencyScore = calculateFrequencyScore(command.id, userSettings)

  // 3. Recency Score (0-50 points)
  breakdown.recencyScore = calculateRecencyScore(command.id, userSettings)

  // 4. Context Relevance Score (0-200 points)
  breakdown.contextScore = calculateContextScore(command, context)

  // 5. Time-of-Day Score (0-30 points)
  breakdown.timeOfDayScore = calculateTimeOfDayScore(
    command.id,
    context.currentHour,
    userSettings
  )

  // 6. Day-of-Week Score (0-20 points)
  breakdown.dayOfWeekScore = calculateDayOfWeekScore(
    command.id,
    context.currentDayOfWeek,
    userSettings
  )

  // 7. Co-occurrence Score (0-50 points)
  breakdown.coOccurrenceScore = calculateCoOccurrenceScore(
    command.id,
    context.lastCommandId,
    userSettings
  )

  // 8. Search Query Match Score (0-100 points)
  breakdown.searchScore = calculateSearchScore(command, context.searchQuery)

  // Calculate total
  breakdown.total =
    breakdown.pinBonus +
    breakdown.frequencyScore +
    breakdown.recencyScore +
    breakdown.contextScore +
    breakdown.timeOfDayScore +
    breakdown.dayOfWeekScore +
    breakdown.coOccurrenceScore +
    breakdown.searchScore

  return breakdown
}

// ============================================================================
// INDIVIDUAL SCORE CALCULATORS
// ============================================================================

/**
 * Calculate pin bonus (1000 points if pinned)
 */
function calculatePinBonus(
  commandId: string,
  userSettings?: DamSettingsData['commandPalette']
): number {
  if (!userSettings?.favorites) return 0
  return userSettings.favorites.includes(commandId) ? SCORE_WEIGHTS.PIN_BONUS : 0
}

/**
 * Calculate frequency score (0-100 points)
 * Based on how often the command has been used
 */
function calculateFrequencyScore(
  commandId: string,
  userSettings?: DamSettingsData['commandPalette']
): number {
  const usage = userSettings?.commandUsage?.[commandId]
  if (!usage || usage.count === 0) return 0

  // Find max usage count across all commands for normalization
  const allUsageCounts = Object.values(userSettings?.commandUsage || {}).map(u => u.count)
  const maxUsage = Math.max(...allUsageCounts, 1) // Prevent division by zero

  // Normalize to 0-100 scale
  const normalized = (usage.count / maxUsage) * SCORE_WEIGHTS.FREQUENCY_MAX

  return Math.min(normalized, SCORE_WEIGHTS.FREQUENCY_MAX)
}

/**
 * Calculate recency score (0-50 points)
 * Based on when the command was last used (exponential decay)
 */
function calculateRecencyScore(
  commandId: string,
  userSettings?: DamSettingsData['commandPalette']
): number {
  const usage = userSettings?.commandUsage?.[commandId]
  if (!usage?.lastUsed) return 0

  const lastUsedDate = new Date(usage.lastUsed)
  const now = new Date()
  const daysSinceLastUse = (now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24)

  // Exponential decay: score = MAX * (0.5 ^ (days / half-life))
  const score = SCORE_WEIGHTS.RECENCY_MAX * Math.pow(0.5, daysSinceLastUse / RECENCY_HALF_LIFE_DAYS)

  return Math.max(0, Math.min(score, SCORE_WEIGHTS.RECENCY_MAX))
}

/**
 * Calculate context-aware relevance score (0-200 points)
 * Boosts commands based on current application state
 */
function calculateContextScore(
  command: CommandItem,
  context: ScoringContext
): number {
  let score = 0
  const commandId = command.id
  const group = command.group

  // SCENARIO 1: Selection Active (boost tagging/export/bulk actions)
  if (context.hasSelection && context.selectionCount > 0) {
    if (group === 'Tagging' || group === 'Tag' || group === 'Set Tag') {
      score += 150 // Strong boost for tagging with selection
    }
    if (group === 'Team' || group === 'Set Team Member') {
      score += 150 // Strong boost for team assignment with selection
    }
    if (commandId.includes('export') || commandId.includes('download')) {
      score += 120 // Boost export commands
    }
    if (commandId === 'selection-apply' || commandId === 'selection-clear') {
      score += 100 // Boost selection management
    }
    if (commandId === 'selection-delete') {
      score += 80 // Moderate boost for delete
    }

    // Penalize filtering commands when selection is active
    if (group === 'Filtering' || group === 'Filter by Tag' || group === 'Filter by Team') {
      score -= 50
    }
  }

  // SCENARIO 2: No Selection (boost filtering/selection commands)
  if (!context.hasSelection && !context.lightboxOpen) {
    if (group === 'Filtering' || group === 'Filter by Tag' || group === 'Filter by Team') {
      score += 120 // Strong boost for filtering
    }
    if (commandId === 'selection-all') {
      score += 100 // Boost select all
    }
    if (group === 'Organization' || group === 'Grouping') {
      score += 80 // Boost organization commands
    }

    // Penalize tagging commands when nothing is selected
    if (group === 'Tagging' || group === 'Tag') {
      score -= 80
    }
  }

  // SCENARIO 3: Lightbox Open (boost current tag removal, single asset actions)
  if (context.lightboxOpen) {
    if (group === 'Current Tags') {
      score += 180 // Strong boost for removing tags from active asset
    }
    if (commandId.startsWith('single-')) {
      score += 100 // Boost single-asset commands
    }
    if (commandId === 'single-select' || commandId === 'single-unselect') {
      score += 90 // Boost selection toggle
    }

    // Penalize bulk actions in lightbox mode
    if (group === 'Selection' && !commandId.startsWith('single-')) {
      score -= 60
    }
  }

  // SCENARIO 4: Filters Active (boost clear filters)
  if (context.hasFilters && context.activeFilterCount > 0) {
    if (commandId === 'filters-clear') {
      score += 150 // Strong boost for clearing filters
    }
    if (command.isActive) {
      score += 60 // Boost currently active filter toggles
    }
  }

  // SCENARIO 5: Empty State (boost upload/help commands)
  if (context.isEmpty || context.totalAssets === 0) {
    if (commandId.includes('upload') || commandId.includes('import')) {
      score += 200 // Maximum boost for upload
    }
    if (commandId.includes('help') || commandId.includes('tutorial')) {
      score += 150 // Strong boost for help
    }

    // Penalize commands that need assets
    if (group === 'Tagging' || group === 'Filtering' || group === 'Selection') {
      score -= 100
    }
  }

  // SCENARIO 6: Many Filters Active (suggest grouping/organization)
  if (context.activeFilterCount >= 3) {
    if (group === 'Organization' || group === 'Grouping') {
      score += 100 // Boost organization when many filters
    }
  }

  // Cap the context score at maximum
  return Math.max(-100, Math.min(score, SCORE_WEIGHTS.CONTEXT_MAX))
}

/**
 * Calculate time-of-day pattern score (0-30 points)
 * Boosts commands typically used at this hour
 */
function calculateTimeOfDayScore(
  commandId: string,
  currentHour: number,
  userSettings?: DamSettingsData['commandPalette']
): number {
  const usage = userSettings?.commandUsage?.[commandId]
  if (!usage?.timeOfDayPattern || usage.count < MIN_USAGE_FOR_PATTERNS) return 0

  const hourKey = currentHour.toString()
  const usageAtThisHour = usage.timeOfDayPattern[hourKey] || 0

  if (usageAtThisHour === 0) return 0

  // Calculate total usage across all hours
  const totalUsage = Object.values(usage.timeOfDayPattern).reduce((sum, count) => sum + count, 0)

  if (totalUsage === 0) return 0

  // Calculate probability of using this command at this hour
  const probability = usageAtThisHour / totalUsage

  // Scale to 0-30 points
  const score = probability * SCORE_WEIGHTS.TIME_OF_DAY_MAX

  return Math.min(score, SCORE_WEIGHTS.TIME_OF_DAY_MAX)
}

/**
 * Calculate day-of-week pattern score (0-20 points)
 * Boosts commands typically used on this day
 */
function calculateDayOfWeekScore(
  commandId: string,
  currentDayOfWeek: number,
  userSettings?: DamSettingsData['commandPalette']
): number {
  const usage = userSettings?.commandUsage?.[commandId]
  if (!usage?.dayOfWeekPattern || usage.count < MIN_USAGE_FOR_PATTERNS) return 0

  const dayKey = currentDayOfWeek.toString()
  const usageOnThisDay = usage.dayOfWeekPattern[dayKey] || 0

  if (usageOnThisDay === 0) return 0

  // Calculate total usage across all days
  const totalUsage = Object.values(usage.dayOfWeekPattern).reduce((sum, count) => sum + count, 0)

  if (totalUsage === 0) return 0

  // Calculate probability of using this command on this day
  const probability = usageOnThisDay / totalUsage

  // Scale to 0-20 points
  const score = probability * SCORE_WEIGHTS.DAY_OF_WEEK_MAX

  return Math.min(score, SCORE_WEIGHTS.DAY_OF_WEEK_MAX)
}

/**
 * Calculate co-occurrence score (0-50 points)
 * Boosts commands frequently used after the last command
 */
function calculateCoOccurrenceScore(
  commandId: string,
  lastCommandId: string | undefined,
  userSettings?: DamSettingsData['commandPalette']
): number {
  if (!lastCommandId || !userSettings?.commandPairs) return 0

  const lastCommandPairs = userSettings.commandPairs[lastCommandId]
  if (!lastCommandPairs?.followedBy) return 0

  const timesFollowed = lastCommandPairs.followedBy[commandId] || 0
  if (timesFollowed === 0) return 0

  // Calculate total times the last command was followed by any command
  const totalFollowedBy = Object.values(lastCommandPairs.followedBy).reduce(
    (sum, count) => sum + count,
    0
  )

  if (totalFollowedBy === 0) return 0

  // Calculate probability of this command following the last command
  const probability = timesFollowed / totalFollowedBy

  // Scale to 0-50 points
  const score = probability * SCORE_WEIGHTS.CO_OCCURRENCE_MAX

  return Math.min(score, SCORE_WEIGHTS.CO_OCCURRENCE_MAX)
}

/**
 * Calculate search query match score (0-100 points)
 * Higher score for better matches to search query
 */
function calculateSearchScore(
  command: CommandItem,
  searchQuery: string
): number {
  if (!searchQuery || searchQuery.trim().length === 0) return 0

  const query = searchQuery.trim().toLowerCase()
  const searchableText = [
    command.label,
    command.description || '',
    command.group,
    command.badge || ''
  ].join(' ').toLowerCase()

  // Exact match in label
  if (command.label.toLowerCase() === query) {
    return SCORE_WEIGHTS.SEARCH_MATCH_MAX
  }

  // Label starts with query
  if (command.label.toLowerCase().startsWith(query)) {
    return SCORE_WEIGHTS.SEARCH_MATCH_MAX * 0.9
  }

  // Label contains query as whole word
  const labelWords = command.label.toLowerCase().split(/\s+/)
  if (labelWords.some(word => word === query)) {
    return SCORE_WEIGHTS.SEARCH_MATCH_MAX * 0.8
  }

  // Label contains query as substring
  if (command.label.toLowerCase().includes(query)) {
    return SCORE_WEIGHTS.SEARCH_MATCH_MAX * 0.6
  }

  // Description contains query
  if (command.description?.toLowerCase().includes(query)) {
    return SCORE_WEIGHTS.SEARCH_MATCH_MAX * 0.4
  }

  // Group or badge contains query
  if (command.group.toLowerCase().includes(query) || command.badge?.toLowerCase().includes(query)) {
    return SCORE_WEIGHTS.SEARCH_MATCH_MAX * 0.3
  }

  // Fuzzy match - count matching characters
  const matchingChars = countMatchingCharacters(query, searchableText)
  const fuzzyScore = (matchingChars / query.length) * SCORE_WEIGHTS.SEARCH_MATCH_MAX * 0.2

  return Math.max(0, fuzzyScore)
}

/**
 * Count how many characters from the query appear in order in the text
 */
function countMatchingCharacters(query: string, text: string): number {
  let queryIndex = 0
  let matchCount = 0

  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (text[i] === query[queryIndex]) {
      matchCount++
      queryIndex++
    }
  }

  return matchCount
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createEmptyBreakdown(): ScoreBreakdown {
  return {
    pinBonus: 0,
    frequencyScore: 0,
    recencyScore: 0,
    contextScore: 0,
    timeOfDayScore: 0,
    dayOfWeekScore: 0,
    coOccurrenceScore: 0,
    searchScore: 0,
    total: 0
  }
}

/**
 * Create a scoring context from current application state
 */
export function createScoringContext(params: {
  selectionCount?: number
  lightboxOpen?: boolean
  activeAssetName?: string
  activeFilterCount?: number
  totalAssets?: number
  searchQuery?: string
  lastCommandId?: string
}): ScoringContext {
  const now = new Date()

  return {
    selectionCount: params.selectionCount || 0,
    hasSelection: (params.selectionCount || 0) > 0,
    lightboxOpen: params.lightboxOpen || false,
    activeAssetName: params.activeAssetName,
    activeFilterCount: params.activeFilterCount || 0,
    hasFilters: (params.activeFilterCount || 0) > 0,
    totalAssets: params.totalAssets || 0,
    isEmpty: (params.totalAssets || 0) === 0,
    searchQuery: params.searchQuery || '',
    lastCommandId: params.lastCommandId,
    currentHour: now.getHours(),
    currentDayOfWeek: now.getDay()
  }
}

/**
 * Group scored commands by their group property
 */
export function groupScoredCommands(
  commands: ScoredCommand[]
): Record<string, ScoredCommand[]> {
  return commands.reduce<Record<string, ScoredCommand[]>>((acc, command) => {
    if (!acc[command.group]) {
      acc[command.group] = []
    }
    acc[command.group].push(command)
    return acc
  }, {})
}

/**
 * Filter commands by minimum score threshold
 */
export function filterByScore(
  commands: ScoredCommand[],
  minScore: number
): ScoredCommand[] {
  return commands.filter(cmd => cmd.score >= minScore)
}

/**
 * Get top N commands
 */
export function getTopCommands(
  commands: ScoredCommand[],
  count: number
): ScoredCommand[] {
  return commands.slice(0, count)
}
