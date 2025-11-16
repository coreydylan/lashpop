# Command Palette Intelligence & Ranking System

## Phase 4: Intelligent Command Scoring

This module provides an intelligent scoring and ranking system for the DAM Command Palette. Commands are scored based on user behavior, context awareness, and search relevance to surface the most relevant actions at the right time.

## Overview

### Files

- **`scoring-algorithm.ts`** - Core scoring engine with context-aware boosting
- **`usage-tracker.ts`** - Tracks command usage patterns and user preferences
- **`integration-example.ts`** - Examples showing how to integrate the scoring system
- **`README.md`** - This documentation file

### Key Features

✅ **Multi-factor scoring** - Combines 8 different scoring signals
✅ **Context-aware boosting** - Adapts to selection state, filters, lightbox mode, etc.
✅ **Usage pattern learning** - Learns from frequency, recency, time-of-day, and day-of-week
✅ **Co-occurrence tracking** - Predicts what command you'll need next
✅ **Search relevance** - Intelligent fuzzy matching with query
✅ **Manual controls** - Pin favorites or hide unwanted commands

## Scoring Formula

Commands receive a score from 0-1550+ points based on these factors:

| Factor | Points | Description |
|--------|--------|-------------|
| **Manual Pin** | 1000 | User-pinned favorites get top priority |
| **Usage Frequency** | 0-100 | How often you use this command |
| **Recency** | 0-50 | When you last used it (exponential decay) |
| **Context Relevance** | 0-200 | Relevance to current app state |
| **Time of Day** | 0-30 | Match to your usage patterns by hour |
| **Day of Week** | 0-20 | Match to your usage patterns by day |
| **Co-occurrence** | 0-50 | Likelihood to follow previous command |
| **Search Match** | 0-100 | Relevance to search query |

### Score Calculation Example

```typescript
// Example: "Tag › Classic Lashes" command
{
  pinBonus: 0,           // Not pinned
  frequencyScore: 85,    // Used 50 times (85% of max usage)
  recencyScore: 42,      // Used yesterday (84% of max)
  contextScore: 150,     // High relevance (selection active)
  timeOfDayScore: 25,    // Often used at this hour
  dayOfWeekScore: 15,    // Often used on this day
  coOccurrenceScore: 35, // Often follows "Select All"
  searchScore: 90,       // Strong match for query "classic"
  total: 442            // Final score
}
```

## Context-Aware Boosting

The scoring algorithm automatically adapts to different scenarios:

### Scenario 1: Selection Active
**Context**: User has selected 5 photos
**Boosts**:
- Tagging commands: **+150 points**
- Team assignment: **+150 points**
- Export/download: **+120 points**
- Selection actions: **+100 points**

**Penalties**:
- Filtering commands: **-50 points**

### Scenario 2: No Selection
**Context**: Browsing gallery, no assets selected
**Boosts**:
- Filtering commands: **+120 points**
- "Select All": **+100 points**
- Organization: **+80 points**

**Penalties**:
- Tagging commands: **-80 points**

### Scenario 3: Lightbox Open
**Context**: Viewing single photo in lightbox
**Boosts**:
- Current tag removal: **+180 points**
- Single-asset actions: **+100 points**
- Selection toggle: **+90 points**

**Penalties**:
- Bulk actions: **-60 points**

### Scenario 4: Filters Active
**Context**: User has 3+ filters applied
**Boosts**:
- "Clear Filters": **+150 points**
- Active filter toggles: **+60 points**
- Organization (3+ filters): **+100 points**

### Scenario 5: Empty State
**Context**: No assets in gallery
**Boosts**:
- Upload/import: **+200 points** (maximum!)
- Help/tutorial: **+150 points**

**Penalties**:
- Tagging/filtering: **-100 points**

## Quick Start

### 1. Basic Integration

```typescript
import { scoreAndRankCommands, createScoringContext } from '@/lib/commands/scoring-algorithm'

// In your component
const rankedCommands = useMemo(() => {
  const context = createScoringContext({
    selectionCount: selectedAssets.length,
    lightboxOpen: !!activeLightboxAsset,
    activeFilterCount: activeFilters.length,
    totalAssets: assets.length,
    searchQuery
  })

  return scoreAndRankCommands(
    rawCommands,
    context,
    userSettings?.commandPalette
  )
}, [rawCommands, selectedAssets, activeLightboxAsset, activeFilters, assets, searchQuery, userSettings])
```

