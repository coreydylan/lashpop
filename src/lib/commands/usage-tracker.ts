/**
 * Command Usage Tracker
 * Phase 4: Intelligence & Ranking System
 *
 * Tracks command usage patterns for intelligent scoring:
 * - Usage frequency
 * - Last used timestamps
 * - Time-of-day patterns
 * - Day-of-week patterns
 * - Command co-occurrence patterns
 */

import type { DamSettingsData } from "@/db/schema/dam_user_settings"

// ============================================================================
// TYPES
// ============================================================================

interface CommandUsageUpdate {
  commandId: string
  timestamp?: Date
  previousCommandId?: string
}

interface UsagePattern {
  count: number
  lastUsed: string
  avgTimeToSelect: number
  timeOfDayPattern: Record<string, number>
  dayOfWeekPattern: Record<string, number>
}

// ============================================================================
// USAGE TRACKING
// ============================================================================

/**
 * Records a command execution and updates usage patterns
 *
 * @param update - Command usage information
 * @param currentSettings - Current command palette settings
 * @returns Updated command palette settings
 */
export function trackCommandUsage(
  update: CommandUsageUpdate,
  currentSettings?: DamSettingsData['commandPalette']
): DamSettingsData['commandPalette'] {
  const { commandId, timestamp = new Date(), previousCommandId } = update

  // Initialize settings if not provided
  const settings: DamSettingsData['commandPalette'] = currentSettings || {
    favorites: [],
    hidden: [],
    commandUsage: {},
    commandPairs: {},
    collapsedGroups: [],
    groupOrder: [],
    hiddenGroups: [],
    showFrequentlyUsed: true,
    frequentlyUsedLimit: 5,
    groupByUsage: false,
    showSuggestions: true,
    suggestionCount: 3,
    enableAutocomplete: true,
    showPreviews: true,
    autoExecuteSimpleCommands: false,
    enableNaturalLanguage: false,
    nlpConfidenceThreshold: 0.7,
    preferNLPOverAutocomplete: false,
    lastModified: new Date().toISOString(),
    version: 1
  }

  // Update command usage
  settings.commandUsage = updateCommandUsage(
    commandId,
    timestamp,
    settings.commandUsage || {}
  )

  // Update command pairs (co-occurrence)
  if (previousCommandId) {
    settings.commandPairs = updateCommandPairs(
      previousCommandId,
      commandId,
      settings.commandPairs || {}
    )
  }

  // Update last modified timestamp
  settings.lastModified = new Date().toISOString()

  return settings
}

/**
 * Updates usage statistics for a command
 */
function updateCommandUsage(
  commandId: string,
  timestamp: Date,
  currentUsage: Record<string, UsagePattern>
): Record<string, UsagePattern> {
  const usage = { ...currentUsage }
  const existing = usage[commandId]

  const hour = timestamp.getHours().toString()
  const dayOfWeek = timestamp.getDay().toString()

  if (existing) {
    // Update existing usage pattern
    usage[commandId] = {
      count: existing.count + 1,
      lastUsed: timestamp.toISOString(),
      avgTimeToSelect: existing.avgTimeToSelect, // TODO: Calculate from interaction time
      timeOfDayPattern: {
        ...existing.timeOfDayPattern,
        [hour]: (existing.timeOfDayPattern[hour] || 0) + 1
      },
      dayOfWeekPattern: {
        ...existing.dayOfWeekPattern,
        [dayOfWeek]: (existing.dayOfWeekPattern[dayOfWeek] || 0) + 1
      }
    }
  } else {
    // Create new usage pattern
    usage[commandId] = {
      count: 1,
      lastUsed: timestamp.toISOString(),
      avgTimeToSelect: 0,
      timeOfDayPattern: { [hour]: 1 },
      dayOfWeekPattern: { [dayOfWeek]: 1 }
    }
  }

  return usage
}

/**
 * Updates command pair co-occurrence statistics
 */
function updateCommandPairs(
  previousCommandId: string,
  currentCommandId: string,
  currentPairs: Record<string, {
    followedBy: Record<string, number>
    precededBy: Record<string, number>
  }>
): Record<string, {
  followedBy: Record<string, number>
  precededBy: Record<string, number>
}> {
  const pairs = { ...currentPairs }

  // Update "followedBy" for previous command
  if (!pairs[previousCommandId]) {
    pairs[previousCommandId] = { followedBy: {}, precededBy: {} }
  }
  pairs[previousCommandId] = {
    ...pairs[previousCommandId],
    followedBy: {
      ...pairs[previousCommandId].followedBy,
      [currentCommandId]: (pairs[previousCommandId].followedBy[currentCommandId] || 0) + 1
    }
  }

  // Update "precededBy" for current command
  if (!pairs[currentCommandId]) {
    pairs[currentCommandId] = { followedBy: {}, precededBy: {} }
  }
  pairs[currentCommandId] = {
    ...pairs[currentCommandId],
    precededBy: {
      ...pairs[currentCommandId].precededBy,
      [previousCommandId]: (pairs[currentCommandId].precededBy[previousCommandId] || 0) + 1
    }
  }

  return pairs
}

