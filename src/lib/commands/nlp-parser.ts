/**
 * NLP Parser - Main orchestrator for natural language processing
 * Combines intent classification, entity extraction, and date parsing
 * to convert natural language queries into structured commands
 */

import {
  classifyIntent,
  getIntentDescription,
  intentRequiresEntities,
  type Intent,
  type IntentClassification,
} from './intent-classifier'
import {
  extractEntities,
  extractSortCriteria,
  extractGroupCriteria,
  extractQuantity,
  hasNegation,
  formatExtractedEntities,
  type ExtractedEntities,
  type EntityExtractionContext,
  type Tag,
  type TeamMember,
  type Collection,
} from './entity-extractor'
import type { DateRange } from '../utils/date-parser'

export interface ParsedCommand {
  // Original query
  query: string

  // Classified intent
  intent: Intent
  intentConfidence: number
  intentDescription: string

  // Extracted entities
  entities: ExtractedEntities

  // Additional structured data
  sort?: {
    field: 'date' | 'name' | 'size' | 'team'
    direction: 'asc' | 'desc'
    confidence: number
  }
  group?: {
    field: 'date' | 'tag' | 'team' | 'collection'
    confidence: number
  }
  quantity?: {
    count: number
    position: 'first' | 'last' | 'random'
    confidence: number
  }

  // Flags
  hasNegation: boolean

  // Overall confidence score (0-1)
  overallConfidence: number

  // Suggestions for user (if confidence is low)
  suggestions?: string[]
}

/**
 * Main NLP parser function
 * Converts a natural language query into a structured command
 *
 * @param query User's natural language query
 * @param context Available tags, team members, and collections for entity extraction
 * @returns Parsed command with intent, entities, and metadata
 */
export function parseNaturalLanguageQuery(
  query: string,
  context: EntityExtractionContext
): ParsedCommand {
  // Step 1: Classify intent
  const intentClassification = classifyIntent(query)

  // Step 2: Extract entities if needed
  const entities = intentRequiresEntities(intentClassification.intent)
    ? extractEntities(query, context)
    : createEmptyEntities(query)

  // Step 3: Extract additional structured data based on intent
  const sort = intentClassification.intent === 'SORT'
    ? extractSortCriteria(query)
    : undefined

  const group = intentClassification.intent === 'GROUP'
    ? extractGroupCriteria(query)
    : undefined

  const quantity = extractQuantity(query)

  const negation = hasNegation(query)

  // Step 4: Calculate overall confidence
  const overallConfidence = calculateOverallConfidence(
    intentClassification,
    entities,
    sort,
    group
  )

  // Step 5: Generate suggestions if confidence is low
  const suggestions = overallConfidence < 0.6
    ? generateSuggestions(intentClassification, entities, context)
    : undefined

  return {
    query,
    intent: intentClassification.intent,
    intentConfidence: intentClassification.intentConfidence,
    intentDescription: getIntentDescription(intentClassification.intent),
    entities,
    sort,
    group,
    quantity,
    hasNegation: negation,
    overallConfidence,
    suggestions,
  }
}

/**
 * Create empty entities structure
 */
function createEmptyEntities(query: string): ExtractedEntities {
  return {
    tags: [],
    teamMembers: [],
    collections: [],
    dateRange: null,
    modifiers: {},
    cleanQuery: query,
  }
}

/**
 * Calculate overall confidence score
 * Weighted combination of intent confidence and entity extraction quality
 */