### 2. Track Command Usage

```typescript
import { trackCommandUsage } from '@/lib/commands/usage-tracker'

function handleCommandSelect(commandId: string) {
  // Execute command
  const command = commands.find(c => c.id === commandId)
  command?.onSelect()

  // Track usage
  const updatedSettings = trackCommandUsage(
    { commandId, previousCommandId: lastCommandId },
    currentSettings?.commandPalette
  )

  // Save to database
  await updateCommandPaletteSettings(updatedSettings)

  // Remember for co-occurrence
  setLastCommandId(commandId)
}
```

### 3. Manage Favorites

```typescript
import { toggleFavorite } from '@/lib/commands/usage-tracker'

function handlePinCommand(commandId: string) {
  const updatedSettings = toggleFavorite(commandId, currentSettings?.commandPalette)
  await updateCommandPaletteSettings(updatedSettings)
}
```

## Usage Patterns

The system automatically learns from your behavior:

### Time-of-Day Patterns
```typescript
// Example: User tags photos at 2-3pm every day
timeOfDayPattern: {
  "14": 25,  // 25 uses at 2pm
  "15": 30   // 30 uses at 3pm
}
// Result: Tagging commands boosted during afternoon hours
```

### Day-of-Week Patterns
```typescript
// Example: User filters by team on Mondays
dayOfWeekPattern: {
  "1": 45,   // 45 uses on Monday
  "2": 12    // 12 uses on Tuesday
}
// Result: Team filtering boosted on Mondays
```

### Co-occurrence Patterns
```typescript
// Example: User often tags after selecting all
commandPairs: {
  "selection-all": {
    followedBy: {
      "tag-lash-classic": 15,  // 15 times
      "tag-team-sarah": 8       // 8 times
    }
  }
}
// Result: Tagging commands boosted after "Select All"
```

## API Reference

### Main Functions

#### `scoreAndRankCommands()`
Scores and ranks commands based on context and user behavior.

```typescript
function scoreAndRankCommands(
  commands: CommandItem[],
  context: ScoringContext,
  userSettings?: DamSettingsData['commandPalette'],
  options?: ScoringOptions
): ScoredCommand[]
```

**Parameters:**
- `commands` - Array of commands to score
- `context` - Current application context (see `createScoringContext()`)
- `userSettings` - User's command palette settings from database
- `options` - Optional scoring configuration

**Options:**
```typescript
{
  includeBreakdown?: boolean,  // Include detailed score breakdown
  maxResults?: number,         // Limit number of results
  minScore?: number,           // Filter by minimum score (-1 = show hidden)
  boostMultiplier?: number     // Global score multiplier (default 1.0)
}
```

**Returns:** Array of scored commands, sorted by score (descending)

#### `createScoringContext()`
Creates a scoring context from current app state.

```typescript
function createScoringContext(params: {
  selectionCount?: number
  lightboxOpen?: boolean
  activeAssetName?: string
  activeFilterCount?: number
  totalAssets?: number
  searchQuery?: string
  lastCommandId?: string
}): ScoringContext
```

**Returns:** Complete scoring context with computed properties

#### `trackCommandUsage()`
Records command execution and updates usage patterns.

```typescript
function trackCommandUsage(
  update: {
    commandId: string
    timestamp?: Date
    previousCommandId?: string
  },
  currentSettings?: DamSettingsData['commandPalette']
): DamSettingsData['commandPalette']
```

**Returns:** Updated settings object to save to database

### Helper Functions

#### `toggleFavorite(commandId, settings)`
Toggles a command as favorite (pinned).

#### `toggleHidden(commandId, settings)`
Toggles a command as hidden.

#### `getMostFrequentCommands(settings, limit)`
Gets most frequently used commands.

#### `getMostRecentCommands(settings, limit)`
Gets most recently used commands.

#### `getCommandsFollowing(commandId, settings, limit)`
Gets commands commonly used after a specific command.

#### `groupScoredCommands(commands)`
Groups scored commands by their group property.

