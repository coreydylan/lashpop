# DAM Command Palette - Master Implementation Plan

> **Vision**: Create an intelligent, adaptive command palette that makes the DAM system fully keyboard-navigable with natural language autocomplete, personalized command prioritization, and comprehensive feature coverage.

**Last Updated**: 2025-01-16
**Status**: Planning Phase
**Target Completion**: 5 weeks

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Features](#core-features)
3. [Technical Architecture](#technical-architecture)
4. [Implementation Phases](#implementation-phases)
5. [Database Schema](#database-schema)
6. [Command Grammar & Autocomplete](#command-grammar--autocomplete)
7. [Natural Language Processing](#natural-language-processing)
8. [Intelligence & Personalization](#intelligence--personalization)
9. [New Commands by Category](#new-commands-by-category)
10. [UI/UX Design](#uiux-design)
11. [Testing Strategy](#testing-strategy)
12. [Success Metrics](#success-metrics)

---

## 🎯 Executive Summary

### The Problem
- Users can't easily discover all DAM features
- Many powerful operations require multiple clicks through modals
- No keyboard-centric workflow for power users
- Existing command palette has limited coverage
- No personalization or learning from user behavior

### The Solution
Build an intelligent command palette system with:

1. **Autocomplete Command Composition** - Guide users through building commands step-by-step
2. **Natural Language Understanding** - Parse queries like "select alice's photos from last week"
3. **Adaptive Intelligence** - Learn from usage patterns and prioritize frequently-used commands
4. **Complete Feature Coverage** - Every DAM operation accessible via keyboard
5. **Smart Suggestions** - Context-aware recommendations based on current state
6. **User Customization** - Pin favorites, hide unused commands, reorder groups

### Key Benefits
- ⚡ **10x faster** workflows for power users
- 🎓 **Easier learning curve** through guided autocomplete
- 🤖 **Smarter interface** that adapts to each user
- ⌨️ **100% keyboard accessible** - mouse optional
- 🎨 **Better UX** through progressive disclosure

---

## 🌟 Core Features

### 1. Autocomplete Command Composition System
**Status**: New Feature
**Priority**: P0 (Critical)

Build commands progressively through intelligent suggestions:

```
User types: "select"
  → Suggests: all | untagged | by filter | where...

User types: "select untagged"
  → Shows: 47 assets will be selected
  → Suggests: and tag as... | and delete | from team...

User completes: "select untagged and tag as bridal"
  → Executes multi-step command
```

**Key Components**:
- Command grammar definition (verbs, objects, modifiers, chainers)
- Token parser and validator
- Suggestion engine with context awareness
- Real-time preview of command effects
- Multi-step command chaining

### 2. Natural Language Search (Client-Side)
**Status**: New Feature
**Priority**: P0 (Critical)

Understand natural language queries:

| User Input | Intent | Matched Commands |
|------------|--------|------------------|
| "show me photos from last week" | FILTER + VIEW | Filter uploaded this week |
| "find alice's ombré work" | SEARCH + FILTER | Select by Filter › Team › Alice + Style › Ombré |
| "tag these as bridal" | TAG | Tagging › Style › Bridal |
| "delete selected" | DELETE | Delete selected photos |
| "undo that" | UNDO | Undo last tag operation |

**Key Components**:
- Intent classification (SELECT, FILTER, TAG, DELETE, etc.)
- Entity extraction (tags, team members, time ranges)
- Keyword matching with synonyms
- Fuzzy string matching
- Semantic similarity (optional with Transformers.js)

### 3. Command Usage Tracking & Intelligence
**Status**: New Feature
**Priority**: P0 (Critical)

Track every command execution and adapt the interface:

**Tracked Data**:
- Command execution count
- Last used timestamp
- Time of day patterns
- Co-occurrence patterns (commands used together)
- Average time to select

**Intelligent Features**:
- "Frequently Used" section at top of palette
- "Suggested for You" based on context
- Smart command ranking algorithm
- Usage statistics dashboard

### 4. Command Palette Settings & Customization
**Status**: New Feature
**Priority**: P1 (High)

**Settings Panel Sections**:

#### ⭐ Favorites & Pinned Commands
- Pin commands to top of palette
- Drag to reorder pinned commands
- Quick add/remove favorites

#### 📊 Display Preferences
- Toggle "Frequently Used" section
- Set number of frequent commands to show
- Enable/disable smart suggestions
- Auto-organize by usage frequency
- Collapse unused groups by default

#### 📁 Command Groups
- Drag to reorder groups
- Hide/show entire groups
- Set groups to collapsed by default
- Custom group naming

#### 📈 Usage Statistics
- View most-used commands
- See usage over time
- Reset usage data
- Export statistics

#### 🙈 Hidden Commands
- View and restore hidden commands
- Batch hide/unhide operations

### 5. Select by Filter (Already Implemented ✅)
**Status**: Completed
**Priority**: P0 (Critical)

Build complex selections using filters without applying them:

- Toggle between "Replace Selection" and "Add to Selection" modes
- Select all assets matching a tag
- Select all assets by team member
- Combine multiple filters to build selection groups
- Real-time count of matching assets

---

## 🏛️ Technical Architecture

### Frontend Stack

```
┌─────────────────────────────────────────────────────────┐
│                   User Interface Layer                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Command UI  │  │ Settings UI  │  │  Stats UI    │  │
│  │  (Palette)   │  │   (Modal)    │  │  (Dashboard) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                Intelligence & Matching Layer             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Autocomplete │  │     NLP      │  │   Scoring    │  │
│  │    Engine    │  │   Parser     │  │  Algorithm   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    State Management                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Settings   │  │ Usage Stats  │  │   Command    │  │
│  │     Hook     │  │    Store     │  │    State     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                      Data Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Settings   │  │    Assets    │  │    Tags      │  │
│  │   Database   │  │   Database   │  │   Database   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Key Technologies

```json
{
  "dependencies": {
    // Existing
    "react": "^18.x",
    "next": "^15.x",
    "drizzle-orm": "^0.x",

    // New - NLP & Autocomplete
    "@xenova/transformers": "^2.17.0",  // Optional: Semantic search
    "string-similarity": "^4.0.4",      // Fuzzy matching
    "fastest-levenshtein": "^1.0.16",   // String distance
    "chrono-node": "^2.7.0",            // Natural date parsing
    "date-fns": "^3.0.0",               // Date utilities

    // New - File Operations
    "jszip": "^3.10.1",                 // ZIP export
    "file-saver": "^2.0.5",             // Download handling

    // New - Undo/Redo
    "immer": "^10.0.3",                 // Immutable state updates

    // Optional - Advanced Features
    "natural": "^6.10.0"                // Stemming/lemmatization
  }
}
```

### File Structure

```
src/
├── app/dam/
│   ├── components/
│   │   ├── OmniCommandPalette.tsx          # Main palette UI
│   │   ├── CommandAutocomplete.tsx         # NEW: Autocomplete UI
│   │   ├── CommandSettings.tsx             # NEW: Settings modal
│   │   ├── CommandStats.tsx                # NEW: Stats dashboard
│   │   └── TokenizedInput.tsx              # NEW: Token display
│   └── (protected)/
│       └── page.tsx                         # Command definitions
│
├── hooks/
│   ├── useDamSettings.ts                    # Existing settings hook
│   ├── useCommandTracking.ts                # NEW: Usage tracking
│   ├── useCommandAutocomplete.ts            # NEW: Autocomplete logic
│   └── useUndoRedo.ts                       # NEW: Undo/redo state
│
├── lib/
│   ├── commands/
│   │   ├── grammar.ts                       # NEW: Command grammar
│   │   ├── autocomplete-engine.ts           # NEW: Autocomplete logic
│   │   ├── nlp-parser.ts                    # NEW: NLP parsing
│   │   ├── intent-classifier.ts             # NEW: Intent detection
│   │   ├── entity-extractor.ts              # NEW: Entity extraction
│   │   ├── scoring-algorithm.ts             # NEW: Command ranking
│   │   └── command-compiler.ts              # NEW: Token → Command
│   │
│   └── utils/
│       ├── download.ts                      # NEW: Download/export
│       ├── string-matching.ts               # NEW: Fuzzy matching
│       └── date-parser.ts                   # NEW: Date parsing
│
└── db/schema/
    └── dam_user_settings.ts                 # Extended with new fields
```

---

## 📅 Implementation Phases

### **Phase 1: Foundation (Week 1)**
**Goal**: Build core infrastructure for intelligence and tracking

#### Tasks:
- [ ] Extend `DamSettingsData` schema with command palette intelligence fields
- [ ] Create database migration for new settings structure
- [ ] Build `useCommandTracking` hook
- [ ] Implement command execution tracking (count, timestamp, duration)
- [ ] Create `CommandSettings.tsx` modal with basic UI
- [ ] Add "Command Palette Settings" command
- [ ] Implement favorites/pinning system

#### Deliverables:
- ✅ Command usage data being tracked
- ✅ Settings modal accessible from palette
- ✅ Users can pin/unpin commands
- ✅ Data persists to database

---

### **Phase 2: Autocomplete System (Week 2)**
**Goal**: Build guided command composition with autocomplete

#### Tasks:
- [ ] Define command grammar (verbs, objects, modifiers, chainers)
- [ ] Create `autocomplete-engine.ts` with tokenizer
- [ ] Implement suggestion generator
- [ ] Build `TokenizedInput.tsx` component
- [ ] Create `CommandAutocomplete.tsx` UI
- [ ] Add real-time command validation
- [ ] Implement command preview system
- [ ] Add multi-step command chaining support

#### Deliverables:
- ✅ Users can build commands by typing progressively
- ✅ Real-time suggestions shown at each step
- ✅ Preview of command effects before execution
- ✅ Support for chained commands ("select untagged and tag as bridal")

---

### **Phase 3: Natural Language Processing (Week 3)**
**Goal**: Add NLP for understanding natural language queries

#### Tasks:
- [ ] Build intent classification system
- [ ] Implement entity extraction (tags, team members, dates)
- [ ] Create keyword matching with synonyms
- [ ] Add fuzzy string matching
- [ ] Implement time range parser (natural dates)
- [ ] Build NLP metadata for all commands
- [ ] Create hybrid matching (autocomplete + NLP)
- [ ] Add confidence scoring

#### Deliverables:
- ✅ Users can type "show me photos from last week" → works
- ✅ Natural language queries parsed and executed
- ✅ Fallback to autocomplete if NLP confidence is low
- ✅ Smart suggestions based on parsed intent

---

### **Phase 4: Intelligence & Ranking (Week 4)**
**Goal**: Make palette adaptive and personalized

#### Tasks:
- [ ] Implement command scoring algorithm
- [ ] Add "Frequently Used" section
- [ ] Build context-aware suggestion boosting
- [ ] Implement co-occurrence pattern detection
- [ ] Add time-of-day pattern analysis
- [ ] Create "Suggested for You" section
- [ ] Build usage statistics dashboard
- [ ] Implement group collapse/reorder
- [ ] Add command hide/show functionality

#### Deliverables:
- ✅ Most-used commands appear at top
- ✅ Context-aware suggestions (e.g., tagging commands when selection active)
- ✅ Statistics dashboard showing usage patterns
- ✅ Customizable group ordering and visibility

---

### **Phase 5: New Commands - Tier 1 (Week 5)**
**Goal**: Add high-impact commands

#### Tasks:
- [ ] **Search & Discovery**
  - [ ] Search by filename
  - [ ] Search by caption/description
  - [ ] View asset details/metadata

- [ ] **Smart Selection**
  - [ ] Select untagged assets
  - [ ] Select assets without team member
  - [ ] Invert selection
  - [ ] Deselect by filter
  - [ ] Select similar (based on tags)

- [ ] **Quick Actions**
  - [ ] Create collection from selection
  - [ ] Add selected to collection
  - [ ] Remove selected from collection
  - [ ] Copy tags from asset
  - [ ] Remove all tags from selected

- [ ] **Undo/Redo**
  - [ ] Undo last tag operation
  - [ ] Redo operation
  - [ ] View action history

#### Deliverables:
- ✅ 15+ new high-value commands
- ✅ Undo/redo works for all tag operations
- ✅ Search finds assets by name/metadata
- ✅ Smart selection tools save time

---

### **Phase 6: New Commands - Tier 2 (Week 6)**
**Goal**: Add metadata and filtering features

#### Tasks:
- [ ] **Metadata Editing**
  - [ ] Edit caption for selected
  - [ ] Edit alt text for selected
  - [ ] Bulk clear captions
  - [ ] Bulk clear alt text
  - [ ] View file info (size, dimensions, date)

- [ ] **Advanced Filtering**
  - [ ] Filter by date range
  - [ ] Filter uploaded this week
  - [ ] Filter uploaded this month
  - [ ] Show recently uploaded
  - [ ] Show recently modified
  - [ ] Clear date filters

- [ ] **Sorting**
  - [ ] Sort by upload date (newest/oldest)
  - [ ] Sort by filename (A-Z/Z-A)
  - [ ] Sort by file size
  - [ ] Shuffle order

#### Deliverables:
- ✅ Caption/alt text editable via command palette
- ✅ Temporal filtering works
- ✅ Multiple sort options available
- ✅ All operations keyboard-accessible

---

### **Phase 7: Export & Advanced Features (Week 7)**
**Goal**: Add export and power user features

#### Tasks:
- [ ] **Export & Download**
  - [ ] Download selected assets as ZIP
  - [ ] Download current view as ZIP
  - [ ] Export metadata as CSV
  - [ ] Copy asset URLs to clipboard

- [ ] **Workspace Management**
  - [ ] Save current view as workspace
  - [ ] Load saved workspace
  - [ ] Delete workspace
  - [ ] List all workspaces

- [ ] **Tag Management**
  - [ ] Show tag usage statistics
  - [ ] Find unused tags
  - [ ] Replace tag across selection
  - [ ] Merge tags

#### Deliverables:
- ✅ Users can download assets in bulk
- ✅ Workspaces save filter+group+sort state
- ✅ Tag management tools available
- ✅ Export capabilities complete

---

### **Phase 8: Polish & Optimization (Week 8)**
**Goal**: Refine UX and performance

#### Tasks:
- [ ] Optimize command ranking algorithm
- [ ] Add keyboard shortcuts for top commands
- [ ] Improve autocomplete performance
- [ ] Add command palette tutorial
- [ ] Polish animations and transitions
- [ ] Add loading states for async operations
- [ ] Implement error handling and recovery
- [ ] Add accessibility features (ARIA, screen reader)
- [ ] Performance testing and optimization
- [ ] User testing and feedback integration

#### Deliverables:
- ✅ Smooth, polished UX
- ✅ Fast performance (< 50ms for suggestions)
- ✅ Comprehensive error handling
- ✅ Full accessibility compliance

---

## 🗄️ Database Schema

### Extended `DamSettingsData` Interface

```typescript
export interface DamSettingsData {
  // ========================================
  // EXISTING FIELDS
  // ========================================
  gridViewMode: 'square' | 'aspect'
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
  groupByCategories: string[]
  visibleCardTags: string[]
  activeCollectionId?: string
  sortBy?: 'uploadDate' | 'fileName' | 'modified' | 'fileSize'
  sortOrder?: 'asc' | 'desc'

  // ========================================
  // NEW: COMMAND PALETTE INTELLIGENCE
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
  // NEW: WORKSPACE MANAGEMENT
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
  // NEW: UNDO/REDO SYSTEM
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
  // NEW: SEARCH HISTORY
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
```

### Migration Strategy

**Option 1**: Extend existing JSONB field (Recommended)
```typescript
// No schema migration needed - just extend the interface
// Existing settings remain intact, new fields are optional
// Gradual rollout with backward compatibility
```

**Option 2**: Separate table for command intelligence
```sql
CREATE TABLE command_palette_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Recommendation**: Use Option 1 - extend existing `dam_user_settings.settings` JSONB field. This keeps related data together and avoids joins.

---

## 📝 Command Grammar & Autocomplete

### Grammar Definition

```typescript
// Define how commands can be composed
interface CommandGrammar {
  verbs: CommandVerb[]
  objects: CommandObject[]
  modifiers: CommandModifier[]
  chainers: CommandChainer[]
  rules: GrammarRule[]
}

// VERBS (Actions)
const VERBS: CommandVerb[] = [
  {
    id: 'select',
    text: 'select',
    aliases: ['choose', 'pick', 'find', 'show', 'get'],
    description: 'Select assets',
    expectsObject: true,
    examples: [
      'select all',
      'select untagged',
      'select where style is ombré',
      'select from alice'
    ]
  },
  {
    id: 'filter',
    text: 'filter',
    aliases: ['show only', 'narrow to', 'limit to'],
    description: 'Filter visible assets',
    expectsObject: true,
    examples: [
      'filter by alice',
      'filter uploaded this week',
      'filter where team is alice'
    ]
  },
  {
    id: 'tag',
    text: 'tag',
    aliases: ['label', 'mark', 'add tag'],
    description: 'Add tags to assets',
    expectsObject: true,
    examples: [
      'tag selected as bridal',
      'tag all as reviewed'
    ]
  },
  {
    id: 'untag',
    text: 'untag',
    aliases: ['remove tag', 'delete tag', 'clear tags'],
    description: 'Remove tags from assets',
    expectsObject: true,
    examples: [
      'untag selected',
      'untag all style tags'
    ]
  },
  {
    id: 'delete',
    text: 'delete',
    aliases: ['remove', 'trash'],
    description: 'Delete assets',
    expectsObject: true,
    examples: [
      'delete selected',
      'delete all untagged'
    ]
  },
  {
    id: 'download',
    text: 'download',
    aliases: ['export', 'save'],
    description: 'Download assets',
    expectsObject: true,
    examples: [
      'download selected',
      'download all as zip'
    ]
  },
  {
    id: 'create',
    text: 'create',
    aliases: ['make', 'new'],
    description: 'Create new items',
    expectsObject: true,
    examples: [
      'create collection from selection',
      'create workspace named bridal'
    ]
  },
  {
    id: 'sort',
    text: 'sort',
    aliases: ['order', 'arrange'],
    description: 'Sort assets',
    expectsObject: true,
    examples: [
      'sort by date',
      'sort by filename'
    ]
  },
  {
    id: 'group',
    text: 'group',
    aliases: ['organize', 'cluster'],
    description: 'Group assets',
    expectsObject: true,
    examples: [
      'group by team',
      'group by style'
    ]
  },
  {
    id: 'view',
    text: 'view',
    aliases: ['show', 'display', 'open'],
    description: 'View information',
    expectsObject: true,
    examples: [
      'view details',
      'view shortcuts',
      'view statistics'
    ]
  },
  {
    id: 'undo',
    text: 'undo',
    aliases: ['revert', 'cancel', 'go back'],
    description: 'Undo last action',
    expectsObject: false,
    examples: ['undo', 'undo last operation']
  },
  {
    id: 'redo',
    text: 'redo',
    aliases: ['restore'],
    description: 'Redo undone action',
    expectsObject: false,
    examples: ['redo']
  },
  {
    id: 'search',
    text: 'search',
    aliases: ['find', 'look for'],
    description: 'Search for assets',
    expectsObject: true,
    examples: [
      'search for alice',
      'search filename contains bridal'
    ]
  },
  {
    id: 'copy',
    text: 'copy',
    aliases: ['duplicate'],
    description: 'Copy data',
    expectsObject: true,
    examples: [
      'copy tags from asset',
      'copy urls to clipboard'
    ]
  },
  {
    id: 'edit',
    text: 'edit',
    aliases: ['modify', 'change'],
    description: 'Edit metadata',
    expectsObject: true,
    examples: [
      'edit caption',
      'edit alt text'
    ]
  },
  {
    id: 'clear',
    text: 'clear',
    aliases: ['reset', 'remove all'],
    description: 'Clear data',
    expectsObject: true,
    examples: [
      'clear selection',
      'clear filters',
      'clear all tags'
    ]
  }
]

// OBJECTS (What verbs act on)
const OBJECTS: CommandObject[] = [
  // Static objects
  {
    id: 'all',
    text: 'all',
    aliases: ['everything'],
    description: 'All assets in view',
    isDynamic: false
  },
  {
    id: 'selected',
    text: 'selected',
    aliases: ['selection', 'these', 'current'],
    description: 'Currently selected assets',
    isDynamic: false
  },
  {
    id: 'untagged',
    text: 'untagged',
    aliases: ['without tags', 'no tags', 'missing tags'],
    description: 'Assets without any tags',
    isDynamic: false
  },
  {
    id: 'unassigned',
    text: 'unassigned',
    aliases: ['without team', 'no team member'],
    description: 'Assets without team member',
    isDynamic: false
  },
  {
    id: 'collection',
    text: 'collection',
    aliases: ['album', 'set'],
    description: 'A collection',
    isDynamic: false
  },
  {
    id: 'workspace',
    text: 'workspace',
    aliases: ['view', 'saved view'],
    description: 'A saved workspace',
    isDynamic: false
  },
  {
    id: 'filters',
    text: 'filters',
    aliases: ['active filters'],
    description: 'Current filters',
    isDynamic: false
  },
  {
    id: 'selection',
    text: 'selection',
    aliases: ['highlighted'],
    description: 'Current selection',
    isDynamic: false
  },

  // Dynamic objects (populated from data)
  {
    id: 'tag',
    text: 'where',
    aliases: ['with tag', 'tagged as', 'having'],
    description: 'Assets with specific tag',
    isDynamic: true,
    source: 'tags'
  },
  {
    id: 'teamMember',
    text: 'from',
    aliases: ['by', 'assigned to', 'created by'],
    description: 'Assets by team member',
    isDynamic: true,
    source: 'teamMembers'
  },
  {
    id: 'collectionName',
    text: 'in',
    aliases: ['from collection'],
    description: 'Assets in collection',
    isDynamic: true,
    source: 'collections'
  }
]

// MODIFIERS (Refine commands)
const MODIFIERS: CommandModifier[] = [
  // Time-based
  {
    id: 'today',
    text: 'today',
    aliases: ['uploaded today'],
    description: 'Uploaded today',
    appliesTo: ['select', 'filter', 'download']
  },
  {
    id: 'yesterday',
    text: 'yesterday',
    aliases: ['uploaded yesterday'],
    description: 'Uploaded yesterday',
    appliesTo: ['select', 'filter', 'download']
  },
  {
    id: 'thisWeek',
    text: 'this week',
    aliases: ['uploaded this week', 'past week'],
    description: 'Uploaded within last 7 days',
    appliesTo: ['select', 'filter', 'download']
  },
  {
    id: 'lastWeek',
    text: 'last week',
    aliases: ['uploaded last week'],
    description: 'Uploaded 7-14 days ago',
    appliesTo: ['select', 'filter', 'download']
  },
  {
    id: 'thisMonth',
    text: 'this month',
    aliases: ['uploaded this month'],
    description: 'Uploaded this calendar month',
    appliesTo: ['select', 'filter', 'download']
  },

  // Format/output modifiers
  {
    id: 'asZip',
    text: 'as zip',
    aliases: ['as archive', 'compressed'],
    description: 'Export as ZIP file',
    appliesTo: ['download', 'export']
  },
  {
    id: 'asCsv',
    text: 'as csv',
    aliases: ['as spreadsheet'],
    description: 'Export metadata as CSV',
    appliesTo: ['export']
  },

  // Source modifiers
  {
    id: 'fromSelection',
    text: 'from selection',
    aliases: ['from selected', 'from these'],
    description: 'Using current selection',
    appliesTo: ['create', 'download']
  },
  {
    id: 'fromView',
    text: 'from view',
    aliases: ['current view', 'visible'],
    description: 'Using current filtered view',
    appliesTo: ['download', 'create']
  },

  // Sort modifiers
  {
    id: 'byDate',
    text: 'by date',
    aliases: ['by upload date', 'chronologically'],
    description: 'Sort by upload date',
    appliesTo: ['sort']
  },
  {
    id: 'byFilename',
    text: 'by filename',
    aliases: ['by name', 'alphabetically'],
    description: 'Sort alphabetically by filename',
    appliesTo: ['sort']
  },
  {
    id: 'bySize',
    text: 'by size',
    aliases: ['by file size'],
    description: 'Sort by file size',
    appliesTo: ['sort']
  },
  {
    id: 'ascending',
    text: 'ascending',
    aliases: ['asc', 'oldest first', 'smallest first', 'a to z'],
    description: 'Ascending order',
    appliesTo: ['sort']
  },
  {
    id: 'descending',
    text: 'descending',
    aliases: ['desc', 'newest first', 'largest first', 'z to a'],
    description: 'Descending order',
    appliesTo: ['sort']
  },

  // Group modifiers
  {
    id: 'byTeam',
    text: 'by team',
    aliases: ['by artist', 'by team member'],
    description: 'Group by team member',
    appliesTo: ['group']
  },
  {
    id: 'byCategory',
    text: 'by category',
    aliases: ['by tag category'],
    description: 'Group by tag category',
    appliesTo: ['group']
  }
]

// CHAINERS (Connect multiple commands)
const CHAINERS: CommandChainer[] = [
  {
    id: 'and',
    text: 'and',
    description: 'Perform additional action',
    nextActions: ['tag', 'untag', 'delete', 'download', 'create', 'copy']
  },
  {
    id: 'then',
    text: 'then',
    description: 'Perform action afterward',
    nextActions: ['tag', 'untag', 'delete', 'download', 'create', 'filter', 'sort']
  },
  {
    id: 'andAdd',
    text: 'and add to',
    description: 'Add to collection/workspace',
    nextActions: ['collection', 'workspace']
  }
]
```

### Example Command Compositions

```typescript
// Simple commands
"select all"
"delete selected"
"undo"

// Commands with modifiers
"select untagged"
"filter uploaded this week"
"sort by date descending"
"download selected as zip"

// Commands with dynamic objects
"select where style is ombré"
"filter from alice"
"tag selected as bridal"

// Chained commands
"select untagged and tag as reviewed"
"select where team is alice and download as zip"
"filter uploaded this week and sort by filename"

// Complex multi-step commands
"select where style is ombré from alice this week and create collection from selection"
```

---

## 🧠 Natural Language Processing

### Intent Classification

Map natural language to command intents:

```typescript
enum CommandIntent {
  SELECT = 'SELECT',
  FILTER = 'FILTER',
  TAG = 'TAG',
  UNTAG = 'UNTAG',
  DELETE = 'DELETE',
  CREATE = 'CREATE',
  EXPORT = 'EXPORT',
  DOWNLOAD = 'DOWNLOAD',
  VIEW = 'VIEW',
  ORGANIZE = 'ORGANIZE',
  SEARCH = 'SEARCH',
  UNDO = 'UNDO',
  REDO = 'REDO',
  SETTINGS = 'SETTINGS',
  HELP = 'HELP'
}

const INTENT_PATTERNS: Record<CommandIntent, RegExp[]> = {
  SELECT: [
    /^select/i,
    /^find/i,
    /^show\s+(?:me\s+)?(?:all|the)?/i,
    /^get/i,
    /^highlight/i,
    /^pick/i
  ],

  FILTER: [
    /filter\s+by/i,
    /only\s+show/i,
    /narrow\s+(?:down|to)/i,
    /\bwhere\b/i,
    /limit\s+to/i
  ],

  TAG: [
    /^tag/i,
    /^add\s+tag/i,
    /^apply/i,
    /^label/i,
    /^mark\s+as/i
  ],

  UNTAG: [
    /^untag/i,
    /^remove\s+tag/i,
    /^delete\s+tag/i,
    /^clear\s+tags/i
  ],

  DELETE: [
    /^delete/i,
    /^remove/i,
    /^trash/i,
    /^get\s+rid\s+of/i
  ],

  CREATE: [
    /^create/i,
    /^make/i,
    /^new/i,
    /^add\s+(?:a\s+)?(?:new\s+)?(?:collection|workspace|set)/i
  ],

  EXPORT: [
    /^export/i,
    /^save\s+as/i,
    /metadata.*csv/i
  ],

  DOWNLOAD: [
    /^download/i,
    /(?:get|save).*(?:zip|file)/i
  ],

  VIEW: [
    /^view/i,
    /^show\s+(?:details|info|metadata)/i,
    /^display/i,
    /^open/i
  ],

  ORGANIZE: [
    /^organize/i,
    /^sort/i,
    /^group\s+by/i,
    /^arrange/i,
    /^order\s+by/i
  ],

  SEARCH: [
    /^search/i,
    /^find/i,
    /^look\s+for/i,
    /looking\s+for/i
  ],

  UNDO: [
    /^undo/i,
    /^revert/i,
    /^go\s+back/i,
    /^cancel/i,
    /oops/i
  ],

  REDO: [
    /^redo/i,
    /^restore/i,
    /^do\s+again/i
  ],

  SETTINGS: [
    /^settings/i,
    /^preferences/i,
    /^configure/i,
    /^customize/i,
    /^options/i
  ],

  HELP: [
    /^help/i,
    /^how\s+(?:do\s+i|to)/i,
    /\?$/,
    /^what(?:'s|\s+is)/i,
    /^show\s+(?:me\s+)?(?:shortcuts|commands)/i
  ]
}
```

### Entity Extraction

Extract structured data from natural language:

```typescript
interface ExtractedEntities {
  tags: Array<{ id: string; name: string; category: string }>
  teamMembers: Array<{ id: string; name: string }>
  collections: Array<{ id: string; name: string }>
  timeRange?: { start: Date; end: Date }
  fileTypes?: string[]
  count?: number
  modifiers: {
    all?: boolean
    not?: boolean
    recent?: boolean
  }
}

// Time range extraction examples
"last week"       → { start: 7 days ago, end: now }
"this week"       → { start: start of week, end: now }
"yesterday"       → { start: yesterday 00:00, end: yesterday 23:59 }
"last 3 days"     → { start: 3 days ago, end: now }
"this month"      → { start: month start, end: now }

// Tag extraction with fuzzy matching
"ombré photos"    → tags: [{ id: 'tag_123', name: 'Ombré', category: 'Style' }]
"bridal style"    → tags: [{ id: 'tag_456', name: 'Bridal', category: 'Style' }]

// Team member extraction
"alice's work"    → teamMembers: [{ id: 'user_123', name: 'Alice' }]
"by bob"          → teamMembers: [{ id: 'user_456', name: 'Bob' }]
```

### Example NLP Queries → Commands

| Natural Language | Parsed Intent | Entities | Generated Command |
|------------------|---------------|----------|-------------------|
| "show me photos from last week" | FILTER + VIEW | time: last week | `filter uploaded this week` |
| "find alice's ombré work" | SEARCH + FILTER | team: Alice, tag: Ombré | `select where team is alice and style is ombré` |
| "tag these as bridal" | TAG | tag: Bridal | `tag selected as bridal` |
| "delete selected" | DELETE | - | `delete selected` |
| "undo that" | UNDO | - | `undo` |
| "make a collection from my selection" | CREATE | - | `create collection from selection` |
| "download everything as zip" | DOWNLOAD + EXPORT | modifier: as zip | `download all as zip` |
| "sort by newest first" | ORGANIZE | modifier: by date desc | `sort by date descending` |
| "select untagged images" | SELECT | object: untagged | `select untagged` |

---

## 🤖 Intelligence & Personalization

### Command Scoring Algorithm

```typescript
function calculateCommandScore(
  command: CommandItem,
  usage: CommandUsageData,
  context: CurrentContext,
  settings: CommandPaletteSettings
): number {
  let score = 0

  // 1. Manual pin (1000 points - always top)
  if (settings.favorites.includes(command.id)) {
    score += 1000
  }

  // 2. Usage frequency (0-100 points)
  const usageData = usage[command.id]
  if (usageData) {
    const frequencyScore = Math.min(100, usageData.count * 2)
    score += frequencyScore

    // Recency bonus (0-50 points)
    const daysSinceUse = daysBetween(usageData.lastUsed, now())
    const recencyScore = Math.max(0, 50 - daysSinceUse * 2)
    score += recencyScore
  }

  // 3. Context relevance (0-200 points)
  const contextScore = calculateContextRelevance(command, context)
  score += contextScore

  // 4. Time-of-day patterns (0-30 points)
  if (usageData?.timeOfDayPattern) {
    const currentHour = new Date().getHours()
    const hourPattern = usageData.timeOfDayPattern[currentHour] || 0
    score += Math.min(30, hourPattern * 3)
  }

  // 5. Day-of-week patterns (0-20 points)
  if (usageData?.dayOfWeekPattern) {
    const currentDay = new Date().getDay()
    const dayPattern = usageData.dayOfWeekPattern[currentDay] || 0
    score += Math.min(20, dayPattern * 2)
  }

  // 6. Co-occurrence patterns (0-50 points)
  const lastCommand = getLastExecutedCommand()
  if (lastCommand && usage.commandPairs?.[lastCommand.id]?.followedBy?.[command.id]) {
    const pairCount = usage.commandPairs[lastCommand.id].followedBy[command.id]
    score += Math.min(50, pairCount * 5)
  }

  // 7. String match quality (0-100 points from search query)
  const searchScore = calculateSearchMatch(command, context.searchQuery)
  score += searchScore

  // Penalties

  // Hidden commands (hidden completely)
  if (settings.hidden.includes(command.id)) {
    return -1
  }

  // Disabled commands (shown but deprioritized)
  if (command.disabled) {
    score *= 0.1
  }

  return score
}

function calculateContextRelevance(
  command: CommandItem,
  context: CurrentContext
): number {
  let score = 0

  // Selection context
  if (context.selectedCount > 0) {
    if (command.group === 'Tagging') score += 50
    if (command.group === 'Selection') score += 40
    if (command.group === 'Collections') score += 30
    if (command.group === 'Export & Download') score += 25
  } else {
    if (command.group === 'Filtering') score += 50
    if (command.group === 'Select by Filter') score += 40
    if (command.group === 'Selection') score += 20
  }

  // Lightbox context
  if (context.isLightboxOpen) {
    if (command.group === 'Current Tags') score += 100
    if (command.id.startsWith('single-')) score += 80
  }

  // Filter context
  if (context.activeFilters.length > 0) {
    if (command.id === 'filters-clear') score += 60
    if (command.group === 'Filtering') score += 30
  }

  // Empty state
  if (context.assetCount === 0) {
    if (command.id === 'upload-toggle') score += 100
    if (command.group === 'Help') score += 20
  }

  // Recent upload context
  if (context.hasRecentUploads) {
    if (command.group === 'Tagging') score += 40
  }

  return score
}
```

### Adaptive UI Sections

```typescript
// "Frequently Used" section (top 5 commands)
const frequentlyUsed = getTopCommands(commandUsage, 5)

// "Suggested for You" (context-aware, top 3)
const suggested = getSuggestedCommands(context, commandUsage, 3)

// "Recently Used" (last 5 unique commands)
const recentlyUsed = getRecentCommands(commandUsage, 5)

// Dynamic layout based on preferences
if (settings.showFrequentlyUsed) {
  sections.push({
    title: '🔥 Frequently Used',
    commands: frequentlyUsed,
    collapsible: false
  })
}

if (settings.showSuggestions && suggested.length > 0) {
  sections.push({
    title: '💡 Suggested for You',
    commands: suggested,
    collapsible: false,
    showReason: true  // Show why it's suggested
  })
}

// All commands by group (with custom ordering)
const sortedGroups = sortGroupsByPreference(
  allGroups,
  settings.groupOrder,
  commandUsage
)
```

---

## 📦 New Commands by Category

### Quick Actions (New Group)
- `search-filename` - Search by filename
- `search-caption` - Search by caption/description
- `view-details` - View asset details/metadata
- `copy-filename` - Copy filename to clipboard
- `copy-urls` - Copy asset URLs to clipboard
- `undo-last` - Undo last operation
- `redo-last` - Redo undone operation
- `view-history` - View action history

### Selection (Enhanced)
- ✅ `selection-all` - Select all in view (existing)
- ✅ `selection-clear` - Clear selection (existing)
- ✅ `selection-delete` - Delete selected (existing)
- `selection-untagged` - Select untagged assets
- `selection-unassigned` - Select assets without team member
- `selection-invert` - Invert selection
- `selection-similar` - Select similar (same tags)
- `deselect-by-tag` - Remove from selection by tag
- `deselect-by-team` - Remove from selection by team

### Select by Filter (Existing, Enhanced)
- ✅ `selection-mode-toggle` - Toggle replace/add mode (existing)
- ✅ `select-tag-*` - Select by tag (existing)
- ✅ `select-team-*` - Select by team member (existing)

### Tagging (Enhanced)
- ✅ Bulk tag application (existing)
- `copy-tags-from` - Copy tags from one asset to selected
- `remove-all-tags` - Remove all tags from selected
- `replace-tag` - Find and replace tag across selection

### Collections (Enhanced)
- ✅ `collection-*` - View/switch collections (existing)
- `collection-create-from-selection` - Create collection from selection
- `collection-add-selected` - Add selected to existing collection
- `collection-remove-selected` - Remove selected from current collection
- `collection-duplicate` - Duplicate collection

### Filtering (Enhanced)
- ✅ Tag and team filtering (existing)
- `filter-date-range` - Filter by custom date range
- `filter-uploaded-today` - Filter uploaded today
- `filter-uploaded-yesterday` - Filter uploaded yesterday
- `filter-uploaded-this-week` - Filter uploaded this week
- `filter-uploaded-last-week` - Filter uploaded last week
- `filter-uploaded-this-month` - Filter uploaded this month
- `filter-recent` - Show recently uploaded (24hrs)
- `filter-modified-recent` - Show recently modified
- `filter-clear-date` - Clear date filters

### Organization (Enhanced)
- ✅ Group by team/category (existing)
- `sort-date-desc` - Sort by upload date (newest first)
- `sort-date-asc` - Sort by upload date (oldest first)
- `sort-filename-asc` - Sort by filename (A-Z)
- `sort-filename-desc` - Sort by filename (Z-A)
- `sort-size-desc` - Sort by file size (largest first)
- `sort-size-asc` - Sort by file size (smallest first)
- `sort-shuffle` - Shuffle order randomly

### Export & Download (New Group)
- `download-selected` - Download selected assets as ZIP
- `download-all` - Download current view as ZIP
- `export-metadata-csv` - Export selection metadata as CSV
- `copy-urls-clipboard` - Copy asset URLs to clipboard
- `download-single` - Download current lightbox asset

### Metadata (New Group)
- `edit-caption-selected` - Edit caption for selected
- `edit-alttext-selected` - Edit alt text for selected
- `clear-caption-selected` - Clear captions from selected
- `clear-alttext-selected` - Clear alt text from selected
- `view-file-info` - View file info (size, dimensions, date)

### Workspaces (New Group)
- `workspace-save` - Save current view as workspace
- `workspace-load` - Load saved workspace
- `workspace-delete` - Delete workspace
- `workspace-list` - List all workspaces
- `workspace-rename` - Rename workspace

### Tag Management (New Group)
- `tag-stats` - Show tag usage statistics
- `tag-find-unused` - Find unused tags
- `tag-replace` - Replace tag across selection
- `tag-merge` - Merge two tags

### View (Enhanced)
- ✅ Toggle grid mode (existing)
- ✅ Customize card display (existing)
- ✅ Show/hide upload panel (existing)
- `view-compact` - Toggle compact grid view
- `view-list` - Switch to list view

### Settings (Enhanced)
- ✅ Manage tags (existing)
- ✅ Manage collections (existing)
- ✅ Team management (existing)
- `settings-command-palette` - Command palette settings
- `settings-export` - Export settings
- `settings-import` - Import settings
- `settings-reset` - Reset to defaults

### Help (Enhanced)
- ✅ Tutorial (existing)
- ✅ Shortcuts (existing)
- ✅ Tips (existing)
- `help-whats-new` - Show what's new
- `help-command-examples` - Show command examples

---

## 🎨 UI/UX Design

### Command Palette Layout

```
┌────────────────────────────────────────────────────────┐
│ 🔍 Type a command or use autocomplete...    ⚙️ │ 🔢 0 │
├────────────────────────────────────────────────────────┤
│                                                         │
│ ⭐ PINNED (3)                            [Always shown] │
│   › Select untagged assets                   Cmd+U    │
│   › Search by filename                       Cmd+F    │
│   › Create collection from selection         Cmd+N    │
│                                                         │
├────────────────────────────────────────────────────────┤
│ 🔥 FREQUENTLY USED (5)                  [If enabled]   │
│   › Apply queued tags now                    47 uses  │
│   › Group by Team                            34 uses  │
│   › Style › Ombré                            28 uses  │
│   › Clear selection                          22 uses  │
│   › Team › Alice                             19 uses  │
│                                                         │
├────────────────────────────────────────────────────────┤
│ 💡 SUGGESTED FOR YOU (3)            [Context-aware]    │
│   › Add selected to collection...  (often follows tag)│
│   › View asset details             (selection active) │
│   › Undo last tag operation        (just tagged)     │
│                                                         │
├────────────────────────────────────────────────────────┤
│                                                         │
│ 📦 ALL COMMANDS                         [Collapsible]  │
│                                                         │
│ ▼ Quick Actions (8)                                    │
│   › Search by filename...                              │
│   › View asset details                                 │
│   › Undo last operation                                │
│   › Copy URLs to clipboard                             │
│                                                         │
│ ▼ Selection (12)                                       │
│   › Select all in view                     123 assets  │
│   › Select untagged                        47 assets   │
│   › Invert selection                                   │
│   › Clear selection                                    │
│                                                         │
│ ▶ Tagging (24)                              [Expand]   │
│ ▶ Collections (6)                           [Expand]   │
│ ▶ Filtering (18)                            [Expand]   │
│ ▶ Export & Download (5)                    [Expand]   │
│ ▶ Organization (10)                         [Expand]   │
│ ▶ Metadata (6)                              [Expand]   │
│ ▶ Workspaces (5)                            [Expand]   │
│ ▶ View (5)                                  [Expand]   │
│ ▶ Settings (8)                              [Expand]   │
│ ▶ Help (5)                                  [Expand]   │
│                                                         │
└────────────────────────────────────────────────────────┘

Keyboard Navigation:
  ↑↓    Navigate commands
  ⏎     Execute selected command
  Tab   Autocomplete / refine command
  Esc   Close palette
  ⌘K    Open palette
  /     Open palette (alternative)
```

### Autocomplete Mode

```
┌────────────────────────────────────────────────────────┐
│ 💭 select │ untagged │ and │ _                         │
│    ━━━━━━   ━━━━━━━━   ━━━                             │
│    verb     object    chain                             │
│                                                         │
│ 💡 Continue typing or select...                        │
├────────────────────────────────────────────────────────┤
│ 📊 PREVIEW                                             │
│    This command will select 47 untagged assets and     │
│    then perform another action.                        │
│                                                         │
│    [Waiting for next action...]                        │
├────────────────────────────────────────────────────────┤
│ 🎯 SUGGESTIONS - Next Action                           │
│                                                         │
│   tag as...                                            │
│     Add tags to selected assets                        │
│                                                         │
│   delete                                               │
│     Delete all selected assets                         │
│                                                         │
│   download as zip                                      │
│     Download selected assets as ZIP file               │
│                                                         │
│   create collection                                    │
│     Create new collection from selected                │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Settings Modal

```
┌─────────────────────────────────────────────────────────┐
│  ⚙️  Command Palette Settings                    [×]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [⭐ Favorites] [📊 Display] [📁 Groups] [📈 Stats]     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ⭐ PINNED COMMANDS                                 │ │
│  ├────────────────────────────────────────────────────┤ │
│  │                                                     │ │
│  │  [::] Select untagged assets                  [×] │ │
│  │  [::] Search by filename                      [×] │ │
│  │  [::] Create collection from selection        [×] │ │
│  │                                                     │ │
│  │  [+ Add Favorite Command]                          │ │
│  │                                                     │ │
│  │  Pinned commands always appear at the top of      │ │
│  │  the command palette for instant access.          │ │
│  │                                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [Cancel]                                [Save Changes] │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Visual Design System

**Colors** (Tailwind classes):
- Primary accent: `text-dusty-rose` / `bg-dusty-rose`
- Backgrounds: `bg-cream` / `bg-sand`
- Text: `text-sage` / `text-walnut`
- Success: `text-moss` / `bg-moss/10`
- Warning: `text-terra-cotta` / `bg-terra-cotta/10`

**Icons**:
- Verbs: Action icons (✨ 🎯 🏷️ etc.)
- Objects: Entity icons (📁 👤 📷 etc.)
- Groups: Category icons (📦 ⚡ 🔍 etc.)
- Status: State icons (✅ ⏳ ⚠️ etc.)

**Typography**:
- Command labels: `font-medium text-sm`
- Descriptions: `font-normal text-xs text-sage/70`
- Section headers: `font-bold text-xs uppercase tracking-wide`
- Badges: `text-xs px-2 py-0.5 rounded-full`

**Spacing**:
- Section gaps: `gap-4`
- Command gaps: `gap-1`
- Padding: `p-4` (modal), `p-2` (command items)

**Animations**:
- Fade in: 150ms ease
- Slide in: 200ms cubic-bezier
- Expand: 250ms ease-out
- Highlight: Pulse effect for matched terms

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
describe('Command Autocomplete Engine', () => {
  it('should tokenize simple commands', () => {
    expect(tokenize('select all')).toEqual([
      { type: 'verb', value: 'select', id: 'select' },
      { type: 'object', value: 'all', id: 'all' }
    ])
  })

  it('should suggest valid next tokens', () => {
    const state = analyze('select ', 7)
    expect(state.expectedNext[0].type).toBe('object')
    expect(state.expectedNext[0].suggestions.length).toBeGreaterThan(0)
  })

  it('should validate command structure', () => {
    const { isValid } = validate([
      { type: 'verb', value: 'select', id: 'select' },
      { type: 'object', value: 'all', id: 'all' }
    ])
    expect(isValid).toBe(true)
  })
})

describe('NLP Parser', () => {
  it('should detect SELECT intent', () => {
    expect(detectIntent('show me all photos')).toBe('SELECT')
    expect(detectIntent('find untagged images')).toBe('SELECT')
  })

  it('should extract time ranges', () => {
    const range = extractTimeRange('last week')
    expect(range.start).toBeDefined()
    expect(range.end).toBeDefined()
    expect(daysBetween(range.start, range.end)).toBeCloseTo(7)
  })

  it('should extract team members', () => {
    const members = extractTeamMembers('alice\'s photos', mockTeamMembers)
    expect(members).toContain('alice-id')
  })
})

describe('Command Scoring', () => {
  it('should prioritize pinned commands', () => {
    const score1 = calculateScore(command, usage, context, {
      favorites: ['cmd-1']
    })
    const score2 = calculateScore(command, usage, context, {
      favorites: []
    })
    expect(score1).toBeGreaterThan(score2 + 900)
  })

  it('should boost context-relevant commands', () => {
    const score = calculateScore(taggingCommand, usage, {
      selectedCount: 5
    })
    expect(score).toBeGreaterThan(50)
  })
})
```

### Integration Tests

```typescript
describe('Command Palette Integration', () => {
  it('should execute autocompleted command', async () => {
    render(<CommandPalette />)

    // Type command
    await userEvent.type(screen.getByRole('textbox'), 'select all')

    // Press Enter
    await userEvent.keyboard('{Enter}')

    // Verify execution
    expect(mockSelectAll).toHaveBeenCalled()
  })

  it('should track command usage', async () => {
    render(<CommandPalette />)

    // Execute command
    await executeCommand('select-all')

    // Verify tracking
    const usage = await getCommandUsage('select-all')
    expect(usage.count).toBe(1)
    expect(usage.lastUsed).toBeDefined()
  })
})
```

### E2E Tests

```typescript
describe('Command Palette E2E', () => {
  it('should complete full workflow', async () => {
    // Open palette
    await page.keyboard.press('/')

    // Type command
    await page.type('input', 'select untagged')

    // Wait for suggestions
    await page.waitForSelector('[data-suggestion]')

    // Press Enter
    await page.keyboard.press('Enter')

    // Verify selection
    const selectedCount = await page.textContent('[data-selection-count]')
    expect(selectedCount).toContain('47')
  })
})
```

---

## 📊 Success Metrics

### Adoption Metrics
- **Command Palette Open Rate**: % of sessions using palette
- **Commands per Session**: Average commands executed
- **Autocomplete Usage**: % of commands built via autocomplete
- **NLP Query Rate**: % of queries using natural language
- **Settings Customization**: % of users customizing palette

### Efficiency Metrics
- **Time to Command**: Average time from open to execute
- **Suggestion Accuracy**: % of times top suggestion is selected
- **Multi-step Command Usage**: % using chained commands
- **Keyboard-Only Usage**: % of users avoiding mouse

### Feature Coverage
- **Command Discovery**: % of available commands ever used
- **Feature Utilization**: % of DAM features accessed via palette
- **Group Visibility**: Which groups are expanded/collapsed most

### User Satisfaction
- **Frequent User Retention**: % returning daily users
- **Customization Depth**: Average # of favorites/hidden commands
- **Error Rate**: % of invalid/failed commands
- **Support Tickets**: Reduction in feature discovery questions

### Performance Metrics
- **Suggestion Latency**: Time to show first suggestions (target: <50ms)
- **Search Performance**: Time to rank all commands (target: <100ms)
- **Memory Usage**: Client-side memory footprint
- **Database Load**: Settings read/write frequency

---

## 🚀 Next Steps

### Immediate Actions (Week 1)
1. ✅ Review and approve this master plan
2. [ ] Set up project board with all tasks
3. [ ] Create database migration for settings schema
4. [ ] Begin Phase 1: Foundation implementation
5. [ ] Set up analytics for usage tracking

### Dependencies
- [ ] Approve new dependencies (Transformers.js, etc.)
- [ ] Design system review for new UI components
- [ ] Database migration approval
- [ ] API endpoint design review

### Open Questions
1. Should semantic search be MVP or post-launch?
2. What's the preferred approach for undo/redo storage?
3. Should workspaces sync across devices?
4. Export format preferences (ZIP compression level, etc.)?
5. Analytics privacy considerations?

---

## 📚 References

### Related Documentation
- [DAM System Overview](./DAM_OVERVIEW.md)
- [Command Palette Current State](../src/app/dam/components/OmniCommandPalette.tsx)
- [Settings Hook](../src/hooks/useDamSettings.ts)
- [Database Schema](../src/db/schema/dam_user_settings.ts)

### External Resources
- [Vercel AI SDK](https://sdk.vercel.ai/) - Autocomplete inspiration
- [Transformers.js](https://huggingface.co/docs/transformers.js) - Client-side NLP
- [Raycast](https://www.raycast.com/) - Command palette best practices
- [Linear](https://linear.app/) - Command-driven UX patterns

---

**Document Status**: Planning Phase
**Last Updated**: 2025-01-16
**Author**: Claude (AI Assistant) + Corey Dylan
**Next Review**: After Phase 1 completion
