/**
 * Command Compiler for DAM Command Palette
 *
 * Converts tokenized commands into executable actions
 */

import type { Token } from './grammar'
import type { ContextData } from './autocomplete-engine'

export interface CompiledCommand {
  type: CommandType
  description: string
  actions: CommandAction[]
  preview: string
}

export type CommandType =
  | 'select'
  | 'filter'
  | 'tag'
  | 'untag'
  | 'delete'
  | 'group'
  | 'clear'
  | 'assign'
  | 'chain'

export interface CommandAction {
  actionType: 'select' | 'filter' | 'tag' | 'untag' | 'delete' | 'group' | 'clear-selection' | 'clear-filters' | 'assign-team'
  payload: any
}

/**
 * Compile tokens into executable command
 */
export function compileCommand(tokens: Token[], context: ContextData): CompiledCommand | null {
  if (tokens.length === 0) return null

  const verb = tokens[0].value

  // Check for chained commands (contains 'and' or 'then')
  const chainingIndex = tokens.findIndex(t => t.value === 'and' || t.value === 'then')
  if (chainingIndex !== -1) {
    return compileChainedCommand(tokens, chainingIndex, context)
  }

  // Single commands
  switch (verb) {
    case 'select':
      return compileSelectCommand(tokens, context)
    case 'filter':
      return compileFilterCommand(tokens, context)
    case 'tag':
      return compileTagCommand(tokens, context)
    case 'untag':
      return compileUntagCommand(tokens, context)
    case 'delete':
      return compileDeleteCommand(tokens, context)
    case 'group':
      return compileGroupCommand(tokens, context)
    case 'clear':
      return compileClearCommand(tokens, context)
    case 'assign':
      return compileAssignCommand(tokens, context)
    default:
      return null
  }
}

/**
 * Compile chained commands (e.g., "select untagged and tag as bridal")
 */
function compileChainedCommand(tokens: Token[], chainingIndex: number, context: ContextData): CompiledCommand | null {
  const firstPartTokens = tokens.slice(0, chainingIndex)
  const secondPartTokens = tokens.slice(chainingIndex + 1)

  const firstCommand = compileCommand(firstPartTokens, context)
  const secondCommand = compileCommand(secondPartTokens, context)

  if (!firstCommand || !secondCommand) return null

  return {
    type: 'chain',
    description: `${firstCommand.description}, then ${secondCommand.description}`,
    actions: [...firstCommand.actions, ...secondCommand.actions],
    preview: `${firstCommand.preview} → ${secondCommand.preview}`
  }
}

/**
 * Compile SELECT command
 */
function compileSelectCommand(tokens: Token[], context: ContextData): CompiledCommand | null {
  // "select all" - select all visible assets
  if (tokens.length === 2 && tokens[1].value === 'all') {
    return {
      type: 'select',
      description: 'Select all visible assets',
      actions: [{
        actionType: 'select',
        payload: { selectAll: true }
      }],
      preview: 'Will select all visible assets'
    }
  }

  // "select untagged" - select assets without tags
  if (tokens.length === 2 && tokens[1].value === 'untagged') {
    return {
      type: 'select',
      description: 'Select all untagged assets',
      actions: [{
        actionType: 'select',
        payload: { selectUntagged: true }
      }],
      preview: 'Will select all assets without tags'
    }
  }

  return null
}

/**
 * Compile FILTER command
 */
function compileFilterCommand(tokens: Token[], context: ContextData): CompiledCommand | null {
  // "filter by {value}"
  if (tokens.length >= 3 && tokens[1].value === 'by') {
    const valueToken = tokens[2]

    if (valueToken.metadata?.categoryId && valueToken.metadata?.tagId) {
      // Filter by specific tag
      return {
        type: 'filter',
        description: `Filter by ${valueToken.metadata.tagDisplayName || valueToken.value}`,
        actions: [{
          actionType: 'filter',
          payload: {
            categoryId: valueToken.metadata.categoryId,
            categoryName: valueToken.metadata.categoryName,
            categoryDisplayName: valueToken.metadata.categoryDisplayName,
            categoryColor: valueToken.metadata.categoryColor,
            tagId: valueToken.metadata.tagId,
            tagName: valueToken.metadata.tagName,
            tagDisplayName: valueToken.metadata.tagDisplayName
          }
        }],
        preview: `Filter by ${valueToken.metadata.categoryDisplayName} › ${valueToken.metadata.tagDisplayName}`
      }
    }

    if (valueToken.metadata?.teamMemberId) {
      // Filter by team member
      return {
        type: 'filter',
        description: `Filter by team member ${valueToken.metadata.teamMemberName}`,
        actions: [{
          actionType: 'filter',
          payload: {
            categoryId: 'team',
            categoryName: 'team',
            categoryDisplayName: 'Team',
            categoryColor: '#BCC9C2',
            teamMemberId: valueToken.metadata.teamMemberId,
            teamMemberName: valueToken.metadata.teamMemberName
          }
        }],
        preview: `Filter by Team › ${valueToken.metadata.teamMemberName}`
      }
    }
  }

  return null
}

/**
 * Compile TAG command
 */
