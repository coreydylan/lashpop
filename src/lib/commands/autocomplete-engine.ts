/**
 * Autocomplete Engine for DAM Command Palette
 *
 * Provides:
 * - Tokenizer: Breaks input into tokens
 * - Parser: Validates token sequences
 * - Suggestion Engine: Generates context-aware suggestions
 * - Real-time validation
 */

import {
  type Token,
  type TokenType,
  type GrammarRule,
  VERBS,
  OBJECTS,
  MODIFIERS,
  CHAINERS,
  findGrammarRule,
  getValidNextTokens,
  validateCommandSequence
} from './grammar'

export interface Suggestion {
  id: string
  type: TokenType
  value: string
  displayText: string
  description: string
  color?: string
  metadata?: {
    categoryId?: string
    categoryName?: string
    categoryDisplayName?: string
    categoryColor?: string
    tagId?: string
    tagName?: string
    tagDisplayName?: string
    teamMemberId?: string
    teamMemberName?: string
    avatarUrl?: string
  }
  priority: number // Higher priority = shown first
}

export interface ParseResult {
  tokens: Token[]
  isValid: boolean
  error?: string
  suggestions: Suggestion[]
  cursorPosition: number
  partialToken?: string
}

export interface ContextData {
  tagCategories: Array<{
    id: string
    name: string
    displayName: string
    color?: string
    tags?: Array<{
      id: string
      name: string
      displayName: string
    }>
  }>
  teamMembers: Array<{
    id: string
    name: string
    imageUrl: string
  }>
  hasSelection: boolean
  hasFilters: boolean
  selectedCount: number
}

/**
 * Tokenize input string into command tokens
 */
export function tokenize(input: string, context: ContextData): Token[] {
  const tokens: Token[] = []
  const words = input.trim().split(/\s+/)

  let position = 0
  for (const word of words) {
    if (!word) continue

    const grammarMatch = findGrammarRule(word)

    if (grammarMatch) {
      // It's a grammar token
      tokens.push({
        type: grammarMatch.type,
        value: grammarMatch.rule.word,
        position,
        length: word.length
      })
    } else {
      // It's a value (tag name, team member, category, etc.)
      const valueToken = parseValueToken(word, tokens, context)
      tokens.push(valueToken)
    }

    position += word.length + 1 // +1 for space
  }

  return tokens
}

/**
 * Parse a value token (tag, category, team member, etc.)
 */
function parseValueToken(word: string, existingTokens: Token[], context: ContextData): Token {
  const normalized = word.toLowerCase()

  // Check if previous token was a modifier that needs a specific type of value
  const lastToken = existingTokens[existingTokens.length - 1]

  if (lastToken?.type === 'modifier') {
    const modifier = lastToken.value

    // "by" expects category or "team"
    if (modifier === 'by') {
      // Check categories
      for (const category of context.tagCategories) {
        if (category.name.toLowerCase() === normalized ||
            category.displayName.toLowerCase() === normalized) {
          return {
            type: 'value',
            value: word,
            position: 0,
            length: word.length,
            metadata: {
              categoryId: category.id,
              categoryName: category.name,
              color: category.color
            }
          }
        }
      }

      // Check for "team"
      if (normalized === 'team') {
        return {
          type: 'value',
          value: word,
          position: 0,
          length: word.length,
          metadata: {
            categoryName: 'team'
          }
        }
      }
    }

    // "as" or "to" expects tag or team member
    if (modifier === 'as' || modifier === 'to') {
      // Check tags across all categories
      for (const category of context.tagCategories) {
        const tag = category.tags?.find(t =>
          t.name.toLowerCase() === normalized ||
          t.displayName.toLowerCase() === normalized
        )
        if (tag) {
          return {
            type: 'value',
            value: word,
            position: 0,
            length: word.length,
            metadata: {
              categoryId: category.id,
              categoryName: category.name,
              tagId: tag.id,
              tagName: tag.name,
              color: category.color
            }
          }
        }
      }

      // Check team members
      const member = context.teamMembers.find(m =>
        m.name.toLowerCase() === normalized
      )
      if (member) {
        return {
          type: 'value',
          value: word,
          position: 0,
          length: word.length,
          metadata: {
            teamMemberId: member.id,
            teamMemberName: member.name
          }
        }
      }
    }
  }

  // Default: unknown value
  return {
    type: 'value',
    value: word,
    position: 0,
    length: word.length
  }
}

/**
 * Generate suggestions based on current input and context
 */
