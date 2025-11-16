# Phase 2: Autocomplete System - Integration Guide

This guide shows how to integrate the new Natural Language Command System into the DAM.

## Files Created

### Core Grammar & Engine (`/src/lib/commands/`)

1. **grammar.ts** - Complete command grammar definition
   - Verbs: select, filter, tag, untag, delete, group, clear, assign
   - Objects: all, untagged, selected, filters, selection, tags
   - Modifiers: as, by, with, to
   - Chainers: and, then

2. **autocomplete-engine.ts** - Tokenizer, parser, and suggestion engine
   - `tokenize()` - Breaks input into tokens
   - `parseCommand()` - Validates and generates suggestions
   - `generateSuggestions()` - Context-aware autocomplete
   - `autocomplete()` - Apply suggestions to input
   - `isCommandComplete()` - Check if ready to execute

3. **command-compiler.ts** - Converts tokens to executable commands
   - `compileCommand()` - Compile tokens into actions
   - Supports single and chained commands
   - Returns `CompiledCommand` with actions array

### UI Components (`/src/app/dam/components/`)

4. **TokenizedInput.tsx** - Color-coded token display
   - Shows tokens in different colors by type
   - Transparent text with colored overlay
   - Real-time validation

5. **CommandAutocomplete.tsx** - Main autocomplete UI
   - Real-time suggestions as you type
   - Command preview before execution
   - Keyboard navigation (arrows, tab, enter, esc)
   - Mobile-responsive design

## Integration Example

### Step 1: Add to DAM Page

```tsx
import { CommandAutocomplete } from '@/app/dam/components/CommandAutocomplete'
import { compileCommand, type CompiledCommand } from '@/lib/commands/command-compiler'
import type { ContextData } from '@/lib/commands/autocomplete-engine'

// In your DAM page component:
const [isNaturalCommandOpen, setIsNaturalCommandOpen] = useState(false)

// Build context data for autocomplete
const commandContext: ContextData = {
  tagCategories,
  teamMembers,
  hasSelection: selectedAssets.length > 0,
  hasFilters: activeFilters.length > 0,
  selectedCount: selectedAssets.length
}

// Handle command execution
const handleExecuteCommand = async (command: CompiledCommand) => {
  for (const action of command.actions) {
    switch (action.actionType) {
      case 'select':
        if (action.payload.selectAll) {
          setSelectedAssets(assets.map(a => a.id))
        } else if (action.payload.selectUntagged) {
          const untagged = assets.filter(a => !a.tags || a.tags.length === 0)
          setSelectedAssets(untagged.map(a => a.id))
        }
        break

      case 'filter':
        const newFilter = {
          categoryId: action.payload.categoryId,
          categoryName: action.payload.categoryName,
          categoryDisplayName: action.payload.categoryDisplayName,
          categoryColor: action.payload.categoryColor,
          optionId: action.payload.tagId || action.payload.teamMemberId,
          optionName: action.payload.tagName || action.payload.teamMemberName,
          optionDisplayName: action.payload.tagDisplayName || action.payload.teamMemberName
        }
        setActiveFilters([...activeFilters, newFilter])
        break

      case 'tag':
        const tag = {
          id: action.payload.tagId,
          name: action.payload.tagName,
          displayName: action.payload.tagDisplayName,
          category: {
            id: action.payload.categoryId,
            name: action.payload.categoryName,
            displayName: action.payload.categoryDisplayName,
            color: action.payload.categoryColor
          }
        }
        await handleMultiTagSelectorChange([...omniTags, tag])
        break

      case 'untag':
        await handleRemoveTag(action.payload.tagId, selectedAssets.length, selectedAssets)
        break

      case 'delete':
        await confirmDeleteAssets(selectedAssets, `${selectedAssets.length} selected assets`)
        break

      case 'group':
        handleGroupBy(action.payload.categoryName)
        break

      case 'clear-selection':
        clearSelection()
        break

      case 'clear-filters':
        handleClearFilters()
        break

      case 'assign-team':
        const teamTag = {
          id: action.payload.teamMemberId,
          name: action.payload.teamMemberName,
          displayName: action.payload.teamMemberName,
          category: {
            id: 'team',
            name: 'team',
            displayName: 'Team',
            color: '#BCC9C2'
          }
        }
        await handleMultiTagSelectorChange([...omniTags, teamTag])
        break
    }
  }
}

// Add to JSX:
<CommandAutocomplete
  open={isNaturalCommandOpen}
  onClose={() => setIsNaturalCommandOpen(false)}
  onExecute={handleExecuteCommand}
  context={commandContext}
  isMobile={isMobile}
/>

// Add keyboard shortcut (e.g., Cmd+Shift+K):
useEffect(() => {
  const handleShortcut = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'k') {
      e.preventDefault()
      setIsNaturalCommandOpen(true)
    }
  }
  window.addEventListener('keydown', handleShortcut)
  return () => window.removeEventListener('keydown', handleShortcut)
}, [])
```

