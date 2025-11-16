/**
 * NLP Parser Usage Examples
 * Demonstrates how to integrate the NLP system with the Command Palette
 */

import { parseNaturalLanguageQuery, explainParsedCommand, validateCommand } from './nlp-parser'
import type { EntityExtractionContext } from './entity-extractor'

/**
 * Example: Basic usage
 */
export function basicExample() {
  // Sample context data (normally fetched from API)
  const context: EntityExtractionContext = {
    availableTags: [
      { id: '1', name: 'portrait', displayName: 'Portrait', categoryId: 'c1', categoryName: 'style' },
      { id: '2', name: 'landscape', displayName: 'Landscape', categoryId: 'c1', categoryName: 'style' },
      { id: '3', name: 'nature', displayName: 'Nature', categoryId: 'c2', categoryName: 'subject' },
    ],
    availableTeamMembers: [
      { id: 't1', name: 'Alice Johnson' },
      { id: 't2', name: 'Bob Smith' },
      { id: 't3', name: 'Carol Martinez' },
    ],
    availableCollections: [
      { id: 'col1', name: 'summer-2024', displayName: 'Summer 2024' },
      { id: 'col2', name: 'best-shots', displayName: 'Best Shots' },
    ],
  }

  // Parse a query
  const query = "show me alice's photos from last week"
  const parsed = parseNaturalLanguageQuery(query, context)

  console.log('Query:', query)
  console.log('Intent:', parsed.intent, `(${(parsed.intentConfidence * 100).toFixed(0)}%)`)
  console.log('Overall Confidence:', (parsed.overallConfidence * 100).toFixed(0) + '%')
  console.log('\nExtracted Entities:')
  console.log('  Team Members:', parsed.entities.teamMembers.map(m => m.member.name))
  console.log('  Date Range:', parsed.entities.dateRange?.description)
  console.log('\nExplanation:')
  console.log(explainParsedCommand(parsed))

  // Validate the command
  const validation = validateCommand(parsed)
  console.log('\nValid:', validation.valid)
  if (!validation.valid) {
    console.log('Errors:', validation.errors)
  }

  return parsed
}

/**
 * Example: Tag filtering
 */
export function tagFilteringExample() {
  const context: EntityExtractionContext = {
    availableTags: [
      { id: '1', name: 'portrait', displayName: 'Portrait' },
      { id: '2', name: 'landscape', displayName: 'Landscape' },
    ],
    availableTeamMembers: [],
    availableCollections: [],
  }

  const queries = [
    'filter by portrait tag',
    'show only landscape photos',
    'photos tagged as portrait',
  ]

  queries.forEach(query => {
    const parsed = parseNaturalLanguageQuery(query, context)
    console.log(`\nQuery: "${query}"`)
    console.log(`Intent: ${parsed.intent} (${(parsed.overallConfidence * 100).toFixed(0)}%)`)
    console.log(`Tags: ${parsed.entities.tags.map(t => t.tag.displayName).join(', ')}`)
  })
}

/**
 * Example: Team member assignment
 */
export function teamAssignmentExample() {
  const context: EntityExtractionContext = {
    availableTags: [],
    availableTeamMembers: [
      { id: 't1', name: 'Alice Johnson' },
      { id: 't2', name: 'Bob Smith' },
    ],
    availableCollections: [],
  }

  const queries = [
    'assign to Alice',
    'set photographer to Bob',
    "photos by alice's",
    'taken by Bob Smith',
  ]

  queries.forEach(query => {
    const parsed = parseNaturalLanguageQuery(query, context)
    console.log(`\nQuery: "${query}"`)
    console.log(`Intent: ${parsed.intent}`)
    console.log(`Team: ${parsed.entities.teamMembers.map(m => `${m.member.name} (${(m.confidence * 100).toFixed(0)}%)`).join(', ')}`)
  })
}

/**
 * Example: Date range queries
 */
export function dateRangeExample() {
  const context: EntityExtractionContext = {
    availableTags: [],
    availableTeamMembers: [],
    availableCollections: [],
  }

  const queries = [
    'show photos from last week',
    'yesterday\'s images',
    'photos from last 3 days',
    'this month\'s uploads',
    'last year',
  ]

  queries.forEach(query => {
    const parsed = parseNaturalLanguageQuery(query, context)
    console.log(`\nQuery: "${query}"`)
    console.log(`Date Range: ${parsed.entities.dateRange?.description || 'None'}`)
    console.log(`Confidence: ${(parsed.entities.dateRange?.confidence || 0) * 100}%`)
  })
}