#### `getTopCommands(commands, count)`
Gets top N commands from scored list.

## Example Scenarios

### Scenario 1: New User (No Usage Data)

```typescript
const context = createScoringContext({
  selectionCount: 5,
  totalAssets: 100,
  searchQuery: 'classic'
})

const ranked = scoreAndRankCommands(commands, context)

// Expected results:
// 1. Search matches ("Classic Lashes") - high search score
// 2. Tagging commands - high context score (selection active)
// 3. Other commands - sorted by context relevance
```

### Scenario 2: Experienced User

```typescript
const settings = {
  favorites: ['selection-all'],
  commandUsage: {
    'tag-lash-classic': { count: 50, lastUsed: '2024-01-15T14:30:00Z', ... }
  },
  commandPairs: {
    'selection-all': { followedBy: { 'tag-lash-classic': 15 } }
  }
}

const context = createScoringContext({
  selectionCount: 5,
  lastCommandId: 'selection-all'
})

const ranked = scoreAndRankCommands(commands, context, settings)

// Expected results:
// 1. "Select All" - pinned favorite (1000 pts)
// 2. "Classic Lashes" - frequent + recent + co-occurrence + context
// 3. Other tagging commands - context boost
// 4. Other commands - sorted by usage patterns
```

### Scenario 3: Empty Gallery

```typescript
const context = createScoringContext({
  selectionCount: 0,
  totalAssets: 0  // Empty state
})

const ranked = scoreAndRankCommands(commands, context, settings)

// Expected results:
// 1. Upload commands - massive boost (+200 pts)
// 2. Help/tutorial - strong boost (+150 pts)
// 3. Other commands - penalized (can't use without assets)
```

## Integration Checklist

- [ ] Import scoring functions into command palette component
- [ ] Create scoring context from app state
- [ ] Replace raw commands with scored/ranked commands
- [ ] Implement command execution tracking
- [ ] Save updated settings to database after each command
- [ ] Add UI for pinning/hiding commands (optional)
- [ ] Test with different contexts (selection, lightbox, filters, etc.)
- [ ] Monitor score breakdowns during development (set `includeBreakdown: true`)

## Performance Notes

### Optimization Tips

1. **Memoize scoring context** - Only recompute when dependencies change
2. **Limit results** - Use `maxResults` option to cap at 50-100 commands
3. **Debounce search** - Don't rescore on every keystroke
4. **Batch updates** - Save settings after palette closes, not on every command

### Performance Characteristics

- **Scoring 100 commands**: ~2-5ms
- **With score breakdown**: ~3-8ms
- **Memory usage**: Minimal (no caching)
- **Database impact**: One write per command execution

## Testing

Run the test scenarios:

```typescript
import { testScoringScenarios } from '@/lib/commands/integration-example'

// In browser console or test file
testScoringScenarios()
```

This will log scoring results for different scenarios.

## Troubleshooting

### Commands not scoring as expected

1. Enable score breakdown: `includeBreakdown: true`
2. Log the breakdown for top commands
3. Check context values are correct
4. Verify user settings are loaded properly

### Usage patterns not learning

1. Confirm `trackCommandUsage()` is called after each command
2. Verify settings are saved to database
3. Check settings are loaded on next session
4. Ensure `previousCommandId` is tracked for co-occurrence

### Performance issues

1. Reduce `maxResults` limit
2. Remove `includeBreakdown` in production
3. Memoize context creation
4. Debounce search query updates

## Future Enhancements

Potential improvements for future phases:

- **Machine learning** - More sophisticated pattern recognition
- **Command aliases** - Multiple names for same command
- **Natural language** - "tag all as classic lashes"
- **Predictive preloading** - Preload likely next commands
- **Analytics dashboard** - Visualize usage patterns
- **Team patterns** - Learn from organization-wide behavior
- **A/B testing** - Test different scoring weights

## Support

For questions or issues with the scoring system:

1. Check this documentation
2. Review `integration-example.ts` for usage patterns
3. Enable `includeBreakdown` to debug scoring
4. Check console for warnings/errors

## Version

**Current Version**: 1.0.0
**Last Updated**: 2025-11-16
**Schema Version**: 1 (in `dam_user_settings.commandPalette.version`)
