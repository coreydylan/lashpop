# DAM Command Palette - NLP System (Phase 3)

A complete Natural Language Processing system for the Digital Asset Management Command Palette. Converts natural language queries into structured commands.

## Features

### 🎯 Intent Classification
Automatically detects user intent from natural language queries:

- **SELECT** - Select/show assets (`"show me photos"`, `"find images"`)
- **FILTER** - Filter assets (`"filter by tag"`, `"show only portraits"`)
- **TAG** - Add tags (`"tag as portrait"`, `"label as landscape"`)
- **UNTAG** - Remove tags (`"remove tag"`, `"untag portrait"`)
- **SET_TAG** - Replace tags (`"set tag to portrait"`)
- **ASSIGN_TEAM** - Assign team members (`"assign to alice"`, `"by bob"`)
- **REMOVE_TEAM** - Remove team assignments
- **COLLECTION** - Collection operations (`"add to collection"`)
- **VIEW** - Change view settings (`"show grid"`)
- **SORT** - Sort assets (`"sort by date"`)
- **GROUP** - Group assets (`"group by tag"`)
- **CLEAR** - Clear filters/selections (`"clear all"`)
- **DOWNLOAD** - Download assets
- **DELETE** - Delete assets
- **SEARCH** - Generic search (fallback)

### 🏷️ Entity Extraction
Extracts entities from queries with fuzzy matching:

- **Tags** - Matches tag names with typo tolerance
- **Team Members** - Matches names (full name, first name, last name, initials)
- **Collections** - Matches collection/set names
- **Date Ranges** - Parses natural language dates
- **Modifiers** - Detects flags like "all", "selected", "additive"

### 📅 Natural Language Date Parsing
Supports common date expressions:

- **Relative days**: `"yesterday"`, `"today"`, `"tomorrow"`
- **Relative weeks**: `"last week"`, `"this week"`
- **Relative months**: `"last month"`, `"this month"`
- **Relative years**: `"last year"`, `"this year"`
- **Ranges**: `"last 3 days"`, `"past 2 weeks"`, `"last 6 months"`

### 🔍 Fuzzy String Matching
Custom Levenshtein distance implementation for typo tolerance:

- Case-insensitive matching
- Handles partial matches
- Phonetic similarity detection
- Name matching (first/last/initials)

## File Structure

```
src/lib/
├── commands/
│   ├── nlp-parser.ts          # Main orchestrator
│   ├── intent-classifier.ts   # Intent detection
│   ├── entity-extractor.ts    # Entity extraction
│   ├── nlp-examples.ts        # Usage examples
│   └── nlp-index.ts           # Central exports
└── utils/
    ├── string-matching.ts     # Fuzzy matching utilities
    └── date-parser.ts         # Date parsing utilities
```

## Usage

### Basic Example

```typescript
import { parseNaturalLanguageQuery } from '@/lib/commands/nlp-parser'

// Set up context with available data
const context = {
  availableTags: [
    { id: '1', name: 'portrait', displayName: 'Portrait' },
    { id: '2', name: 'landscape', displayName: 'Landscape' },
  ],
  availableTeamMembers: [
    { id: 't1', name: 'Alice Johnson' },
    { id: 't2', name: 'Bob Smith' },
  ],
  availableCollections: [
    { id: 'c1', name: 'summer-2024', displayName: 'Summer 2024' },
  ],
}

// Parse a query
const query = "show me alice's photos from last week"
const parsed = parseNaturalLanguageQuery(query, context)

console.log(parsed.intent)  // 'SELECT'
console.log(parsed.entities.teamMembers[0].member.name)  // 'Alice Johnson'
console.log(parsed.entities.dateRange?.description)  // 'Last week'
console.log(parsed.overallConfidence)  // 0.95
```

### Integration with Command Palette

```typescript
import { parseNaturalLanguageQuery, validateCommand } from '@/lib/commands/nlp-parser'

function handleCommandInput(query: string, context: EntityExtractionContext) {
  // Parse the query
  const parsed = parseNaturalLanguageQuery(query, context)

  // Validate
  const validation = validateCommand(parsed)
  if (!validation.valid) {
    showErrors(validation.errors)
    return
  }

  // Execute based on intent
  switch (parsed.intent) {
    case 'FILTER':
      applyFilters({
        tags: parsed.entities.tags.map(t => t.tag.id),
        teamMembers: parsed.entities.teamMembers.map(m => m.member.id),
        dateRange: parsed.entities.dateRange,
      })
      break

    case 'TAG':
      addTagsToSelection(parsed.entities.tags.map(t => t.tag.id))
      break

    // ... handle other intents
  }
}
```

### Example Queries That Work

#### Filtering
- `"show me all photos"`
- `"filter by portrait tag"`
- `"show only landscape photos"`
- `"photos tagged as nature"`
- `"find images with sunset tag"`

#### Team Members
- `"show alice's photos"`
- `"photos by Bob"`
- `"assign to Alice"`
- `"set photographer to Bob Smith"`
- `"taken by alice"`

#### Date Ranges
- `"photos from last week"`
- `"yesterday's images"`
- `"show me photos from last 3 days"`
- `"this month's uploads"`
- `"images from last year"`

#### Complex Queries
- `"show me alice's portrait photos from last week"`
- `"filter landscape photos by bob from this month"`
- `"tag selected as portrait and add to summer 2024"`
- `"assign bob's photos from yesterday to landscape"`

#### Tagging
- `"tag as portrait"`
- `"add landscape tag"`
- `"label selected as sunset"`
- `"mark as nature"`

#### Sorting & Grouping
- `"sort by date"`
- `"order by newest first"`
- `"group by tag"`
- `"organize by photographer"`

