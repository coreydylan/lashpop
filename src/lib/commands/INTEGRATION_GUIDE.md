# NLP System Integration Guide

Quick guide to integrate the NLP system with your Command Palette.

## Quick Start (5 minutes)

### 1. Import the NLP Parser

```typescript
// In your OmniCommandPalette component or hook
import { parseNaturalLanguageQuery } from '@/lib/commands/nlp-parser'
import type { EntityExtractionContext } from '@/lib/commands/entity-extractor'
```

### 2. Set Up Context

```typescript
// Prepare context from your DAM data
const nlpContext: EntityExtractionContext = {
  availableTags: tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    displayName: tag.displayName,
    categoryId: tag.categoryId,
    categoryName: tag.category?.name,
    categoryDisplayName: tag.category?.displayName,
    categoryColor: tag.category?.color,
  })),
  availableTeamMembers: teamMembers.map(member => ({
    id: member.id,
    name: member.name,
    imageUrl: member.imageUrl,
  })),
  availableCollections: collections.map(collection => ({
    id: collection.id,
    name: collection.name,
    displayName: collection.displayName,
  })),
}
```

### 3. Parse User Input

```typescript
function handleCommandInput(query: string) {
  // Parse the natural language query
  const parsed = parseNaturalLanguageQuery(query, nlpContext)

  // Check confidence
  if (parsed.overallConfidence < 0.5) {
    console.log('Low confidence:', parsed.suggestions)
    return
  }

  // Execute based on intent
  executeCommand(parsed)
}
```

### 4. Execute Commands

```typescript
function executeCommand(parsed: ParsedCommand) {
  switch (parsed.intent) {
    case 'FILTER':
      // Apply filters
      const tagIds = parsed.entities.tags.map(t => t.tag.id)
      const teamIds = parsed.entities.teamMembers.map(m => m.member.id)
      applyFilters({ tagIds, teamIds, dateRange: parsed.entities.dateRange })
      break

    case 'TAG':
      // Add tags to selection
      const tagsToAdd = parsed.entities.tags.map(t => t.tag.id)
      addTagsToSelection(tagsToAdd)
      break

    case 'ASSIGN_TEAM':
      // Assign team member
      const memberId = parsed.entities.teamMembers[0]?.member.id
      if (memberId) assignTeamMember(memberId)
      break

    // ... handle other intents
  }
}
```

## Example Integration with React

```typescript
import { useState, useCallback } from 'react'
import { parseNaturalLanguageQuery } from '@/lib/commands/nlp-parser'

export function useNLPCommandPalette(context: EntityExtractionContext) {
  const [query, setQuery] = useState('')

  const handleQuery = useCallback((input: string) => {
    setQuery(input)

    if (!input.trim()) return

    // Parse the query
    const parsed = parseNaturalLanguageQuery(input, context)

    // Return parsed result for UI feedback
    return {
      intent: parsed.intent,
      confidence: parsed.overallConfidence,
      description: explainParsedCommand(parsed),
      entities: parsed.entities,
    }
  }, [context])

  return { query, setQuery, handleQuery }
}
```

## Example UI Integration

```typescript
// In OmniCommandPalette.tsx
function OmniCommandPalette({ open, onClose, ... }) {
  const [query, setQuery] = useState('')
  const [parsedCommand, setParsedCommand] = useState<ParsedCommand | null>(null)

  // Build NLP context from available data
  const nlpContext = useMemo(() => ({
    availableTags: items
      .filter(i => i.group === 'Tag')
      .map(i => ({ id: i.id, name: i.label, displayName: i.label })),
    availableTeamMembers: items
      .filter(i => i.group === 'Team')
      .map(i => ({ id: i.id, name: i.label })),
    availableCollections: [],
  }), [items])

  // Parse query on change
  useEffect(() => {
    if (query.trim()) {
      const parsed = parseNaturalLanguageQuery(query, nlpContext)
      setParsedCommand(parsed)

      // Auto-execute high-confidence commands
      if (parsed.overallConfidence > 0.85) {
        executeCommand(parsed)
      }
    }
  }, [query, nlpContext])

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Try: show alice's photos from last week"
      />

      {/* Show confidence indicator */}
      {parsedCommand && (
        <div className="confidence-badge">
          {(parsedCommand.overallConfidence * 100).toFixed(0)}% confident
        </div>
      )}

      {/* Show suggestions for low confidence */}
      {parsedCommand?.suggestions && (
        <div className="suggestions">
          {parsedCommand.suggestions.map(s => <div key={s}>{s}</div>)}
        </div>
      )}
    </div>
  )
}
```