// ============================================================================
// FAVORITES & HIDDEN COMMANDS
// ============================================================================

/**
 * Toggles a command as a favorite (pinned)
 */
export function toggleFavorite(
  commandId: string,
  currentSettings?: DamSettingsData['commandPalette']
): DamSettingsData['commandPalette'] {
  const settings = currentSettings || createDefaultSettings()
  const favorites = settings.favorites || []

  if (favorites.includes(commandId)) {
    // Remove from favorites
    return {
      ...settings,
      favorites: favorites.filter(id => id !== commandId),
      lastModified: new Date().toISOString()
    }
  } else {
    // Add to favorites
    return {
      ...settings,
      favorites: [...favorites, commandId],
      lastModified: new Date().toISOString()
    }
  }
}

/**
 * Toggles a command as hidden
 */
export function toggleHidden(
  commandId: string,
  currentSettings?: DamSettingsData['commandPalette']
): DamSettingsData['commandPalette'] {
  const settings = currentSettings || createDefaultSettings()
  const hidden = settings.hidden || []

  if (hidden.includes(commandId)) {
    // Unhide command
    return {
      ...settings,
      hidden: hidden.filter(id => id !== commandId),
      lastModified: new Date().toISOString()
    }
  } else {
    // Hide command
    return {
      ...settings,
      hidden: [...hidden, commandId],
      lastModified: new Date().toISOString()
    }
  }
}

/**
 * Adds a command to favorites
 */
export function addFavorite(
  commandId: string,
  currentSettings?: DamSettingsData['commandPalette']
): DamSettingsData['commandPalette'] {
  const settings = currentSettings || createDefaultSettings()
  const favorites = settings.favorites || []

  if (favorites.includes(commandId)) {
    return settings // Already a favorite
  }

  return {
    ...settings,
    favorites: [...favorites, commandId],
    lastModified: new Date().toISOString()
  }
}

/**
 * Removes a command from favorites
 */
export function removeFavorite(
  commandId: string,
  currentSettings?: DamSettingsData['commandPalette']
): DamSettingsData['commandPalette'] {
  const settings = currentSettings || createDefaultSettings()

  return {
    ...settings,
    favorites: (settings.favorites || []).filter(id => id !== commandId),
    lastModified: new Date().toISOString()
  }
}

/**
 * Hides a command
 */
export function hideCommand(
  commandId: string,
  currentSettings?: DamSettingsData['commandPalette']
): DamSettingsData['commandPalette'] {
  const settings = currentSettings || createDefaultSettings()
  const hidden = settings.hidden || []

  if (hidden.includes(commandId)) {
    return settings // Already hidden
  }

  return {
    ...settings,
    hidden: [...hidden, commandId],
    lastModified: new Date().toISOString()
  }
}

/**
 * Unhides a command
 */
export function unhideCommand(
  commandId: string,
  currentSettings?: DamSettingsData['commandPalette']
): DamSettingsData['commandPalette'] {
  const settings = currentSettings || createDefaultSettings()

  return {
    ...settings,
    hidden: (settings.hidden || []).filter(id => id !== commandId),
    lastModified: new Date().toISOString()
  }
}

// ============================================================================
// ANALYTICS & INSIGHTS
// ============================================================================

/**
 * Gets the most frequently used commands
 */