#### Collections
- `"add to Summer 2024 collection"`
- `"create new set"`
- `"move to Best Photos"`

## API Reference

### `parseNaturalLanguageQuery(query, context)`

Main parsing function.

**Parameters:**
- `query: string` - User's natural language query
- `context: EntityExtractionContext` - Available tags, team members, collections

**Returns:** `ParsedCommand` object containing:
- `intent: Intent` - Classified intent
- `intentConfidence: number` - Confidence score (0-1)
- `entities: ExtractedEntities` - Extracted entities
- `overallConfidence: number` - Overall confidence score (0-1)
- `suggestions?: string[]` - Suggestions if confidence is low

### `validateCommand(parsed)`

Validates a parsed command.

**Returns:**
- `valid: boolean` - Whether command is valid
- `errors: string[]` - Error messages if invalid

### `explainParsedCommand(parsed)`

Generates human-readable explanation of a parsed command.

**Returns:** `string` - Multi-line explanation

### `classifyIntent(query)`

Classifies query intent without entity extraction (faster).

**Returns:** `IntentClassification` object

### `extractEntities(query, context)`

Extracts entities from query.

**Returns:** `ExtractedEntities` object

## Confidence Scores

The NLP system returns confidence scores (0-1) for all operations:

- **1.0** - Perfect match (exact string match)
- **0.9-0.99** - Very high confidence (substring match, clear intent)
- **0.7-0.89** - High confidence (fuzzy match, clear pattern)
- **0.6-0.69** - Medium confidence (acceptable but could be ambiguous)
- **< 0.6** - Low confidence (may need user confirmation)

Overall confidence is calculated as:
- 50% from intent classification
- 30% from entity extraction quality
- 10% from date range parsing
- 10% from sort/group criteria

## Fuzzy Matching

The system uses Levenshtein distance for typo tolerance:

```typescript
import { similarityScore } from '@/lib/utils/string-matching'

similarityScore("portrait", "portrai")   // 0.875 (typo tolerance)
similarityScore("alice", "alise")        // 0.8 (close match)
similarityScore("landscape", "land")     // 0.6 (partial match)
```

**Matching Features:**
- Case-insensitive
- Handles partial words
- Supports quoted exact matches
- Name matching (first/last/initials)
- Phonetic similarity

## Date Parsing

Natural language date expressions are converted to date ranges:

```typescript
import { parseNaturalDateRange } from '@/lib/utils/date-parser'

const range = parseNaturalDateRange("last week")
// Returns: { start: Date, end: Date, confidence: 1.0, description: "Last week" }
```

**Supported Expressions:**
- `today`, `now`
- `yesterday`, `tomorrow`
- `last week`, `this week`
- `last month`, `this month`
- `last year`, `this year`
- `last N days/weeks/months`
- `past N days/weeks/months`

## Performance Considerations

- **Quick Parse**: Use `quickParse()` for faster intent detection without full entity extraction
- **Batch Parse**: Use `batchParse()` for processing multiple queries efficiently
- **Caching**: Results can be cached based on query string + context hash
- **No External Dependencies**: All algorithms implemented in pure TypeScript

## Error Handling

The system gracefully handles:
- Empty queries → Returns `UNKNOWN` intent with 0 confidence
- Ambiguous queries → Returns suggestions array
- Invalid entities → Filters them out, continues parsing
- Low confidence → Validates and returns errors

## Integration Notes

### For Command Palette

1. **Call NLP parser on user input:**
   ```typescript
   const parsed = parseNaturalLanguageQuery(userQuery, context)
   ```

2. **Check confidence before executing:**
   ```typescript
   if (parsed.overallConfidence < 0.6) {
     showSuggestions(parsed.suggestions)
     return
   }
   ```

3. **Map intent to actions:**
   ```typescript
   switch (parsed.intent) {
     case 'FILTER': applyFilters(...)
     case 'TAG': addTags(...)
     // etc.
   }
   ```

### For Autocomplete

Use partial parsing for real-time suggestions:

```typescript
import { quickParse } from '@/lib/commands/nlp-parser'

const { intent, confidence, needsFullParse } = quickParse(partialQuery)
if (needsFullParse) {
  // Show entity suggestions
}
```

## Testing

Example test scenarios:

```typescript
// Test intent classification
const parsed = parseNaturalLanguageQuery("filter by portrait", context)
expect(parsed.intent).toBe('FILTER')
expect(parsed.entities.tags[0].tag.name).toBe('portrait')

// Test fuzzy matching
const parsed = parseNaturalLanguageQuery("show alice's phtoos", context)
expect(parsed.entities.teamMembers[0].member.name).toBe('Alice Johnson')

// Test date parsing
const parsed = parseNaturalLanguageQuery("photos from last week", context)
expect(parsed.entities.dateRange).toBeTruthy()
expect(parsed.entities.dateRange?.description).toBe('Last week')
```

## Future Enhancements

Potential improvements for Phase 4+:

- **Learning**: Track successful queries to improve confidence scores
- **Synonyms**: Add synonym dictionary for domain-specific terms
- **Multi-language**: Support for non-English queries
- **Context awareness**: Remember previous queries in session
- **Smart defaults**: Learn user preferences over time
- **Negation handling**: Better support for "not", "without", "exclude"
- **Numeric ranges**: Support "photos with 100-200KB size"

## License

Part of the Lashpop DAM system.

## Dependencies

**Zero external dependencies** - All algorithms implemented natively:
- Levenshtein distance
- Fuzzy matching
- Date parsing
- Intent classification
- Entity extraction

This ensures fast performance and no network requests.