## Common Patterns

### Pattern 1: Enhanced Filtering

```typescript
// Add NLP support to existing filter system
function enhanceFilterWithNLP(query: string, context: EntityExtractionContext) {
  const parsed = parseNaturalLanguageQuery(query, context)

  if (parsed.intent === 'FILTER' || parsed.intent === 'SELECT') {
    return {
      tags: parsed.entities.tags.map(t => t.tag.id),
      teamMembers: parsed.entities.teamMembers.map(m => m.member.id),
      dateRange: parsed.entities.dateRange,
    }
  }

  return null
}
```

### Pattern 2: Smart Tagging

```typescript
// Intelligent tag suggestion based on query
function suggestTagsFromQuery(query: string, context: EntityExtractionContext) {
  const parsed = parseNaturalLanguageQuery(query, context)

  // Return high-confidence tag matches
  return parsed.entities.tags
    .filter(t => t.confidence > 0.7)
    .map(t => t.tag)
}
```

### Pattern 3: Contextual Actions

```typescript
// Show different actions based on parsed intent
function getContextualActions(query: string, context: EntityExtractionContext) {
  const parsed = parseNaturalLanguageQuery(query, context)

  const actions = []

  if (parsed.intent === 'TAG' && parsed.entities.tags.length > 0) {
    actions.push({
      label: `Add tag: ${parsed.entities.tags[0].tag.displayName}`,
      onSelect: () => addTag(parsed.entities.tags[0].tag.id)
    })
  }

  if (parsed.entities.teamMembers.length > 0) {
    actions.push({
      label: `Filter by ${parsed.entities.teamMembers[0].member.name}`,
      onSelect: () => filterByTeam(parsed.entities.teamMembers[0].member.id)
    })
  }

  return actions
}
```

## Testing Your Integration

```typescript
// Test with common queries
const testQueries = [
  "show alice's photos",
  "filter by portrait",
  "photos from last week",
  "tag as landscape",
  "assign to bob",
]

testQueries.forEach(query => {
  const parsed = parseNaturalLanguageQuery(query, context)
  console.log(`Query: "${query}"`)
  console.log(`Intent: ${parsed.intent} (${parsed.overallConfidence})`)
  console.log(`Entities:`, parsed.entities)
  console.log('---')
})
```

## Performance Tips

1. **Memoize Context**: Build `EntityExtractionContext` only when data changes
2. **Debounce Input**: Don't parse on every keystroke
3. **Quick Parse First**: Use `quickParse()` for initial intent, then full parse if needed
4. **Cache Results**: Cache parsed results for identical queries

```typescript
// Example: Debounced parsing
import { useMemo } from 'react'
import { debounce } from 'lodash'

const debouncedParse = useMemo(
  () => debounce((query: string) => {
    const parsed = parseNaturalLanguageQuery(query, nlpContext)
    // Handle parsed result
  }, 300),
  [nlpContext]
)
```

## Troubleshooting

### Low Confidence Scores

**Problem**: Queries return low confidence (<0.6)

**Solutions**:
- Ensure context has complete data (tags, team members, etc.)
- Check that tag/member names match what users would type
- Use suggestions returned by the parser
- Add synonyms or alternate names

### No Entities Extracted

**Problem**: Entities not found even though they exist

**Solutions**:
- Check that displayName and name fields are populated
- Verify fuzzy matching threshold (default 0.6)
- Try exact matches with quotes: `"portrait photography"`
- Check for typos in your data

### Wrong Intent Detected

**Problem**: Intent classification is incorrect

**Solutions**:
- Make queries more specific (e.g., "filter by tag" vs just "tag")
- Start with clear action words: show, filter, tag, assign
- Check intent patterns in `intent-classifier.ts`

## Next Steps

1. **Add Logging**: Track which queries work well vs poorly
2. **Collect Feedback**: Let users correct misinterpretations
3. **Tune Thresholds**: Adjust confidence thresholds based on usage
4. **Add Synonyms**: Extend patterns in `intent-classifier.ts` for domain terms
5. **Monitor Performance**: Track parse times and optimize if needed

## Support

See the main [NLP_README.md](./NLP_README.md) for:
- Complete API reference
- All supported query patterns
- Detailed examples
- Architecture documentation
