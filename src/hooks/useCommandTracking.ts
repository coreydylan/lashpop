/**
 * React Hook for Command Palette Usage Tracking
 *
 * Tracks command execution, learns patterns, and provides intelligent insights
 */

import { useCallback } from 'react'
import type { DamSettingsData } from '@/db/schema/dam_user_settings'
import { trackCommandUsage as trackUsage } from '@/lib/commands/usage-tracker'

interface UseCommandTrackingProps {
  settings: DamSettingsData
  onSettingsChange: (settings: Partial<DamSettingsData>) => Promise<void>
}

interface TrackingContext {
  previousCommandId?: string
  metadata?: Record<string, any>
}

export function useCommandTracking({
  settings,
  onSettingsChange
}: UseCommandTrackingProps) {
  /**
   * Track command execution
   */
  const trackCommand = useCallback(async (
    commandId: string,
    context?: TrackingContext
  ) => {
    const updatedPalette = trackUsage(
      {
        commandId,
        previousCommandId: context?.previousCommandId
      },
      settings.commandPalette
    )

    await onSettingsChange({
      commandPalette: updatedPalette
    })
  }, [settings.commandPalette, onSettingsChange])

  /**
   * Toggle favorite status
   */
  const toggleFavorite = useCallback(async (commandId: string) => {
    const favorites = settings.commandPalette?.favorites || []
    const isFavorite = favorites.includes(commandId)

    const newFavorites = isFavorite
      ? favorites.filter(id => id !== commandId)
      : [...favorites, commandId]

    await onSettingsChange({
      commandPalette: {
        ...(settings.commandPalette || {}),
        favorites: newFavorites,
        lastModified: new Date().toISOString()
      } as Partial<NonNullable<DamSettingsData['commandPalette']>>
    })

    return !isFavorite
  }, [settings.commandPalette, onSettingsChange])

  /**
   * Toggle hidden status
   */
  const toggleHidden = useCallback(async (commandId: string) => {
    const hidden = settings.commandPalette?.hidden || []
    const isHidden = hidden.includes(commandId)

    const newHidden = isHidden
      ? hidden.filter(id => id !== commandId)
      : [...hidden, commandId]

    await onSettingsChange({
      commandPalette: {
        ...(settings.commandPalette || {}),
        hidden: newHidden,
        lastModified: new Date().toISOString()
      } as Partial<NonNullable<DamSettingsData['commandPalette']>>
    })

    return !isHidden
  }, [settings.commandPalette, onSettingsChange])

  /**
   * Update display preferences
   */
  const updateDisplayPreferences = useCallback(async (
    preferences: Partial<NonNullable<DamSettingsData['commandPalette']>>
  ) => {
    await onSettingsChange({
      commandPalette: {
        ...(settings.commandPalette || {}),
        ...preferences,
        lastModified: new Date().toISOString()
      } as Partial<NonNullable<DamSettingsData['commandPalette']>>
    })
  }, [settings.commandPalette, onSettingsChange])

  /**
   * Update group order
   */
  const updateGroupOrder = useCallback(async (groupOrder: string[]) => {
    await onSettingsChange({
      commandPalette: {
        ...(settings.commandPalette || {}),
        groupOrder,
        lastModified: new Date().toISOString()
      } as Partial<NonNullable<DamSettingsData['commandPalette']>>
    })
  }, [settings.commandPalette, onSettingsChange])

  /**
   * Toggle group collapsed state
   */
  const toggleGroupCollapsed = useCallback(async (groupName: string) => {
    const collapsedGroups = settings.commandPalette?.collapsedGroups || []
    const isCollapsed = collapsedGroups.includes(groupName)

    const newCollapsed = isCollapsed
      ? collapsedGroups.filter(g => g !== groupName)
      : [...collapsedGroups, groupName]

    await onSettingsChange({
      commandPalette: {
        ...(settings.commandPalette || {}),
        collapsedGroups: newCollapsed,
        lastModified: new Date().toISOString()
      } as Partial<NonNullable<DamSettingsData['commandPalette']>>
    })

    return !isCollapsed
  }, [settings.commandPalette, onSettingsChange])

  /**
   * Toggle group hidden state
   */
  const toggleGroupHidden = useCallback(async (groupName: string) => {
    const hiddenGroups = settings.commandPalette?.hiddenGroups || []
    const isHidden = hiddenGroups.includes(groupName)

    const newHidden = isHidden
      ? hiddenGroups.filter(g => g !== groupName)
      : [...hiddenGroups, groupName]

    await onSettingsChange({
      commandPalette: {
        ...(settings.commandPalette || {}),
        hiddenGroups: newHidden,
        lastModified: new Date().toISOString()
      } as Partial<NonNullable<DamSettingsData['commandPalette']>>
    })

    return !isHidden
  }, [settings.commandPalette, onSettingsChange])

  /**
   * Reset all usage data
   */
  const resetUsageData = useCallback(async () => {
    await onSettingsChange({
      commandPalette: {
        ...(settings.commandPalette || {}),
        commandUsage: {},
        commandPairs: {},
        lastModified: new Date().toISOString()
      } as Partial<NonNullable<DamSettingsData['commandPalette']>>
    })
  }, [settings.commandPalette, onSettingsChange])

  /**
   * Get most frequently used commands
   */
  const getFrequentCommands = useCallback((limit = 5) => {
    const usage = settings.commandPalette?.commandUsage || {}

    return Object.entries(usage)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, limit)
      .map(([commandId, data]) => ({
        commandId,
        count: data.count,
        lastUsed: data.lastUsed
      }))
  }, [settings.commandPalette?.commandUsage])

  /**
   * Get recently used commands
   */
  const getRecentCommands = useCallback((limit = 5) => {
    const usage = settings.commandPalette?.commandUsage || {}

    return Object.entries(usage)
      .sort(([, a], [, b]) =>
        new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
      )
      .slice(0, limit)
      .map(([commandId, data]) => ({
        commandId,
        count: data.count,
        lastUsed: data.lastUsed
      }))
  }, [settings.commandPalette?.commandUsage])

  /**
   * Get commands that typically follow a given command
   */
  const getSuggestedNextCommands = useCallback((
    currentCommandId: string,
    limit = 3
  ) => {
    const pairs = settings.commandPalette?.commandPairs?.[currentCommandId]
    if (!pairs?.followedBy) return []

    return Object.entries(pairs.followedBy)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([commandId, count]) => ({
        commandId,
        frequency: count
      }))
  }, [settings.commandPalette?.commandPairs])

  /**
   * Check if command is favorited
   */
  const isFavorite = useCallback((commandId: string) => {
    return settings.commandPalette?.favorites?.includes(commandId) || false
  }, [settings.commandPalette?.favorites])

  /**
   * Check if command is hidden
   */
  const isHidden = useCallback((commandId: string) => {
    return settings.commandPalette?.hidden?.includes(commandId) || false
  }, [settings.commandPalette?.hidden])

  /**
   * Get usage statistics for a specific command
   */
  const getCommandStats = useCallback((commandId: string) => {
    return settings.commandPalette?.commandUsage?.[commandId] || null
  }, [settings.commandPalette?.commandUsage])

  return {
    // Core tracking
    trackCommand,

    // Favorites & visibility
    toggleFavorite,
    toggleHidden,
    isFavorite,
    isHidden,

    // Preferences
    updateDisplayPreferences,
    updateGroupOrder,
    toggleGroupCollapsed,
    toggleGroupHidden,

    // Data management
    resetUsageData,

    // Insights
    getFrequentCommands,
    getRecentCommands,
    getSuggestedNextCommands,
    getCommandStats,

    // Current state
    settings: settings.commandPalette
  }
}
