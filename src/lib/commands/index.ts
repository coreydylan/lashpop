/**
 * Command Palette Intelligence & Ranking System
 * Phase 4 - Main Export File
 *
 * This file provides clean exports for the scoring algorithm and usage tracking.
 * Import from this file in your components:
 *
 * @example
 * import {
 *   scoreAndRankCommands,
 *   createScoringContext,
 *   trackCommandUsage
 * } from '@/lib/commands'
 */

// ============================================================================
// SCORING ALGORITHM EXPORTS
// ============================================================================

export {
  scoreAndRankCommands,
  createScoringContext,
  groupScoredCommands,
  filterByScore,
  getTopCommands
} from './scoring-algorithm'

export type {
  CommandItem,
  ScoredCommand,
  ScoreBreakdown,
  ScoringContext,
  ScoringOptions
} from './scoring-algorithm'

// ============================================================================
// USAGE TRACKER EXPORTS
// ============================================================================

export {
  trackCommandUsage,
  toggleFavorite,
  toggleHidden,
  addFavorite,
  removeFavorite,
  hideCommand,
  unhideCommand,
  getMostFrequentCommands,
  getMostRecentCommands,
  getCommandsFollowing,
  getCommandsPreceding,
  getCommandStats,
  getPeakUsageHour,
  getPeakUsageDay,
  resetUsageStats,
  exportUsageData
} from './usage-tracker'

// ============================================================================
// RE-EXPORT TYPES FROM SCHEMA
// ============================================================================

export type { DamSettingsData } from '@/db/schema/dam_user_settings'
