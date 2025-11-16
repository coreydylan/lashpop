/**
 * Command Grammar Definition for DAM Command Palette
 *
 * This defines the complete grammar for natural language commands:
 * - Verbs: Actions that can be performed
 * - Objects: Targets of actions
 * - Modifiers: Qualifiers and parameters
 * - Chainers: Connectors for multi-step commands
 */

export type TokenType =
  | 'verb'
  | 'object'
  | 'modifier'
  | 'chainer'
  | 'value'
  | 'unknown'

export interface Token {
  type: TokenType
  value: string
  position: number
  length: number
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
    color?: string
  }
}

export interface GrammarRule {
  word: string
  aliases: string[]
  description: string
  requiresValue?: boolean
  validAfter?: TokenType[]
  color?: string
}

/**
 * VERBS - Actions that can be performed
 */
export const VERBS: Record<string, GrammarRule> = {
  select: {
    word: 'select',
    aliases: ['choose', 'pick'],
    description: 'Select assets',
    validAfter: [],
    color: '#C4A587' // dusty-rose
  },
  filter: {
    word: 'filter',
    aliases: ['show', 'find', 'search'],
    description: 'Filter assets',
    validAfter: [],
    color: '#A19781' // sage
  },
  tag: {
    word: 'tag',
    aliases: ['label', 'mark'],
    description: 'Add tags to assets',
    validAfter: [],
    color: '#BD8878' // terracotta
  },
  untag: {
    word: 'untag',
    aliases: ['remove', 'clear'],
    description: 'Remove tags from assets',
    validAfter: [],
    color: '#BD8878' // terracotta
  },
  delete: {
    word: 'delete',
    aliases: ['remove', 'trash'],
    description: 'Delete assets',
    validAfter: [],
    color: '#D4635F' // error red
  },
  group: {
    word: 'group',
    aliases: ['organize'],
    description: 'Group assets by category',
    validAfter: [],
    color: '#BCC9C2' // sage-light
  },
  clear: {
    word: 'clear',
    aliases: ['reset', 'remove'],
    description: 'Clear selection or filters',
    validAfter: [],
    color: '#A19781' // sage
  },
  assign: {
    word: 'assign',
    aliases: ['set'],
    description: 'Assign team member or attribute',
    validAfter: [],
    color: '#BCC9C2' // sage-light
  }
}

/**
 * OBJECTS - Targets of actions
 */
export const OBJECTS: Record<string, GrammarRule> = {
  all: {
    word: 'all',
    aliases: ['everything'],
    description: 'All visible assets',
    validAfter: ['verb'],
    color: '#C4A587' // dusty-rose
  },
  untagged: {
    word: 'untagged',
    aliases: ['without tags', 'bare'],
    description: 'Assets without tags',
    validAfter: ['verb'],
    color: '#C4A587' // dusty-rose
  },
  selected: {
    word: 'selected',
    aliases: ['selection', 'current'],
    description: 'Currently selected assets',
    validAfter: ['verb'],
    color: '#C4A587' // dusty-rose
  },
  filters: {
    word: 'filters',
    aliases: ['filter'],
    description: 'Active filters',
    validAfter: ['verb'],
    color: '#A19781' // sage
  },
  selection: {
    word: 'selection',
    aliases: ['selected'],
    description: 'Current selection',
    validAfter: ['verb'],
    color: '#C4A587' // dusty-rose
  },
  tags: {
    word: 'tags',
    aliases: ['labels'],
    description: 'Tag values',
    validAfter: ['verb'],
    color: '#BD8878' // terracotta
  }
}

/**
 * MODIFIERS - Qualifiers and parameters
 */
export const MODIFIERS: Record<string, GrammarRule> = {
  as: {
    word: 'as',
    aliases: [],
    description: 'Specify tag value',
    requiresValue: true,
    validAfter: ['verb', 'object'],
    color: '#8B7355' // dune
  },
  by: {
    word: 'by',
    aliases: [],
    description: 'Specify grouping or filter criteria',
    requiresValue: true,
    validAfter: ['verb', 'object'],
    color: '#8B7355' // dune
  },
  with: {
    word: 'with',
    aliases: [],
    description: 'Specify attribute or team member',
    requiresValue: true,
    validAfter: ['verb', 'object'],
    color: '#8B7355' // dune
  },
  to: {
    word: 'to',
    aliases: [],
    description: 'Specify target or destination',
    requiresValue: true,
    validAfter: ['verb', 'object'],
    color: '#8B7355' // dune
  }
}

/**
 * CHAINERS - Connectors for multi-step commands
 */
export const CHAINERS: Record<string, GrammarRule> = {
  and: {
    word: 'and',
    aliases: [],
    description: 'Chain actions together',
    validAfter: ['value', 'object'],
    color: '#E5E0D8' // cream-dark
  },
  then: {
    word: 'then',
    aliases: [],
    description: 'Sequence actions',
    validAfter: ['value', 'object'],
    color: '#E5E0D8' // cream-dark
  }
}