/**
 * Example: Complex multi-entity queries
 */
export function complexQueryExample() {
  const context: EntityExtractionContext = {
    availableTags: [
      { id: '1', name: 'portrait', displayName: 'Portrait' },
      { id: '2', name: 'landscape', displayName: 'Landscape' },
    ],
    availableTeamMembers: [
      { id: 't1', name: 'Alice Johnson' },
      { id: 't2', name: 'Bob Smith' },
    ],
    availableCollections: [
      { id: 'col1', name: 'summer-2024', displayName: 'Summer 2024' },
    ],
  }

  const queries = [
    "show me alice's portrait photos from last week",
    'filter landscape photos by bob from this month',
    'tag selected as portrait and add to summer 2024',
  ]

  queries.forEach(query => {
    const parsed = parseNaturalLanguageQuery(query, context)
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Query: "${query}"`)
    console.log(`${'='.repeat(60)}`)
    console.log(explainParsedCommand(parsed))
  })
}

/**
 * Example: Integration with Command Palette
 */
export function commandPaletteIntegration(
  userQuery: string,
  context: EntityExtractionContext
) {
  // Parse the query
  const parsed = parseNaturalLanguageQuery(userQuery, context)

  // Validate the command
  const validation = validateCommand(parsed)
  if (!validation.valid) {
    return {
      error: true,
      message: validation.errors.join(' '),
      suggestions: parsed.suggestions,
    }
  }

  // Convert parsed command to actions
  switch (parsed.intent) {
    case 'SELECT':
    case 'FILTER':
      return {
        action: 'filter',
        filters: {
          tags: parsed.entities.tags.map(t => t.tag.id),
          teamMembers: parsed.entities.teamMembers.map(m => m.member.id),
          dateRange: parsed.entities.dateRange,
        },
      }

    case 'TAG':
      return {
        action: 'addTags',
        tagIds: parsed.entities.tags.map(t => t.tag.id),
        applyToSelection: parsed.entities.modifiers.selective !== false,
      }

    case 'UNTAG':
      return {
        action: 'removeTags',
        tagIds: parsed.entities.tags.map(t => t.tag.id),
        applyToSelection: parsed.entities.modifiers.selective !== false,
      }

    case 'ASSIGN_TEAM':
      return {
        action: 'assignTeam',
        teamMemberId: parsed.entities.teamMembers[0]?.member.id,
        applyToSelection: parsed.entities.modifiers.selective !== false,
      }

    case 'SORT':
      return {
        action: 'sort',
        field: parsed.sort?.field || 'date',
        direction: parsed.sort?.direction || 'desc',
      }

    case 'GROUP':
      return {
        action: 'group',
        field: parsed.group?.field || 'date',
      }

    case 'CLEAR':
      return {
        action: 'clearFilters',
      }

    default:
      return {
        action: 'search',
        query: parsed.entities.cleanQuery || userQuery,
      }
  }
}

/**
 * Example: Real-time suggestions as user types
 */
export function realtimeSuggestionsExample(
  partialQuery: string,
  context: EntityExtractionContext
): string[] {
  const suggestions: string[] = []

  // If query is too short, provide intent suggestions
  if (partialQuery.length < 3) {
    return [
      'Try: "show photos from last week"',
      'Try: "filter by portrait tag"',
      'Try: "assign to alice"',
    ]
  }

  // Parse the partial query
  const parsed = parseNaturalLanguageQuery(partialQuery, context)

  // If confidence is low, suggest completions
  if (parsed.overallConfidence < 0.6) {
    // Suggest tag names
    if (parsed.intent === 'TAG' || parsed.intent === 'FILTER') {
      const tagSuggestions = context.availableTags
        .slice(0, 3)
        .map(tag => `${partialQuery} ${tag.displayName}`)
      suggestions.push(...tagSuggestions)
    }

    // Suggest team member names
    if (parsed.intent === 'ASSIGN_TEAM' || parsed.intent === 'SELECT') {
      const teamSuggestions = context.availableTeamMembers
        .slice(0, 3)
        .map(member => `${partialQuery} ${member.name}`)
      suggestions.push(...teamSuggestions)
    }
  }

  return suggestions
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('\n### Basic Example ###')
  basicExample()

  console.log('\n\n### Tag Filtering Example ###')
  tagFilteringExample()

  console.log('\n\n### Team Assignment Example ###')
  teamAssignmentExample()

  console.log('\n\n### Date Range Example ###')
  dateRangeExample()

  console.log('\n\n### Complex Query Example ###')
  complexQueryExample()
}

// Uncomment to run examples
// runAllExamples()
