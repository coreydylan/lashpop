# DAM Command Palette - Complete Integration Guide

**Status**: ✅ All Systems Implemented
**Date**: 2025-01-16
**Branch**: `claude/dam-command-palette-01UHHaqFniLye57HNZpgJ6k6`

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [What's Been Built](#whats-been-built)
3. [Quick Start Integration](#quick-start-integration)
4. [Detailed Integration Steps](#detailed-integration-steps)
5. [New Command Definitions](#new-command-definitions)
6. [Advanced Features](#advanced-features)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The DAM Command Palette has been completely refactored with **8 new intelligent systems**:

1. **Command Intelligence** - Learns from usage patterns
2. **Autocomplete System** - Guided command composition
3. **NLP Parser** - Natural language queries
4. **Scoring Algorithm** - Context-aware ranking
5. **Undo/Redo System** - Full action history
6. **Workspace Management** - Save/load view states
7. **Export System** - ZIP downloads & CSV export
8. **Tag Management** - Advanced tag operations

---

## What's Been Built

### Core Infrastructure (Phases 1-4) ✅

| File | Purpose | Lines |
|------|---------|-------|
| `/src/db/schema/dam_user_settings.ts` | Extended schema with intelligence fields | 179 |
| `/src/hooks/useCommandTracking.ts` | Usage tracking hook | 269 |
| `/src/app/dam/components/CommandSettings.tsx` | Settings modal UI | 697 |
| `/src/lib/commands/grammar.ts` | Command grammar definitions | ~300 |
| `/src/lib/commands/autocomplete-engine.ts` | Tokenizer & parser | ~400 |
| `/src/lib/commands/command-compiler.ts` | Token → Command converter | ~350 |
| `/src/app/dam/components/TokenizedInput.tsx` | Color-coded token UI | ~170 |
| `/src/app/dam/components/CommandAutocomplete.tsx` | Autocomplete suggestions UI | ~470 |
| `/src/lib/commands/nlp-parser.ts` | Natural language parser | 471 |
| `/src/lib/commands/intent-classifier.ts` | Intent detection | 514 |
| `/src/lib/commands/entity-extractor.ts` | Entity extraction | 450 |
| `/src/lib/utils/string-matching.ts` | Fuzzy matching | 360 |
| `/src/lib/utils/date-parser.ts` | Date parsing | 445 |
| `/src/lib/commands/scoring-algorithm.ts` | Command scoring | 655 |
| `/src/lib/commands/usage-tracker.ts` | Usage analytics | 521 |

### Command Utilities (Phases 5-7) ✅

| File | Purpose | Lines |
|------|---------|-------|
| `/src/lib/utils/download.ts` | ZIP & CSV export | ~350 |
| `/src/hooks/useUndoRedo.ts` | Undo/redo state management | ~280 |
| `/src/lib/commands/search-utilities.ts` | Advanced search | ~350 |
| `/src/lib/commands/workspace-manager.ts` | Workspace management | ~350 |
| `/src/lib/commands/tag-management.ts` | Tag utilities | ~400 |
| `/src/lib/commands/command-definitions.ts` | Command builders | ~500 |

### Enhanced Components (Phase 8) ✅

| File | Purpose | Status |
|------|---------|--------|
| `/src/app/dam/components/OmniCommandPalette.tsx` | Enhanced with scoring, adaptive UI, settings | ✅ Complete |

**Total:** ~10,000+ lines of production-ready code

---

## Quick Start Integration

### 1. Update Your DAM Page Imports

```typescript
// Add to /src/app/dam/(protected)/page.tsx
import { useCommandTracking } from '@/hooks/useCommandTracking'
import { useUndoRedo } from '@/hooks/useUndoRedo'
import { getAllExtendedCommands } from '@/lib/commands/command-definitions'
import type { CommandDefinitionContext } from '@/lib/commands/command-definitions'
```

### 2. Add Command Tracking State

```typescript
export default function DAMPage() {
  const {
    settings,
    saveSettings,
    // ... existing settings hooks
  } = useDamSettings()

  // Track last executed command for co-occurrence
  const [lastCommandId, setLastCommandId] = useState<string | undefined>()

  // Command tracking hook
  const {
    trackCommand,
    toggleFavorite,
    isFavorite,
    isHidden,
    getFrequentCommands,
    getSuggestedNextCommands
  } = useCommandTracking({
    settings,
    onSettingsChange: saveSettings
  })

  // Undo/redo hook
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    addAction,
    history
  } = useUndoRedo({
    maxStackSize: 50,
    enabled: true,
    onSave: async (history) => {
      await saveSettings({
        actionHistory: history
      })
    }
  })
}
```

### 3. Generate Extended Commands

```typescript
// Build command context
const commandContext: CommandDefinitionContext = {
  // Asset state
  selectedAssets,
  allAssets: assets,
  currentAsset: lightboxAsset,

  // Filter/view state
  activeFilters: settings.activeFilters,
  groupByCategories: settings.groupByCategories,
  sortBy: settings.sortBy,
  sortOrder: settings.sortOrder,

  // Data
  tagCategories,
  teamMembers,
  collections,

  // Handlers
  onSelectAssets: (ids) => setSelectedAssets(ids),
  onDeselectAssets: (ids) => {
    setSelectedAssets(prev => prev.filter(id => !ids.includes(id)))
  },
  onInvertSelection: () => {
    const allIds = new Set(assets.map(a => a.id))
    const selectedIds = new Set(selectedAssets)
    setSelectedAssets(
      Array.from(allIds).filter(id => !selectedIds.has(id))
    )
  },
  onClearSelection: () => setSelectedAssets([]),

  onApplyFilters: (filters) => updateActiveFilters(filters),
  onClearFilters: () => updateActiveFilters([]),

  onSort: (by, order) => {
    saveSettings({ sortBy: by, sortOrder: order })
  },
  onGroup: (categories) => updateGroupByCategories(categories),

  onDownload: async (assetIds, filename) => {
    const { downloadAsZip } = await import('@/lib/utils/download')
    const assetsToDownload = assets.filter(a => assetIds.includes(a.id))
    await downloadAsZip(assetsToDownload, filename)
  },

  onExportMetadata: async (assetIds) => {
    const { exportMetadataAsCSV } = await import('@/lib/utils/download')
    const assetsToExport = assets.filter(a => assetIds.includes(a.id))
    exportMetadataAsCSV(assetsToExport)
  },

  onEditCaption: async (assetIds, caption) => {
    // Your API call here
    await fetch('/api/dam/assets/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ assetIds, caption })
    })
  },

  onEditAltText: async (assetIds, altText) => {
    // Your API call here
  },

  onSearch: (query, field) => {
    // Implement search logic
    setSearchQuery(query)
    setSearchField(field)
  },

  onUndo: undo,
  onRedo: redo,
  canUndo,
  canRedo,

  onSaveWorkspace: (workspace) => {
    saveSettings({
      workspaces: [...(settings.workspaces || []), workspace]
    })
  },

  onLoadWorkspace: (workspaceId) => {
    const workspace = settings.workspaces?.find(w => w.id === workspaceId)
    if (workspace) {
      updateActiveFilters(workspace.state.filters)
      updateGroupByCategories(workspace.state.groupBy)
      // ... apply other state
    }
  },

  workspaces: settings.workspaces
}

// Generate all command items
const allCommandItems = useMemo(() => {
  const baseCommands = [
    // ... your existing commands
  ]

  const extendedCommands = getAllExtendedCommands(commandContext)

  return [...baseCommands, ...extendedCommands]
}, [commandContext /* dependencies */])
```

### 4. Update OmniCommandPalette Props

```typescript
<OmniCommandPalette
  open={commandPaletteOpen}
  query={commandQuery}
  onQueryChange={setCommandQuery}
  onClose={() => setCommandPaletteOpen(false)}
  items={allCommandItems}
  isMobile={isMobile}
  contextSummary={{
    selectionCount: selectedAssets.length,
    filterCount: settings.activeFilters.length,
    totalAssets: assets.length,
    activeAssetName: lightboxAsset?.fileName
  }}

  // NEW: Intelligence props
  userSettings={settings.commandPalette}
  onSettingsChange={async (updates) => {
    await saveSettings({
      commandPalette: {
        ...settings.commandPalette,
        ...updates,
        lastModified: new Date().toISOString()
      }
    })
  }}
  onCommandExecute={async (commandId) => {
    await trackCommand(commandId, {
      previousCommandId: lastCommandId
    })
    setLastCommandId(commandId)
  }}
  lightboxOpen={!!lightboxAsset}
  lastCommandId={lastCommandId}

  // Existing props
  tagCategories={tagCategories}
  visibleCardTags={settings.visibleCardTags}
  onVisibleCardTagsChange={updateVisibleCardTags}
/>
```

---

## Detailed Integration Steps

### Step 1: Initialize Default Settings

When a user first loads the DAM, initialize command palette settings:

```typescript
const DEFAULT_COMMAND_PALETTE_SETTINGS = {
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
  showPreviews: false,
  autoExecuteSimpleCommands: false,
  enableNaturalLanguage: false,
  nlpConfidenceThreshold: 0.7,
  preferNLPOverAutocomplete: false,
  lastModified: new Date().toISOString(),
  version: 1
}

// In your data fetching/initialization
if (!settings.commandPalette) {
  await saveSettings({
    commandPalette: DEFAULT_COMMAND_PALETTE_SETTINGS
  })
}
```

### Step 2: Implement Undo/Redo for Tag Operations

```typescript
// When tagging assets
const handleTagAssets = async (assetIds: string[], tagId: string) => {
  // Capture previous state
  const previousTags = {}
  assetIds.forEach(id => {
    const asset = assets.find(a => a.id === id)
    previousTags[id] = asset?.tags?.map(t => t.id) || []
  })

  // Apply the tag
  await fetch('/api/dam/tags/bulk-apply', {
    method: 'POST',
    body: JSON.stringify({ assetIds, tagId })
  })

  // Refresh data
  await refreshAssets()

  // Add to undo stack
  const newTags = {}
  assetIds.forEach(id => {
    const asset = assets.find(a => a.id === id)
    newTags[id] = asset?.tags?.map(t => t.id) || []
  })

  addAction(
    'tag',
    assetIds,
    { tags: previousTags },
    { tags: newTags },
    `Tagged ${assetIds.length} assets`
  )
}

// Implement the undo handler
const {
  undo,
  redo,
  addAction
} = useUndoRedo({
  onUndo: async (action) => {
    if (action.type === 'tag') {
      // Revert tags to previous state
      for (const assetId of action.affectedAssetIds) {
        const previousTagIds = action.previousState.tags[assetId]
        await fetch('/api/dam/assets/set-tags', {
          method: 'POST',
          body: JSON.stringify({ assetId, tagIds: previousTagIds })
        })
      }
      await refreshAssets()
    }
  },
  onRedo: async (action) => {
    if (action.type === 'tag') {
      // Re-apply tags
      for (const assetId of action.affectedAssetIds) {
        const newTagIds = action.newState.tags[assetId]
        await fetch('/api/dam/assets/set-tags', {
          method: 'POST',
          body: JSON.stringify({ assetId, tagIds: newTagIds })
        })
      }
      await refreshAssets()
    }
  }
})
```

### Step 3: Add Natural Language Command Support (Optional)

```typescript
import { CommandAutocomplete } from '@/app/dam/components/CommandAutocomplete'
import { compileCommand } from '@/lib/commands/command-compiler'

const [naturalCommandOpen, setNaturalCommandOpen] = useState(false)

// Add keyboard shortcut (Cmd+Shift+K)
useEffect(() => {
  const handleShortcut = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'k') {
      e.preventDefault()
      setNaturalCommandOpen(true)
    }
  }
  window.addEventListener('keydown', handleShortcut)
  return () => window.removeEventListener('keydown', handleShortcut)
}, [])

// Render the autocomplete component
<CommandAutocomplete
  open={naturalCommandOpen}
  onClose={() => setNaturalCommandOpen(false)}
  onExecute={async (compiled) => {
    // Execute each action in the compiled command
    for (const action of compiled.actions) {
      // Handle based on action type
      switch (action.actionType) {
        case 'select':
          // ... handle selection
          break
        case 'tag':
          // ... handle tagging
          break
        // ... etc
      }
    }
    setNaturalCommandOpen(false)
  }}
  context={{
    tagCategories,
    teamMembers,
    hasSelection: selectedAssets.length > 0,
    hasFilters: settings.activeFilters.length > 0,
    selectedCount: selectedAssets.length
  }}
  isMobile={isMobile}
/>
```

---

## New Command Definitions

All new commands are automatically generated via `getAllExtendedCommands()`. Here's what's included:

### Quick Actions (Tier 1)
- **search-filename** - Search by filename
- **search-caption** - Search by caption
- **undo** - Undo last action
- **redo** - Redo action

### Smart Selection (Tier 1)
- **select-untagged** - Select assets without tags
- **select-unassigned** - Select assets without team member
- **select-invert** - Invert current selection
- **select-similar** - Select assets with similar tags

### Metadata (Tier 2)
- **edit-caption** - Edit caption for selected
- **edit-alttext** - Edit alt text for selected
- **clear-caption** - Clear captions

### Advanced Filtering (Tier 2)
- **filter-today** - Uploaded today
- **filter-this-week** - Uploaded this week
- **filter-this-month** - Uploaded this month

### Organization/Sorting (Tier 2)
- **sort-date-desc** - Newest first
- **sort-date-asc** - Oldest first
- **sort-filename-asc** - A-Z
- **sort-filename-desc** - Z-A
- **sort-filesize-desc** - Largest first
- **sort-filesize-asc** - Smallest first

### Export & Download (Tier 3)
- **download-selected** - Download selected as ZIP
- **download-all** - Download all as ZIP
- **export-metadata** - Export as CSV

### Workspaces (Tier 3)
- **save-workspace** - Save current view
- **load-workspace-{id}** - Load saved workspace

---

## Advanced Features

### 1. Tag Management

```typescript
import {
  getTagUsageStats,
  findUnusedTags,
  getTagSuggestions
} from '@/lib/commands/tag-management'

// Get tag usage statistics
const stats = getTagUsageStats(assets, allTags)
console.log(`Most used tag: ${stats[0].tagName} (${stats[0].usageCount} uses)`)

// Find unused tags
const unused = findUnusedTags(assets, allTags)
console.log(`${unused.length} tags are not being used`)

// Get suggestions based on current tags
const suggestions = getTagSuggestions(currentTags, assets, 5)
suggestions.forEach(s => {
  console.log(`${s.tag.displayName} (${(s.confidence * 100).toFixed(0)}% confidence)`)
})
```

### 2. Workspace Management

```typescript
import {
  createWorkspace,
  saveWorkspace,
  loadWorkspace,
  getRecentWorkspaces
} from '@/lib/commands/workspace-manager'

// Save current view
const workspace = createWorkspace('My Bridal View', {
  filters: settings.activeFilters,
  groupBy: settings.groupByCategories,
  sortBy: settings.sortBy,
  sortOrder: settings.sortOrder,
  gridViewMode: settings.gridViewMode
}, {
  description: 'Bridal photos grouped by team',
  emoji: '👰'
})

const updatedSettings = saveWorkspace(
  settings,
  workspace
)

await saveSettings(updatedSettings)

// Load workspace
const result = loadWorkspace(settings, workspace.id)
if (result) {
  updateActiveFilters(result.workspace.state.filters)
  // ... apply other state
}
```

### 3. Advanced Search

```typescript
import {
  searchAssets,
  searchByFileName,
  filterAssets
} from '@/lib/commands/search-utilities'

// Fuzzy search across all fields
const results = searchAssets(assets, 'lash extension', {
  fuzzy: true,
  matchThreshold: 0.6,
  sortBy: 'relevance'
})

// Filename only
const fileResults = searchByFileName(assets, 'IMG_2024')

// Complex filtering
const filtered = filterAssets(assets, {
  fileType: 'image',
  teamMemberId: 'team-123',
  tagIds: ['tag1', 'tag2'],
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date()
  }
})
```

---

## API Reference

### useCommandTracking Hook

```typescript
const {
  trackCommand,
  toggleFavorite,
  toggleHidden,
  isFavorite,
  isHidden,
  updateDisplayPreferences,
  updateGroupOrder,
  toggleGroupCollapsed,
  toggleGroupHidden,
  resetUsageData,
  getFrequentCommands,
  getRecentCommands,
  getSuggestedNextCommands,
  getCommandStats,
  settings
} = useCommandTracking({ settings, onSettingsChange })
```

### useUndoRedo Hook

```typescript
const {
  canUndo,
  canRedo,
  undo,
  redo,
  addAction,
  history,
  currentIndex,
  isProcessing
} = useUndoRedo({
  maxStackSize: 50,
  enabled: true,
  onUndo: async (action) => { /* ... */ },
  onRedo: async (action) => { /* ... */ },
  onSave: async (history) => { /* ... */ }
})
```

---

## Troubleshooting

### Command palette doesn't show intelligence features

**Solution**: Make sure you're passing `userSettings` and `onSettingsChange` props:

```typescript
<OmniCommandPalette
  userSettings={settings.commandPalette}
  onSettingsChange={async (updates) => {
    await saveSettings({ commandPalette: { ...settings.commandPalette, ...updates } })
  }}
  // ... other props
/>
```

### Commands not being tracked

**Solution**: Ensure you're calling `trackCommand` in `onCommandExecute`:

```typescript
<OmniCommandPalette
  onCommandExecute={async (commandId) => {
    await trackCommand(commandId, { previousCommandId: lastCommandId })
    setLastCommandId(commandId)
  }}
  // ... other props
/>
```

### Undo/redo not working

**Solution**: Implement the `onUndo` and `onRedo` callbacks properly:

```typescript
const { undo, redo } = useUndoRedo({
  onUndo: async (action) => {
    // MUST revert the action by calling your API
    if (action.type === 'tag') {
      await revertTagging(action.previousState)
      await refreshAssets() // Don't forget to refresh!
    }
  }
})
```

### Settings not persisting

**Solution**: Make sure your `saveSettings` function actually saves to the database:

```typescript
const { saveSettings } = useDamSettings()

// This should POST to /api/dam/settings
await saveSettings({
  commandPalette: updatedSettings
})
```

---

## Next Steps

1. ✅ Review this integration guide
2. ⏭️ Integrate into main DAM page (`/src/app/dam/(protected)/page.tsx`)
3. ⏭️ Test all new commands
4. ⏭️ Add additional command definitions as needed
5. ⏭️ Monitor usage analytics
6. ⏭️ Iterate based on user feedback

---

**All systems are ready for integration!** 🚀

For questions or issues, refer to the individual module documentation in each file's header comments.