### Step 2: Add Launch Button

```tsx
<button
  onClick={() => setIsNaturalCommandOpen(true)}
  className="btn btn-primary"
>
  <Sparkles className="w-5 h-5" />
  Natural Commands
</button>
```

## Example Commands That Work

### Selection Commands
- `select all` - Select all visible assets
- `select untagged` - Select assets without tags
- `clear selection` - Clear current selection

### Filtering Commands
- `filter by bridal` - Filter by tag (autocompletes tag names)
- `filter by editorial` - Filter by another tag
- `clear filters` - Clear all active filters

### Tagging Commands
- `tag as bridal` - Tag selected assets
- `tag as editorial` - Tag with different value
- `untag romantic` - Remove specific tag from selection

### Grouping Commands
- `group by mood` - Group assets by category
- `group by team` - Group by team member

### Team Assignment
- `assign to Sarah` - Assign team member (autocompletes names)

### Chained Commands
- `select untagged and tag as bridal` - Select untagged, then tag them
- `filter by bridal and select all` - Filter, then select filtered results
- `select all and tag as editorial` - Select all, then tag them

## Key Features

### Real-Time Validation
- As you type, tokens are validated against grammar rules
- Invalid sequences show error messages
- Valid sequences show command preview

### Context-Aware Suggestions
- Suggests only valid next tokens based on grammar
- Tag/category names autocomplete from your data
- Team member names autocomplete with avatars
- Prioritizes suggestions by relevance

### Command Preview
- See what will happen before executing
- Shows human-readable description
- Execute button appears when command is complete

### Keyboard Navigation
- **Tab** - Accept current suggestion
- **↑ ↓** - Navigate through suggestions
- **Enter** - Execute command (or accept suggestion if incomplete)
- **Esc** - Close palette

### Color-Coded Tokens
- **Verbs** (dusty-rose): select, filter, tag, etc.
- **Objects** (sage): all, untagged, selected, etc.
- **Modifiers** (dune): as, by, with, to
- **Chainers** (cream-dark): and, then
- **Values** (terracotta): tag names, categories, team members

## Design Philosophy

The autocomplete system follows these principles:

1. **Progressive Disclosure** - Start simple, reveal complexity as needed
2. **Context-Aware** - Only show relevant suggestions based on current state
3. **Visual Feedback** - Color-coded tokens show command structure
4. **Forgiving** - Accepts aliases and flexible phrasing
5. **Discoverable** - Suggestions teach the grammar as you type

## Next Steps

After integration, you may want to:

1. **Add More Verbs** - Extend grammar.ts with new actions
2. **Custom Colors** - Adjust token colors in grammar definitions
3. **Analytics** - Track which commands are most used
4. **Shortcuts** - Add common commands to help text
5. **Mobile UX** - Optimize touch keyboard experience

## Troubleshooting

### Suggestions Not Appearing
- Check that `context.tagCategories` is populated
- Verify `context.teamMembers` has data
- Ensure categories have `tags` array

### Commands Not Executing
- Check `handleExecuteCommand` action handlers
- Verify action payloads match expected format
- Log `command.actions` to debug

### TypeScript Errors
- Ensure all imports are correct
- Check that `ContextData` type matches your data
- Verify `CompiledCommand` type is imported

## Support

For questions or issues:
1. Check the inline documentation in source files
2. Review example commands in CommandAutocomplete help text
3. Test with simple commands first before chaining
