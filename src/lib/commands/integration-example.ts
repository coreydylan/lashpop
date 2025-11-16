/**
 * Command Palette Integration Example
 * Phase 4: Intelligence & Ranking System
 *
 * This file demonstrates how to integrate the scoring algorithm
 * and usage tracking with the existing command palette.
 *
 * USAGE NOTES:
 * This is an example file showing how to integrate the scoring system.
 * Copy the relevant patterns into your actual command palette implementation.
 */

import type { CommandItem } from './scoring-algorithm'
import {
  scoreAndRankCommands,
  createScoringContext,
  groupScoredCommands,
  getTopCommands
} from './scoring-algorithm'
import {
  trackCommandUsage,
  toggleFavorite,
  toggleHidden
} from './usage-tracker'
import type { DamSettingsData } from '@/db/schema/dam_user_settings'

// ============================================================================
// EXAMPLE: Basic Integration
// ============================================================================

/**
 * Example: Score and rank commands based on current context
 */
export function exampleBasicScoring(
  commands: CommandItem[],
  contextParams: {
    selectionCount: number
    lightboxOpen: boolean
    activeFilterCount: number
    totalAssets: number
    searchQuery: string
  },
  userSettings?: DamSettingsData['commandPalette']
) {
  // 1. Create scoring context
  const context = createScoringContext(contextParams)

  // 2. Score and rank commands
  const scoredCommands = scoreAndRankCommands(commands, context, userSettings, {
    includeBreakdown: false, // Set to true for debugging
    maxResults: 50, // Limit results
    minScore: 0 // Filter out negative scores (hidden commands)
  })

  return scoredCommands
}

// ============================================================================
// EXAMPLE: With Score Breakdown (for debugging)
// ============================================================================

/**
 * Example: Get detailed score breakdown for analysis
 */
export function exampleWithBreakdown(
  commands: CommandItem[],
  contextParams: {
    selectionCount: number
    lightboxOpen: boolean
    activeFilterCount: number
    totalAssets: number
    searchQuery: string
  },
  userSettings?: DamSettingsData['commandPalette']
) {
  const context = createScoringContext(contextParams)

  const scoredCommands = scoreAndRankCommands(commands, context, userSettings, {
    includeBreakdown: true, // Include detailed breakdown
    minScore: 0
  })

  // Log breakdown for first command (debugging)
  if (scoredCommands.length > 0) {
    const topCommand = scoredCommands[0]
    console.log('Top Command:', topCommand.label)
    console.log('Score Breakdown:', topCommand.scoreBreakdown)
  }

  return scoredCommands
}

// ============================================================================
// EXAMPLE: Usage Tracking Integration
// ============================================================================

/**
 * Example: Track command execution
 */
export function exampleTrackCommand(
  commandId: string,
  previousCommandId: string | undefined,
  currentSettings: DamSettingsData['commandPalette'] | undefined
): DamSettingsData['commandPalette'] {
  // Track the command usage
  const updatedSettings = trackCommandUsage(
    {
      commandId,
      timestamp: new Date(),
      previousCommandId
    },
    currentSettings
  )

  // Return updated settings to save to database
  return updatedSettings
}

// ============================================================================
// EXAMPLE: Favorites Management
// ============================================================================

/**
 * Example: Add/remove favorites
 */
