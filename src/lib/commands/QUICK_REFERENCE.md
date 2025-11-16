# Command Scoring System - Quick Reference

## Basic Usage

```typescript
import {
  scoreAndRankCommands,
  createScoringContext,
  trackCommandUsage
} from '@/lib/commands'

// 1. Create context
const context = createScoringContext({
  selectionCount: selectedAssets.length,
  lightboxOpen: !!activeLightboxAsset,
  activeFilterCount: activeFilters.length,
  totalAssets: assets.length,
  searchQuery
})

// 2. Score commands
const ranked = scoreAndRankCommands(commands, context, userSettings?.commandPalette)

// 3. Track usage
const handleCommand = (commandId: string) => {
  const updated = trackCommandUsage({ commandId }, userSettings?.commandPalette)
  await saveSettings(updated)
}
```

## Scoring Weights

| Factor | Max Points |
|--------|-----------|
| Pin | 1000 |
| Frequency | 100 |
| Recency | 50 |
| Context | 200 |
| Time-of-Day | 30 |
| Day-of-Week | 20 |
| Co-occurrence | 50 |
| Search | 100 |

## Context Boosts

### Selection Active
- Tagging: **+150**
- Team: **+150**
- Export: **+120**
- Filtering: **-50**

### No Selection
- Filtering: **+120**
- Select All: **+100**
- Tagging: **-80**

### Lightbox Open
- Current Tags: **+180**
- Single Actions: **+100**
- Bulk Actions: **-60**

### Filters Active
- Clear Filters: **+150**
- Active Toggle: **+60**

### Empty State
- Upload: **+200**
- Help: **+150**
- Actions: **-100**

## Common Functions

```typescript
// Score with options
scoreAndRankCommands(commands, context, settings, {
  includeBreakdown: true,
  maxResults: 50,
  minScore: 0
})

// Manage favorites
toggleFavorite(commandId, settings)
addFavorite(commandId, settings)
removeFavorite(commandId, settings)

// Manage hidden
toggleHidden(commandId, settings)
hideCommand(commandId, settings)
unhideCommand(commandId, settings)

// Analytics
getMostFrequentCommands(settings, 10)
getMostRecentCommands(settings, 10)
getCommandsFollowing(commandId, settings, 5)
```

## Debugging

```typescript
// Enable detailed breakdown
const ranked = scoreAndRankCommands(commands, context, settings, {
  includeBreakdown: true
})

console.log(ranked[0].scoreBreakdown)
// {
//   pinBonus: 0,
//   frequencyScore: 85,
//   recencyScore: 42,
//   contextScore: 150,
//   timeOfDayScore: 25,
//   dayOfWeekScore: 15,
//   coOccurrenceScore: 35,
//   searchScore: 90,
//   total: 442
// }
```

## Integration Checklist

- [ ] Import scoring functions
- [ ] Create scoring context
- [ ] Score commands in useMemo
- [ ] Track command usage on select
- [ ] Save settings to database
- [ ] Test different contexts
- [ ] Monitor score breakdowns
- [ ] Add pin/hide UI (optional)