function compileTagCommand(tokens: Token[], context: ContextData): CompiledCommand | null {
  // "tag as {value}" or "tag selected as {value}"
  const asIndex = tokens.findIndex(t => t.value === 'as')
  if (asIndex === -1 || asIndex === tokens.length - 1) return null

  const valueToken = tokens[asIndex + 1]

  if (!valueToken.metadata?.tagId) return null

  const targetSelection = tokens.some(t => t.value === 'selected') || context.hasSelection

  return {
    type: 'tag',
    description: `Tag ${targetSelection ? 'selected assets' : 'selection'} as ${valueToken.metadata.tagDisplayName}`,
    actions: [{
      actionType: 'tag',
      payload: {
        categoryId: valueToken.metadata.categoryId,
        categoryName: valueToken.metadata.categoryName,
        categoryDisplayName: valueToken.metadata.categoryDisplayName,
        categoryColor: valueToken.metadata.categoryColor,
        tagId: valueToken.metadata.tagId,
        tagName: valueToken.metadata.tagName,
        tagDisplayName: valueToken.metadata.tagDisplayName
      }
    }],
    preview: `Tag as ${valueToken.metadata.categoryDisplayName} › ${valueToken.metadata.tagDisplayName}`
  }
}

/**
 * Compile UNTAG command
 */
function compileUntagCommand(tokens: Token[], context: ContextData): CompiledCommand | null {
  // "untag {value}"
  if (tokens.length >= 2) {
    const valueToken = tokens[1]

    if (valueToken.metadata?.tagId) {
      return {
        type: 'untag',
        description: `Remove ${valueToken.metadata.tagDisplayName} tag`,
        actions: [{
          actionType: 'untag',
          payload: {
            tagId: valueToken.metadata.tagId,
            tagDisplayName: valueToken.metadata.tagDisplayName
          }
        }],
        preview: `Remove ${valueToken.metadata.categoryDisplayName} › ${valueToken.metadata.tagDisplayName}`
      }
    }
  }

  return null
}

/**
 * Compile DELETE command
 */
function compileDeleteCommand(tokens: Token[], context: ContextData): CompiledCommand | null {
  // "delete selected" or just "delete"
  const targetSelection = tokens.some(t => t.value === 'selected') || context.hasSelection

  return {
    type: 'delete',
    description: `Delete ${targetSelection ? `${context.selectedCount} selected asset${context.selectedCount === 1 ? '' : 's'}` : 'selection'}`,
    actions: [{
      actionType: 'delete',
      payload: {
        confirmationRequired: true
      }
    }],
    preview: `⚠️ Delete ${context.selectedCount} asset${context.selectedCount === 1 ? '' : 's'}`
  }
}

/**
 * Compile GROUP command
 */
function compileGroupCommand(tokens: Token[], context: ContextData): CompiledCommand | null {
  // "group by {value}"
  if (tokens.length >= 3 && tokens[1].value === 'by') {
    const valueToken = tokens[2]

    if (valueToken.metadata?.categoryName) {
      return {
        type: 'group',
        description: `Group by ${valueToken.metadata.categoryDisplayName || valueToken.value}`,
        actions: [{
          actionType: 'group',
          payload: {
            categoryName: valueToken.metadata.categoryName,
            categoryDisplayName: valueToken.metadata.categoryDisplayName || valueToken.value
          }
        }],
        preview: `Group by ${valueToken.metadata.categoryDisplayName || valueToken.value}`
      }
    }
  }

  return null
}

/**
 * Compile CLEAR command
 */
function compileClearCommand(tokens: Token[], context: ContextData): CompiledCommand | null {
  // "clear selection"
  if (tokens.some(t => t.value === 'selection')) {
    return {
      type: 'clear',
      description: 'Clear current selection',
      actions: [{
        actionType: 'clear-selection',
        payload: {}
      }],
      preview: `Clear ${context.selectedCount} selected asset${context.selectedCount === 1 ? '' : 's'}`
    }
  }

  // "clear filters"
  if (tokens.some(t => t.value === 'filters')) {
    return {
      type: 'clear',
      description: 'Clear all filters',
      actions: [{
        actionType: 'clear-filters',
        payload: {}
      }],
      preview: 'Clear all active filters'
    }
  }

  return null
}

/**
 * Compile ASSIGN command
 */
function compileAssignCommand(tokens: Token[], context: ContextData): CompiledCommand | null {
  // "assign to {team member}"
  const toIndex = tokens.findIndex(t => t.value === 'to')
  if (toIndex === -1 || toIndex === tokens.length - 1) return null

  const valueToken = tokens[toIndex + 1]

  if (valueToken.metadata?.teamMemberId) {
    return {
      type: 'assign',
      description: `Assign to ${valueToken.metadata.teamMemberName}`,
      actions: [{
        actionType: 'assign-team',
        payload: {
          teamMemberId: valueToken.metadata.teamMemberId,
          teamMemberName: valueToken.metadata.teamMemberName
        }
      }],
      preview: `Assign to Team › ${valueToken.metadata.teamMemberName}`
    }
  }

  return null
}

/**
 * Get human-readable description of compiled command
 */
export function getCommandDescription(command: CompiledCommand): string {
  return command.description
}

/**
 * Get preview text for command (what will happen when executed)
 */
export function getCommandPreviewText(command: CompiledCommand): string {
  return command.preview
}