function calculateOverallConfidence(
  intent: IntentClassification,
  entities: ExtractedEntities,
  sort?: any,
  group?: any
): number {
  let confidence = intent.intentConfidence * 0.5 // Intent is 50% of confidence

  // Add entity confidence (30% of total)
  const entityScores = [
    ...entities.tags.map(t => t.confidence),
    ...entities.teamMembers.map(m => m.confidence),
    ...entities.collections.map(c => c.confidence),
  ]

  if (entityScores.length > 0) {
    const avgEntityConfidence = entityScores.reduce((a, b) => a + b, 0) / entityScores.length
    confidence += avgEntityConfidence * 0.3
  } else if (intentRequiresEntities(intent.intent)) {
    // Penalize if entities are required but none found
    confidence *= 0.5
  } else {
    // No entities required, give full entity confidence
    confidence += 0.3
  }

  // Add date range confidence (10% of total)
  if (entities.dateRange) {
    confidence += entities.dateRange.confidence * 0.1
  } else {
    confidence += 0.1 // No date range required
  }

  // Add sort/group confidence (10% of total)
  if (sort) {
    confidence += sort.confidence * 0.1
  } else if (group) {
    confidence += group.confidence * 0.1
  } else {
    confidence += 0.1
  }

  // Ensure confidence is between 0 and 1
  return Math.max(0, Math.min(1, confidence))
}

/**
 * Generate helpful suggestions when confidence is low
 */
function generateSuggestions(
  intent: IntentClassification,
  entities: ExtractedEntities,
  context: EntityExtractionContext
): string[] {
  const suggestions: string[] = []

  // If intent is unclear
  if (intent.intentConfidence < 0.6) {
    suggestions.push('Try starting with a clear action word like "show", "filter", "tag", or "assign"')
  }

  // If entities are required but not found
  if (intentRequiresEntities(intent.intent) &&
      entities.tags.length === 0 &&
      entities.teamMembers.length === 0 &&
      entities.collections.length === 0) {

    if (intent.intent === 'TAG' || intent.intent === 'FILTER') {
      suggestions.push('Specify a tag name. Available tags: ' +
        context.availableTags.slice(0, 5).map(t => t.displayName || t.name).join(', '))
    }

    if (intent.intent === 'ASSIGN_TEAM') {
      suggestions.push('Specify a team member name. Available: ' +
        context.availableTeamMembers.slice(0, 5).map(m => m.name).join(', '))
    }
  }

  // If entities have low confidence
  const lowConfidenceEntities = [
    ...entities.tags.filter(t => t.confidence < 0.7),
    ...entities.teamMembers.filter(m => m.confidence < 0.7),
  ]

  if (lowConfidenceEntities.length > 0) {
    suggestions.push('Did you mean one of these? Use quotes for exact matches.')
  }

  return suggestions
}

/**
 * Convert parsed command to a human-readable explanation
 */
export function explainParsedCommand(parsed: ParsedCommand): string {
  const parts: string[] = []

  // Intent
  parts.push(`Intent: ${parsed.intentDescription}`)
  parts.push(`Confidence: ${(parsed.overallConfidence * 100).toFixed(0)}%`)

  // Entities
  if (parsed.entities.tags.length > 0) {
    const tagNames = parsed.entities.tags.map(t => t.tag.displayName || t.tag.name).join(', ')
    parts.push(`Tags: ${tagNames}`)
  }

  if (parsed.entities.teamMembers.length > 0) {
    const memberNames = parsed.entities.teamMembers.map(m => m.member.name).join(', ')
    parts.push(`Team Members: ${memberNames}`)
  }

  if (parsed.entities.collections.length > 0) {
    const collectionNames = parsed.entities.collections
      .map(c => c.collection.displayName || c.collection.name)
      .join(', ')
    parts.push(`Collections: ${collectionNames}`)
  }

  if (parsed.entities.dateRange) {
    parts.push(`Date Range: ${parsed.entities.dateRange.description}`)
  }

  // Sort/Group
  if (parsed.sort) {
    parts.push(`Sort: ${parsed.sort.field} ${parsed.sort.direction}`)
  }

  if (parsed.group) {
    parts.push(`Group: ${parsed.group.field}`)
  }

  // Quantity
  if (parsed.quantity) {
    parts.push(`Quantity: ${parsed.quantity.position} ${parsed.quantity.count}`)
  }

  // Modifiers
  const modifiers: string[] = []
  if (parsed.entities.modifiers.selectAll) modifiers.push('select all')
  if (parsed.entities.modifiers.selectNone) modifiers.push('select none')
  if (parsed.entities.modifiers.selectInverse) modifiers.push('invert selection')
  if (parsed.entities.modifiers.additive) modifiers.push('additive')
  if (modifiers.length > 0) {
    parts.push(`Modifiers: ${modifiers.join(', ')}`)
  }

  if (parsed.hasNegation) {
    parts.push('Negation: true')
  }

  return parts.join('\n')
}