export function generateSuggestions(
  input: string,
  cursorPosition: number,
  context: ContextData
): Suggestion[] {
  const suggestions: Suggestion[] = []
  const tokens = tokenize(input, context)
  const lastToken = tokens[tokens.length - 1]

  // Get partial word at cursor
  const beforeCursor = input.slice(0, cursorPosition)
  const words = beforeCursor.split(/\s+/)
  const partialWord = words[words.length - 1]?.toLowerCase() || ''

  // Determine what type of suggestions to show
  const lastTokenType = lastToken?.type || null

  // If we're starting fresh or after a chainer, suggest verbs
  if (!lastTokenType || lastTokenType === 'chainer') {
    Object.values(VERBS).forEach(rule => {
      if (rule.word.startsWith(partialWord) || partialWord === '') {
        suggestions.push({
          id: `verb-${rule.word}`,
          type: 'verb',
          value: rule.word,
          displayText: rule.word,
          description: rule.description,
          color: rule.color,
          priority: 100
        })
      }
    })
  }

  // Get valid next tokens from grammar
  const validNextTokens = getValidNextTokens(lastTokenType)

  validNextTokens.forEach(({ type, rule }) => {
    if (rule.word.startsWith(partialWord) || partialWord === '') {
      suggestions.push({
        id: `${type}-${rule.word}`,
        type,
        value: rule.word,
        displayText: rule.word,
        description: rule.description,
        color: rule.color,
        priority: 90
      })
    }
  })

  // If last token was a modifier that requires a value, suggest values
  if (lastToken?.type === 'modifier') {
    const modifier = lastToken.value

    if (modifier === 'by') {
      // Suggest categories for grouping
      context.tagCategories.forEach(category => {
        if (category.name.toLowerCase().includes(partialWord) ||
            category.displayName.toLowerCase().includes(partialWord)) {
          suggestions.push({
            id: `category-${category.id}`,
            type: 'value',
            value: category.name,
            displayText: category.displayName,
            description: `Group by ${category.displayName}`,
            color: category.color,
            metadata: {
              categoryId: category.id,
              categoryName: category.name,
              categoryDisplayName: category.displayName,
              categoryColor: category.color
            },
            priority: 80
          })
        }
      })

      // Suggest "team"
      if ('team'.includes(partialWord)) {
        suggestions.push({
          id: 'category-team',
          type: 'value',
          value: 'team',
          displayText: 'Team',
          description: 'Group by team member',
          color: '#BCC9C2',
          metadata: {
            categoryName: 'team'
          },
          priority: 85
        })
      }
    }

    if (modifier === 'as') {
      // Suggest tags from all categories
      context.tagCategories.forEach(category => {
        category.tags?.forEach(tag => {
          if (tag.name.toLowerCase().includes(partialWord) ||
              tag.displayName.toLowerCase().includes(partialWord)) {
            suggestions.push({
              id: `tag-${tag.id}`,
              type: 'value',
              value: tag.name,
              displayText: `${category.displayName} › ${tag.displayName}`,
              description: `Tag as ${tag.displayName}`,
              color: category.color,
              metadata: {
                categoryId: category.id,
                categoryName: category.name,
                categoryDisplayName: category.displayName,
                categoryColor: category.color,
                tagId: tag.id,
                tagName: tag.name,
                tagDisplayName: tag.displayName
              },
              priority: 85
            })
          }
        })
      })
    }

    if (modifier === 'to') {
      // Suggest team members
      context.teamMembers.forEach(member => {
        if (member.name.toLowerCase().includes(partialWord)) {
          suggestions.push({
            id: `team-${member.id}`,
            type: 'value',
            value: member.name,
            displayText: member.name,
            description: `Assign to ${member.name}`,
            color: '#BCC9C2',
            metadata: {
              teamMemberId: member.id,
              teamMemberName: member.name,
              avatarUrl: member.imageUrl
            },
            priority: 85
          })
        }
      })
    }
  }

  // Sort by priority (descending) and then alphabetically
  return suggestions.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority
    }
    return a.displayText.localeCompare(b.displayText)
  })
}

/**
 * Parse input and return complete result with tokens, validation, and suggestions
 */
export function parseCommand(
  input: string,
  cursorPosition: number,
  context: ContextData
): ParseResult {
  const tokens = tokenize(input, context)
  const validation = validateCommandSequence(tokens)
  const suggestions = generateSuggestions(input, cursorPosition, context)

  // Get partial token at cursor
  const beforeCursor = input.slice(0, cursorPosition)
  const words = beforeCursor.split(/\s+/)
  const partialToken = words[words.length - 1] || ''

  return {
    tokens,
    isValid: validation.valid,
    error: validation.error,
    suggestions,
    cursorPosition,
    partialToken
  }
}

/**
 * Auto-complete the current partial token with a suggestion
 */
export function autocomplete(
  input: string,
  cursorPosition: number,
  suggestion: Suggestion
): { newInput: string; newCursorPosition: number } {
  // Split input into before and after cursor
  const beforeCursor = input.slice(0, cursorPosition)
  const afterCursor = input.slice(cursorPosition)

  // Get the words before cursor and replace the last partial word
  const words = beforeCursor.split(/\s+/)
  words[words.length - 1] = suggestion.value

  // Reconstruct the input
  const newBeforeCursor = words.join(' ')
  const newInput = newBeforeCursor + ' ' + afterCursor.trim()
  const newCursorPosition = newBeforeCursor.length + 1

  return { newInput, newCursorPosition }
}

/**
 * Get command preview text
 */
export function getCommandPreview(tokens: Token[], context: ContextData): string {
  if (tokens.length === 0) return ''

  const parts: string[] = []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    if (token.type === 'value' && token.metadata) {
      // Format values with their metadata
      if (token.metadata.tagDisplayName) {
        parts.push(`"${token.metadata.tagDisplayName}"`)
      } else if (token.metadata.categoryName) {
        parts.push(`"${token.metadata.categoryName}"`)
      } else if (token.metadata.teamMemberName) {
        parts.push(`"${token.metadata.teamMemberName}"`)
      } else {
        parts.push(token.value)
      }
    } else {
      parts.push(token.value)
    }
  }

  return parts.join(' ')
}

/**
 * Check if command is complete and ready to execute
 */
export function isCommandComplete(tokens: Token[]): boolean {
  if (tokens.length === 0) return false

  const validation = validateCommandSequence(tokens)
  if (!validation.valid) return false

  // Check if any modifier is missing its required value
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.type === 'modifier') {
      const grammarRule = findGrammarRule(token.value)
      if (grammarRule?.rule.requiresValue) {
        const nextToken = tokens[i + 1]
        if (!nextToken || nextToken.type !== 'value') {
          return false
        }
      }
    }
  }

  // Must end with either an object or a value
  const lastToken = tokens[tokens.length - 1]
  return lastToken.type === 'object' || lastToken.type === 'value'
}