export function getMostFrequentCommands(
  settings: DamSettingsData['commandPalette'] | undefined,
  limit = 10
): Array<{ commandId: string; count: number }> {
  if (!settings?.commandUsage) return []

  return Object.entries(settings.commandUsage)
    .map(([commandId, usage]) => ({ commandId, count: usage.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/**
 * Gets the most recently used commands
 */
export function getMostRecentCommands(
  settings: DamSettingsData['commandPalette'] | undefined,
  limit = 10
): Array<{ commandId: string; lastUsed: string }> {
  if (!settings?.commandUsage) return []

  return Object.entries(settings.commandUsage)
    .map(([commandId, usage]) => ({ commandId, lastUsed: usage.lastUsed }))
    .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
    .slice(0, limit)
}

/**
 * Gets commands commonly used after a specific command
 */
export function getCommandsFollowing(
  commandId: string,
  settings: DamSettingsData['commandPalette'] | undefined,
  limit = 5
): Array<{ commandId: string; count: number }> {
  if (!settings?.commandPairs?.[commandId]?.followedBy) return []

  return Object.entries(settings.commandPairs[commandId].followedBy)
    .map(([id, count]) => ({ commandId: id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/**
 * Gets commands commonly used before a specific command
 */
export function getCommandsPreceding(
  commandId: string,
  settings: DamSettingsData['commandPalette'] | undefined,
  limit = 5
): Array<{ commandId: string; count: number }> {
  if (!settings?.commandPairs?.[commandId]?.precededBy) return []

  return Object.entries(settings.commandPairs[commandId].precededBy)
    .map(([id, count]) => ({ commandId: id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/**
 * Gets usage statistics for a specific command
 */
export function getCommandStats(
  commandId: string,
  settings: DamSettingsData['commandPalette'] | undefined
): UsagePattern | null {
  if (!settings?.commandUsage?.[commandId]) return null
  return settings.commandUsage[commandId]
}

/**
 * Gets the peak usage hour for a command
 */
export function getPeakUsageHour(
  commandId: string,
  settings: DamSettingsData['commandPalette'] | undefined
): number | null {
  const stats = getCommandStats(commandId, settings)
  if (!stats?.timeOfDayPattern) return null

  const entries = Object.entries(stats.timeOfDayPattern)
  if (entries.length === 0) return null

  const [peakHour] = entries.reduce((max, current) =>
    current[1] > max[1] ? current : max
  )

  return parseInt(peakHour, 10)
}

/**
 * Gets the peak usage day for a command
 */
export function getPeakUsageDay(
  commandId: string,
  settings: DamSettingsData['commandPalette'] | undefined
): number | null {
  const stats = getCommandStats(commandId, settings)
  if (!stats?.dayOfWeekPattern) return null

  const entries = Object.entries(stats.dayOfWeekPattern)
  if (entries.length === 0) return null

  const [peakDay] = entries.reduce((max, current) =>
    current[1] > max[1] ? current : max
  )

  return parseInt(peakDay, 10)
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Creates default command palette settings
 */
function createDefaultSettings(): DamSettingsData['commandPalette'] {
  return {
    favorites: [],
    hidden: [],
    commandUsage: {},
    commandPairs: {},
    collapsedGroups: [],
    groupOrder: [],
    hiddenGroups: [],
    showFrequentlyUsed: true,
    frequentlyUsedLimit: 5,
    groupByUsage: false,
    showSuggestions: true,
    suggestionCount: 3,
    enableAutocomplete: true,
    showPreviews: true,
    autoExecuteSimpleCommands: false,
    enableNaturalLanguage: false,
    nlpConfidenceThreshold: 0.7,
    preferNLPOverAutocomplete: false,
    lastModified: new Date().toISOString(),
    version: 1
  }
}

/**
 * Resets all usage statistics (useful for testing or fresh start)
 */
export function resetUsageStats(
  currentSettings?: DamSettingsData['commandPalette']
): DamSettingsData['commandPalette'] {
  const settings = currentSettings || createDefaultSettings()

  return {
    ...settings,
    commandUsage: {},
    commandPairs: {},
    lastModified: new Date().toISOString()
  }
}

/**
 * Exports usage data for analysis
 */
export function exportUsageData(
  settings: DamSettingsData['commandPalette'] | undefined
): {
  totalCommands: number
  totalExecutions: number
  favorites: string[]
  hidden: string[]
  usageByCommand: Record<string, number>
  lastModified: string
} {
  if (!settings) {
    return {
      totalCommands: 0,
      totalExecutions: 0,
      favorites: [],
      hidden: [],
      usageByCommand: {},
      lastModified: new Date().toISOString()
    }
  }

  const usageByCommand = Object.entries(settings.commandUsage || {}).reduce(
    (acc, [id, usage]) => {
      acc[id] = usage.count
      return acc
    },
    {} as Record<string, number>
  )

  const totalExecutions = Object.values(usageByCommand).reduce((sum, count) => sum + count, 0)

  return {
    totalCommands: Object.keys(settings.commandUsage || {}).length,
    totalExecutions,
    favorites: settings.favorites || [],
    hidden: settings.hidden || [],
    usageByCommand,
    lastModified: settings.lastModified || new Date().toISOString()
  }
}