/**
 * Helper function to find a grammar rule by word or alias
 */
export function findGrammarRule(word: string): { type: TokenType; rule: GrammarRule } | null {
  const normalized = word.toLowerCase().trim()

  // Check verbs
  for (const [key, rule] of Object.entries(VERBS)) {
    if (key === normalized || rule.aliases.includes(normalized)) {
      return { type: 'verb', rule }
    }
  }

  // Check objects
  for (const [key, rule] of Object.entries(OBJECTS)) {
    if (key === normalized || rule.aliases.includes(normalized)) {
      return { type: 'object', rule }
    }
  }

  // Check modifiers
  for (const [key, rule] of Object.entries(MODIFIERS)) {
    if (key === normalized || rule.aliases.includes(normalized)) {
      return { type: 'modifier', rule }
    }
  }

  // Check chainers
  for (const [key, rule] of Object.entries(CHAINERS)) {
    if (key === normalized || rule.aliases.includes(normalized)) {
      return { type: 'chainer', rule }
    }
  }

  return null
}

/**
 * Get all valid next tokens based on the last token type
 */
export function getValidNextTokens(lastTokenType: TokenType | null): Array<{ type: TokenType; rule: GrammarRule }> {
  const results: Array<{ type: TokenType; rule: GrammarRule }> = []

  // If no previous token, only verbs are valid
  if (!lastTokenType) {
    Object.values(VERBS).forEach(rule => {
      results.push({ type: 'verb', rule })
    })
    return results
  }

  // Check all grammar categories
  const allRules = [
    ...Object.values(VERBS).map(rule => ({ type: 'verb' as TokenType, rule })),
    ...Object.values(OBJECTS).map(rule => ({ type: 'object' as TokenType, rule })),
    ...Object.values(MODIFIERS).map(rule => ({ type: 'modifier' as TokenType, rule })),
    ...Object.values(CHAINERS).map(rule => ({ type: 'chainer' as TokenType, rule }))
  ]

  // Filter by validAfter rules
  return allRules.filter(({ rule }) => {
    if (!rule.validAfter || rule.validAfter.length === 0) return false
    return rule.validAfter.includes(lastTokenType)
  })
}

/**
 * Command patterns - valid command structures
 */
export const COMMAND_PATTERNS = [
  // Selection commands
  { pattern: ['select', 'all'], description: 'Select all visible assets' },
  { pattern: ['select', 'untagged'], description: 'Select assets without tags' },
  { pattern: ['clear', 'selection'], description: 'Clear current selection' },

  // Filtering commands
  { pattern: ['filter', 'by', 'value'], description: 'Filter by tag or team' },
  { pattern: ['clear', 'filters'], description: 'Clear all active filters' },

  // Tagging commands
  { pattern: ['tag', 'as', 'value'], description: 'Tag selection with value' },
  { pattern: ['tag', 'selected', 'as', 'value'], description: 'Tag selected assets' },
  { pattern: ['untag', 'value'], description: 'Remove tag from selection' },

  // Grouping commands
  { pattern: ['group', 'by', 'value'], description: 'Group assets by category' },

  // Team assignment
  { pattern: ['assign', 'to', 'value'], description: 'Assign team member' },

  // Chained commands
  { pattern: ['select', 'untagged', 'and', 'tag', 'as', 'value'], description: 'Select untagged and tag them' },
  { pattern: ['filter', 'by', 'value', 'and', 'select', 'all'], description: 'Filter and select all results' }
]

/**
 * Validate if a token sequence forms a valid command
 */
export function validateCommandSequence(tokens: Token[]): { valid: boolean; error?: string } {
  if (tokens.length === 0) {
    return { valid: false, error: 'Empty command' }
  }

  // First token must be a verb
  if (tokens[0].type !== 'verb') {
    return { valid: false, error: 'Command must start with an action verb' }
  }

  // Check each token against validAfter rules
  for (let i = 1; i < tokens.length; i++) {
    const currentToken = tokens[i]
    const previousToken = tokens[i - 1]

    const grammarRule = findGrammarRule(currentToken.value)
    if (!grammarRule) continue

    const { rule } = grammarRule
    if (rule.validAfter && rule.validAfter.length > 0) {
      if (!rule.validAfter.includes(previousToken.type)) {
        return {
          valid: false,
          error: `"${currentToken.value}" cannot follow "${previousToken.value}"`
        }
      }
    }
  }

  // Check if modifiers have their required values
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.type === 'modifier') {
      const grammarRule = findGrammarRule(token.value)
      if (grammarRule?.rule.requiresValue) {
        const nextToken = tokens[i + 1]
        if (!nextToken || nextToken.type !== 'value') {
          return {
            valid: false,
            error: `"${token.value}" requires a value`
          }
        }
      }
    }
  }

  return { valid: true }
}