/**
 * Quick parse function for common queries
 * Returns a simplified result for faster processing
 */
export function quickParse(query: string): {
  intent: Intent
  confidence: number
  needsFullParse: boolean
} {
  const intent = classifyIntent(query)

  // Determine if we need full parsing
  const needsFullParse = intentRequiresEntities(intent.intent) ||
                         intent.intentConfidence < 0.8

  return {
    intent: intent.intent,
    confidence: intent.intentConfidence,
    needsFullParse,
  }
}

/**
 * Batch parse multiple queries
 * Useful for pre-processing or analytics
 */
export function batchParse(
  queries: string[],
  context: EntityExtractionContext
): ParsedCommand[] {
  return queries.map(query => parseNaturalLanguageQuery(query, context))
}

/**
 * Get example queries for each intent
 * Useful for onboarding or help documentation
 */
export function getExampleQueries(): Record<Intent, string[]> {
  return {
    SELECT: [
      'show me all photos',
      'select photos from last week',
      'find images by Alice',
    ],
    FILTER: [
      'filter by portrait tag',
      'show only landscape photos',
      'photos with nature tag',
    ],
    TAG: [
      'tag as portrait',
      'add landscape tag',
      'label selected as sunset',
    ],
    UNTAG: [
      'remove portrait tag',
      'untag selected',
      'clear nature tag',
    ],
    SET_TAG: [
      'set tag to portrait',
      'replace tag with landscape',
      'change tag to nature',
    ],
    ASSIGN_TEAM: [
      'assign to Alice',
      'set photographer to Bob',
      'photos by Alice',
    ],
    REMOVE_TEAM: [
      'remove team member',
      'unassign photographer',
      'clear artist',
    ],
    COLLECTION: [
      'add to Summer 2024 collection',
      'create new set',
      'move to Best Photos album',
    ],
    VIEW: [
      'show grid view',
      'change to list layout',
      'compact mode',
    ],
    SORT: [
      'sort by date',
      'order by newest first',
      'arrange by name',
    ],
    GROUP: [
      'group by tag',
      'cluster by photographer',
      'organize by date',
    ],
    CLEAR: [
      'clear all filters',
      'reset selection',
      'remove all filters',
    ],
    DOWNLOAD: [
      'download selected',
      'export all',
      'save these photos',
    ],
    DELETE: [
      'delete selected photos',
      'remove these images',
      'trash selected',
    ],
    SEARCH: [
      'search for sunset',
      'find portrait photos',
    ],
    UNKNOWN: [],
  }
}

/**
 * Validate a parsed command
 * Check if the command has enough information to be executed
 */
export function validateCommand(parsed: ParsedCommand): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check if confidence is too low
  if (parsed.overallConfidence < 0.4) {
    errors.push('Command confidence is too low. Please be more specific.')
  }

  // Check if required entities are present
  if (intentRequiresEntities(parsed.intent)) {
    const hasEntities =
      parsed.entities.tags.length > 0 ||
      parsed.entities.teamMembers.length > 0 ||
      parsed.entities.collections.length > 0

    if (!hasEntities) {
      errors.push(`${parsed.intentDescription} requires specifying tags, team members, or collections.`)
    }
  }

  // Intent-specific validation
  if (parsed.intent === 'SORT' && !parsed.sort) {
    errors.push('Sort command requires specifying what to sort by (e.g., date, name).')
  }

  if (parsed.intent === 'GROUP' && !parsed.group) {
    errors.push('Group command requires specifying how to group (e.g., by tag, by date).')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Export types for use in other modules
 */
export type {
  Intent,
  IntentClassification,
  ExtractedEntities,
  EntityExtractionContext,
  Tag,
  TeamMember,
  Collection,
  DateRange,
}