export function exampleManageFavorites(
  commandId: string,
  action: 'add' | 'remove' | 'toggle',
  currentSettings: DamSettingsData['commandPalette'] | undefined
): DamSettingsData['commandPalette'] {
  if (action === 'toggle') {
    return toggleFavorite(commandId, currentSettings)
  }

  if (action === 'add') {
    const settings = currentSettings || {
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

    return {
      ...settings,
      favorites: [...(settings.favorites || []), commandId],
      lastModified: new Date().toISOString()
    }
  }

  if (action === 'remove') {
    const settings = currentSettings || {
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

    return {
      ...settings,
      favorites: (settings.favorites || []).filter(id => id !== commandId),
      lastModified: new Date().toISOString()
    }
  }

  throw new Error(`Unknown action: ${action}`)
}

// ============================================================================
// EXAMPLE: Complete Integration in React Component
// ============================================================================

/**
 * Example React hook integration (pseudo-code)
 *
 * This shows how you might integrate the scoring system into a React component
 * that uses the command palette.
 */
export const exampleReactIntegration = `
import { useState, useMemo, useCallback } from 'react'
import { scoreAndRankCommands, createScoringContext } from '@/lib/commands/scoring-algorithm'
import { trackCommandUsage } from '@/lib/commands/usage-tracker'
import { useDamSettings } from '@/hooks/useDamSettings'

function CommandPaletteExample() {
  const { settings, updateCommandPaletteSettings } = useDamSettings()
  const [searchQuery, setSearchQuery] = useState('')
  const [lastCommandId, setLastCommandId] = useState<string | undefined>()

  // Your raw commands (from existing code)
  const rawCommands = useMemo(() => {
    // ... generate commands based on app state
    return commands
  }, [/* dependencies */])

  // Score and rank commands
  const rankedCommands = useMemo(() => {
    const context = createScoringContext({
      selectionCount: selectedAssets.length,
      lightboxOpen: !!activeLightboxAsset,
      activeFilterCount: activeFilters.length,
      totalAssets: assets.length,
      searchQuery,
      lastCommandId
    })

    return scoreAndRankCommands(
      rawCommands,
      context,
      settings?.commandPalette,
      {
        includeBreakdown: false,
        minScore: 0
      }
    )
  }, [rawCommands, selectedAssets, activeLightboxAsset, activeFilters, assets, searchQuery, lastCommandId, settings])

  // Handle command execution
  const handleCommandSelect = useCallback((commandId: string) => {
    // Execute the command
    const command = rawCommands.find(c => c.id === commandId)
    command?.onSelect()

    // Track usage
    const updatedSettings = trackCommandUsage(
      { commandId, previousCommandId: lastCommandId },
      settings?.commandPalette
    )

    // Save to database
    updateCommandPaletteSettings(updatedSettings)

    // Update last command for co-occurrence tracking
    setLastCommandId(commandId)
  }, [rawCommands, lastCommandId, settings, updateCommandPaletteSettings])

  return (
    <OmniCommandPalette
      items={rankedCommands} // Use ranked commands instead of raw
      onCommandSelect={handleCommandSelect}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    />
  )
}
`

// ============================================================================
// EXAMPLE: Context-Specific Scenarios
// ============================================================================

/**
 * Example: Empty state scenario (no assets)
 */
export function exampleEmptyState(
  commands: CommandItem[],
  userSettings?: DamSettingsData['commandPalette']
) {
  const context = createScoringContext({
    selectionCount: 0,
    lightboxOpen: false,
    activeFilterCount: 0,
    totalAssets: 0, // Empty state
    searchQuery: ''
  })

  // Upload commands will be heavily boosted (+200 points)
  return scoreAndRankCommands(commands, context, userSettings)
}

/**
 * Example: Bulk selection scenario
 */
export function exampleBulkSelection(
  commands: CommandItem[],
  selectionCount: number,
  userSettings?: DamSettingsData['commandPalette']
) {
  const context = createScoringContext({
    selectionCount,
    lightboxOpen: false,
    activeFilterCount: 0,
    totalAssets: 100,
    searchQuery: ''
  })

  // Tagging and team assignment commands will be boosted (+150 points)
  return scoreAndRankCommands(commands, context, userSettings)
}

/**
 * Example: Lightbox mode scenario
 */
export function exampleLightboxMode(
  commands: CommandItem[],
  activeAssetName: string,
  userSettings?: DamSettingsData['commandPalette']
) {
  const context = createScoringContext({
    selectionCount: 0,
    lightboxOpen: true,
    activeAssetName,
    activeFilterCount: 0,
    totalAssets: 100,
    searchQuery: ''
  })

  // Current tag removal commands will be boosted (+180 points)
  return scoreAndRankCommands(commands, context, userSettings)
}

/**
 * Example: Heavy filtering scenario
 */
export function exampleHeavyFiltering(
  commands: CommandItem[],
  activeFilterCount: number,
  userSettings?: DamSettingsData['commandPalette']
) {
  const context = createScoringContext({
    selectionCount: 0,
    lightboxOpen: false,
    activeFilterCount,
    totalAssets: 100,
    searchQuery: ''
  })

  // Clear filters command will be boosted (+150 points)
  // Organization commands will be boosted if 3+ filters (+100 points)
  return scoreAndRankCommands(commands, context, userSettings)
}

// ============================================================================
// EXAMPLE: Advanced - Grouped Results
// ============================================================================

/**
 * Example: Get top commands per group
 */
export function exampleTopPerGroup(
  commands: CommandItem[],
  contextParams: {
    selectionCount: number
    lightboxOpen: boolean
    activeFilterCount: number
    totalAssets: number
    searchQuery: string
  },
  userSettings?: DamSettingsData['commandPalette'],
  topPerGroup = 3
) {
  const context = createScoringContext(contextParams)
  const scored = scoreAndRankCommands(commands, context, userSettings)
  const grouped = groupScoredCommands(scored)

  // Get top N from each group
  const topFromEachGroup: Record<string, typeof scored> = {}
  for (const [groupName, groupCommands] of Object.entries(grouped)) {
    topFromEachGroup[groupName] = getTopCommands(groupCommands, topPerGroup)
  }

  return topFromEachGroup
}

// ============================================================================
// EXAMPLE: Testing Scenarios
// ============================================================================

/**
 * Test different scoring scenarios
 */
export function testScoringScenarios() {
  const mockCommands: CommandItem[] = [
    {
      id: 'tag-lash-classic',
      label: 'Lash Type › Classic',
      group: 'Tagging',
      badge: 'Lash Type',
      onSelect: () => {}
    },
    {
      id: 'filter-team-sarah',
      label: 'Team › Sarah',
      group: 'Filtering',
      badge: 'Team',
      onSelect: () => {}
    },
    {
      id: 'selection-all',
      label: 'Select all',
      group: 'Selection',
      onSelect: () => {}
    },
    {
      id: 'filters-clear',
      label: 'Clear all filters',
      group: 'Filtering',
      onSelect: () => {}
    },
    {
      id: 'upload',
      label: 'Upload photos',
      group: 'Actions',
      onSelect: () => {}
    }
  ]

  const mockSettings: DamSettingsData['commandPalette'] = {
    favorites: ['selection-all'], // Pin "Select all"
    hidden: [],
    commandUsage: {
      'tag-lash-classic': {
        count: 50,
        lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Yesterday
        avgTimeToSelect: 2000,
        timeOfDayPattern: { '14': 25, '15': 25 }, // Used at 2-3pm
        dayOfWeekPattern: { '1': 20, '2': 30 } // Used Mon/Tue
      },
      'filter-team-sarah': {
        count: 30,
        lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // Week ago
        avgTimeToSelect: 1500,
        timeOfDayPattern: { '10': 30 },
        dayOfWeekPattern: { '1': 30 }
      }
    },
    commandPairs: {
      'selection-all': {
        followedBy: { 'tag-lash-classic': 15 }, // Often followed by tagging
        precededBy: {}
      }
    },
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

  console.log('=== Scenario 1: Empty State ===')
  const emptyResult = exampleEmptyState(mockCommands, mockSettings)
  console.log('Top command:', emptyResult[0]?.label, '- Score:', emptyResult[0]?.score)

  console.log('\n=== Scenario 2: Bulk Selection ===')
  const selectionResult = exampleBulkSelection(mockCommands, 10, mockSettings)
  console.log('Top command:', selectionResult[0]?.label, '- Score:', selectionResult[0]?.score)

  console.log('\n=== Scenario 3: Heavy Filtering ===')
  const filteringResult = exampleHeavyFiltering(mockCommands, 5, mockSettings)
  console.log('Top command:', filteringResult[0]?.label, '- Score:', filteringResult[0]?.score)

  return {
    emptyResult,
    selectionResult,
    filteringResult
  }
}
