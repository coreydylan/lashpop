/**
 * Entity extraction for DAM command palette
 * Extracts tags, team members, collections, time ranges, and other entities from queries
 */

import { fuzzyMatchObjects, matchName, normalizeString } from '../utils/string-matching'
import { extractDateFromQuery, type DateRange } from '../utils/date-parser'

export interface Tag {
  id: string
  name: string
  displayName: string
  categoryId?: string
  categoryName?: string
  categoryDisplayName?: string
  categoryColor?: string
}

export interface TeamMember {
  id: string
  name: string
  imageUrl?: string
}

export interface Collection {
  id: string
  name: string
  displayName?: string
}

export interface ExtractedEntities {
  tags: Array<{ tag: Tag; confidence: number }>
  teamMembers: Array<{ member: TeamMember; confidence: number }>
  collections: Array<{ collection: Collection; confidence: number }>
  dateRange: DateRange | null
  modifiers: {
    selectAll?: boolean
    selectNone?: boolean
    selectInverse?: boolean
    additive?: boolean  // Add to existing vs replace
    selective?: boolean  // Apply to selected items only
    all?: boolean  // Apply to all items
    negation?: boolean  // Negated filter
  }
  cleanQuery: string  // Query with extracted entities removed
}

export interface EntityExtractionContext {
  availableTags: Tag[]
  availableTeamMembers: TeamMember[]
  availableCollections: Collection[]
}

/**
 * Extract all entities from a natural language query
 *
 * @param query User's natural language query
 * @param context Available tags, team members, and collections
 * @returns Extracted entities
 */
export function extractEntities(
  query: string,
  context: EntityExtractionContext
): ExtractedEntities {
  let workingQuery = query.trim()

  // Extract date range first (as it's often at the end)
  const { cleanQuery: afterDate, dateRange } = extractDateFromQuery(workingQuery)
  workingQuery = afterDate

  // Extract modifiers
  const modifiers = extractModifiers(workingQuery)
  workingQuery = removeModifierKeywords(workingQuery)

  // Extract team members
  const { members: teamMembers, cleanQuery: afterTeam } = extractTeamMembers(
    workingQuery,
    context.availableTeamMembers
  )
  workingQuery = afterTeam

  // Extract collections
  const { collections, cleanQuery: afterCollections } = extractCollections(
    workingQuery,
    context.availableCollections
  )
  workingQuery = afterCollections

  // Extract tags (do this last as tag names can be very generic)
  const { tags, cleanQuery: afterTags } = extractTags(
    workingQuery,
    context.availableTags
  )
  workingQuery = afterTags

  // Clean up the final query
  const cleanQuery = workingQuery
    .replace(/\s+/g, ' ')
    .replace(/^\s*(and|or|with|by|from|in|to|as|the|a|an)\s+/gi, '')
    .trim()

  return {
    tags,
    teamMembers,
    collections,
    dateRange,
    modifiers,
    cleanQuery,
  }
}

/**
 * Extract tag entities from query
 */
function extractTags(
  query: string,
  availableTags: Tag[]
): { tags: Array<{ tag: Tag; confidence: number }>; cleanQuery: string } {
  const q = query.toLowerCase().trim()
  const tags: Array<{ tag: Tag; confidence: number }> = []
  let cleanQuery = query

  // Remove common tag prefixes/suffixes
  const tagQuery = q
    .replace(/^(tagged?\s+(as|with|by)?|label(led)?\s+(as|with)?|mark(ed)?\s+(as|with)?)\s+/i, '')
    .replace(/\s+(tag|label|category)$/i, '')

  // Try exact and fuzzy matching
  const matches = fuzzyMatchObjects(
    tagQuery,
    availableTags,
    ['name', 'displayName', 'categoryName', 'categoryDisplayName'],
    0.6
  )

  // Take top matches
  for (const match of matches.slice(0, 3)) {
    tags.push({
      tag: match.item,
      confidence: match.score,
    })

    // Remove matched tag from query
    const tagText = match.item.displayName || match.item.name
    cleanQuery = cleanQuery.replace(new RegExp(tagText, 'gi'), '')
  }

  // Also check for quoted strings (e.g., "portrait photography")
  const quotedMatches = query.match(/"([^"]+)"/g)
  if (quotedMatches) {
    for (const quotedMatch of quotedMatches) {
      const quotedText = quotedMatch.replace(/"/g, '')
      const exactMatches = availableTags.filter(tag =>
        tag.name.toLowerCase() === quotedText.toLowerCase() ||
        tag.displayName?.toLowerCase() === quotedText.toLowerCase()
      )

      for (const tag of exactMatches) {
        // Check if not already added
        if (!tags.some(t => t.tag.id === tag.id)) {
          tags.push({ tag, confidence: 1.0 })
        }
        cleanQuery = cleanQuery.replace(quotedMatch, '')
      }
    }
  }

  return { tags, cleanQuery }
}

/**
 * Extract team member entities from query
 */
function extractTeamMembers(
  query: string,
  availableMembers: TeamMember[]
): { members: Array<{ member: TeamMember; confidence: number }>; cleanQuery: string } {
  const q = query.toLowerCase().trim()
  const members: Array<{ member: TeamMember; confidence: number }> = []
  let cleanQuery = query

  // Remove common team member prefixes
  const memberQuery = q
    .replace(/^(by|from|of|photographer|artist|team\s*member|taken\s+by|shot\s+by)\s+/i, '')
    .replace(/\s+'s\s+(photos?|images?|work|shots?)/i, '')

  // Try matching against team member names
  for (const member of availableMembers) {
    const score = matchName(memberQuery, member.name, 0.7)
    if (score !== null) {
      members.push({
        member,
        confidence: score,
      })

      // Remove matched name from query
      cleanQuery = cleanQuery.replace(new RegExp(member.name, 'gi'), '')
    }
  }

  // Sort by confidence
  members.sort((a, b) => b.confidence - a.confidence)

  // Also check for possessive forms (e.g., "alice's photos")
  const possessiveMatch = query.match(/(\w+)'s\s+(photos?|images?|work|shots?)/i)
  if (possessiveMatch) {
    const name = possessiveMatch[1]
    for (const member of availableMembers) {
      const score = matchName(name, member.name, 0.7)
      if (score !== null && !members.some(m => m.member.id === member.id)) {
        members.push({ member, confidence: score })
      }
    }
    cleanQuery = cleanQuery.replace(possessiveMatch[0], '')
  }

  return { members, cleanQuery }
}

/**
 * Extract collection/set entities from query
 */
function extractCollections(
  query: string,
  availableCollections: Collection[]
): { collections: Array<{ collection: Collection; confidence: number }>; cleanQuery: string } {
  const q = query.toLowerCase().trim()
  const collections: Array<{ collection: Collection; confidence: number }> = []
  let cleanQuery = query

  // Remove common collection prefixes/suffixes
  const collectionQuery = q
    .replace(/^(in|from|of)\s+(the\s+)?(collection|set|album)\s+/i, '')
    .replace(/\s+(collection|set|album)$/i, '')

  // Try exact and fuzzy matching
  const matches = fuzzyMatchObjects(
    collectionQuery,
    availableCollections,
    ['name', 'displayName'],
    0.7
  )

  for (const match of matches.slice(0, 2)) {
    collections.push({
      collection: match.item,
      confidence: match.score,
    })

    // Remove matched collection from query
    const collectionText = match.item.displayName || match.item.name
    cleanQuery = cleanQuery.replace(new RegExp(collectionText, 'gi'), '')
  }

  return { collections, cleanQuery }
}

/**
 * Extract modifiers from query
 */
function extractModifiers(query: string): ExtractedEntities['modifiers'] {
  const q = query.toLowerCase()
  const modifiers: ExtractedEntities['modifiers'] = {}

  // Select all
  if (/\b(select\s+)?all\b/.test(q)) {
    modifiers.selectAll = true
  }

  // Select none / deselect
  if (/\b(select\s+)?none|deselect\s+all|clear\s+selection\b/.test(q)) {
    modifiers.selectNone = true
  }

  // Select inverse
  if (/\binvert\s+selection|select\s+inverse|reverse\s+selection\b/.test(q)) {
    modifiers.selectInverse = true
  }

  // Additive (add to existing vs replace)
  if (/\b(also|add|plus|additionally|too)\b/.test(q)) {
    modifiers.additive = true
  }

  return modifiers
}

/**
 * Remove modifier keywords from query
 */
function removeModifierKeywords(query: string): string {
  return query
    .replace(/\b(also|add|plus|additionally|too)\b/gi, '')
    .replace(/\binvert\s+selection\b/gi, '')
    .replace(/\bselect\s+inverse\b/gi, '')
    .replace(/\breverse\s+selection\b/gi, '')
    .replace(/\bselect\s+none\b/gi, '')
    .replace(/\bdeselect\s+all\b/gi, '')
    .replace(/\bclear\s+selection\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract sorting criteria from query
 */
export function extractSortCriteria(query: string): {
  field: 'date' | 'name' | 'size' | 'team'
  direction: 'asc' | 'desc'
  confidence: number
} | null {
  const q = query.toLowerCase()

  // Date sorting
  if (/\b(date|time|uploaded|created|newest|latest|oldest|recent)\b/.test(q)) {
    const direction = /\b(oldest|ascending|asc)\b/.test(q) ? 'asc' : 'desc'
    return { field: 'date', direction, confidence: 0.9 }
  }

  // Name sorting
  if (/\b(name|title|alphabetic(al)?|a-z|z-a)\b/.test(q)) {
    const direction = /\b(z-a|descending|desc|reverse)\b/.test(q) ? 'desc' : 'asc'
    return { field: 'name', direction, confidence: 0.9 }
  }

  // Size sorting
  if (/\b(size|filesize|largest|smallest|biggest|tiniest)\b/.test(q)) {
    const direction = /\b(smallest|tiniest|ascending|asc)\b/.test(q) ? 'asc' : 'desc'
    return { field: 'size', direction, confidence: 0.9 }
  }

  // Team member sorting
  if (/\b(team|artist|photographer|creator)\b/.test(q)) {
    return { field: 'team', direction: 'asc', confidence: 0.8 }
  }

  return null
}

/**
 * Extract grouping criteria from query
 */
export function extractGroupCriteria(query: string): {
  field: 'date' | 'tag' | 'team' | 'collection'
  confidence: number
} | null {
  const q = query.toLowerCase()

  if (/\b(date|time|day|week|month|year)\b/.test(q)) {
    return { field: 'date', confidence: 0.9 }
  }

  if (/\b(tag|label|category)\b/.test(q)) {
    return { field: 'tag', confidence: 0.9 }
  }

  if (/\b(team|artist|photographer|creator)\b/.test(q)) {
    return { field: 'team', confidence: 0.9 }
  }

  if (/\b(collection|set|album)\b/.test(q)) {
    return { field: 'collection', confidence: 0.9 }
  }

  return null
}

/**
 * Check if query contains negation (e.g., "not tagged", "without tag")
 */
export function hasNegation(query: string): boolean {
  const q = query.toLowerCase()
  return /\b(not|without|exclude|excluding|except)\b/.test(q)
}

/**
 * Extract quantity from query (e.g., "first 10", "last 5")
 */
export function extractQuantity(query: string): {
  count: number
  position: 'first' | 'last' | 'random'
  confidence: number
} | null {
  const q = query.toLowerCase()

  // Match patterns like "first 10", "last 5", "10 random"
  const firstMatch = q.match(/\bfirst\s+(\d+)\b/)
  if (firstMatch) {
    return {
      count: parseInt(firstMatch[1], 10),
      position: 'first',
      confidence: 0.95,
    }
  }

  const lastMatch = q.match(/\blast\s+(\d+)\b/)
  if (lastMatch) {
    return {
      count: parseInt(lastMatch[1], 10),
      position: 'last',
      confidence: 0.95,
    }
  }

  const randomMatch = q.match(/(\d+)\s+random\b/)
  if (randomMatch) {
    return {
      count: parseInt(randomMatch[1], 10),
      position: 'random',
      confidence: 0.9,
    }
  }

  return null
}

/**
 * Format extracted entities for debugging/display
 */
export function formatExtractedEntities(entities: ExtractedEntities): string {
  const parts: string[] = []

  if (entities.tags.length > 0) {
    const tagNames = entities.tags
      .map(t => `${t.tag.displayName || t.tag.name} (${(t.confidence * 100).toFixed(0)}%)`)
      .join(', ')
    parts.push(`Tags: ${tagNames}`)
  }

  if (entities.teamMembers.length > 0) {
    const memberNames = entities.teamMembers
      .map(m => `${m.member.name} (${(m.confidence * 100).toFixed(0)}%)`)
      .join(', ')
    parts.push(`Team: ${memberNames}`)
  }

  if (entities.collections.length > 0) {
    const collectionNames = entities.collections
      .map(c => `${c.collection.displayName || c.collection.name} (${(c.confidence * 100).toFixed(0)}%)`)
      .join(', ')
    parts.push(`Collections: ${collectionNames}`)
  }

  if (entities.dateRange) {
    parts.push(`Date: ${entities.dateRange.description}`)
  }

  if (entities.cleanQuery) {
    parts.push(`Remaining: "${entities.cleanQuery}"`)
  }

  return parts.length > 0 ? parts.join(' | ') : 'No entities extracted'
}
