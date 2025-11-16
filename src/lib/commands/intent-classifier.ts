/**
 * Intent classification for DAM command palette
 * Classifies natural language queries into actionable intents
 */

export type Intent =
  | 'SELECT'      // Select assets (e.g., "select all", "show me photos")
  | 'FILTER'      // Filter assets (e.g., "filter by tag", "show only portraits")
  | 'TAG'         // Add tags (e.g., "tag as portrait", "add landscape tag")
  | 'UNTAG'       // Remove tags (e.g., "remove tag", "untag portrait")
  | 'SET_TAG'     // Replace tags (e.g., "set tag to portrait")
  | 'ASSIGN_TEAM' // Assign team member (e.g., "assign to alice", "set artist to bob")
  | 'REMOVE_TEAM' // Remove team member assignment
  | 'COLLECTION'  // Collection/set operations (e.g., "add to collection", "create set")
  | 'VIEW'        // Change view settings (e.g., "show grid", "change layout")
  | 'SORT'        // Sort assets (e.g., "sort by date", "order by name")
  | 'GROUP'       // Group assets (e.g., "group by tag", "cluster by date")
  | 'CLEAR'       // Clear filters/selections (e.g., "clear all", "reset")
  | 'DOWNLOAD'    // Download assets
  | 'DELETE'      // Delete assets
  | 'SEARCH'      // Generic search (fallback)
  | 'UNKNOWN'     // Unable to classify

export interface IntentClassification {
  intent: Intent
  intentConfidence: number
  modifiers: {
    additive?: boolean      // Add to existing (vs replace)
    selective?: boolean     // Apply to selection only
    all?: boolean          // Apply to all assets
    negation?: boolean     // Negative query (e.g., "not tagged")
  }
}

/**
 * Classify a natural language query into an intent
 *
 * @param query User's natural language query
 * @returns Classified intent with confidence score
 */
export function classifyIntent(query: string): IntentClassification {
  const q = query.toLowerCase().trim()

  if (!q) {
    return {
      intent: 'UNKNOWN',
      intentConfidence: 0,
      modifiers: {},
    }
  }

  // Try each intent classifier in priority order
  const classifiers: Array<(q: string) => IntentClassification | null> = [
    classifyClear,
    classifyDelete,
    classifyDownload,
    classifySetTag,
    classifyUntag,
    classifyTag,
    classifyRemoveTeam,
    classifyAssignTeam,
    classifyCollection,
    classifyGroup,
    classifySort,
    classifyView,
    classifyFilter,
    classifySelect,
  ]

  for (const classifier of classifiers) {
    const result = classifier(q)
    if (result && result.confidence > 0.5) {
      return result
    }
  }

  // Default to SEARCH intent for any query
  return {
    intent: 'SEARCH',
    intentConfidence: 0.3,
    modifiers: {},
  }
}

/**
 * Extract modifiers from query
 */
function extractModifiers(query: string) {
  const modifiers: IntentClassification['modifiers'] = {}

  // Check for additive modifiers
  if (/\b(also|add|plus|and|additionally)\b/.test(query)) {
    modifiers.additive = true
  }

  // Check for selective modifiers
  if (/\b(selected|selection|these|chosen)\b/.test(query)) {
    modifiers.selective = true
  }

  // Check for "all" modifier
  if (/\b(all|everything|every)\b/.test(query)) {
    modifiers.all = true
  }

  // Check for negation
  if (/\b(not|remove|without|exclude|clear)\b/.test(query)) {
    modifiers.negation = true
  }

  return modifiers
}

/**
 * Classify SELECT intent
 * Patterns: "select", "show", "find", "get", "display"
 */
function classifySelect(query: string): IntentClassification | null {
  const patterns = [
    /^(select|choose|pick)\b/,
    /^(show|display|view)\s+(me\s+)?(all\s+)?/,
    /^(find|get|fetch|locate)\b/,
    /^(photos?|images?|assets?)\s+(of|with|by|from)/,
  ]

  for (const pattern of patterns) {
    if (pattern.test(query)) {
      return {
        intent: 'SELECT',
        intentConfidence: 0.9,
        modifiers: extractModifiers(query),
      }
    }
  }

  // Lower confidence patterns
  if (/^(what|which|where)\b/.test(query)) {
    return {
      intent: 'SELECT',
      intentConfidence: 0.6,
      modifiers: extractModifiers(query),
    }
  }

  return null
}

/**
 * Classify FILTER intent
 * Patterns: "filter", "only", "narrow", "with", "that have"
 */
function classifyFilter(query: string): IntentClassification | null {
  const patterns = [
    /^filter\b/,
    /^(show\s+)?only\b/,
    /^narrow\b/,
    /\b(with|having|that\s+have)\s+(the\s+)?tag/,
    /^photos?\s+tagged\s+(as|with)/,
  ]

  for (const pattern of patterns) {
    if (pattern.test(query)) {
      return {
        intent: 'FILTER',
        intentConfidence: 0.9,
        modifiers: extractModifiers(query),
      }
    }
  }

  return null
}

/**
 * Classify TAG intent
 * Patterns: "tag", "add tag", "label", "mark as"
 */
function classifyTag(query: string): IntentClassification | null {
  const patterns = [
    /^tag\s+(as|with|selected|all|these)/,
    /^add\s+(the\s+)?tag/,
    /^(apply|attach)\s+(the\s+)?tag/,
    /^label\s+(as|with)/,
    /^mark\s+(as|with)/,
  ]

  for (const pattern of patterns) {
    if (pattern.test(query)) {
      return {
        intent: 'TAG',
        intentConfidence: 0.95,
        modifiers: extractModifiers(query),
      }
    }
  }

  return null
}

/**
 * Classify UNTAG intent
 * Patterns: "remove tag", "untag", "delete tag"
 */
function classifyUntag(query: string): IntentClassification | null {
  const patterns = [
    /^untag\b/,
    /^remove\s+(the\s+)?tag/,
    /^delete\s+(the\s+)?tag/,
    /^clear\s+(the\s+)?tags?/,
    /^(strip|drop)\s+(the\s+)?tag/,
  ]

  for (const pattern of patterns) {
    if (pattern.test(query)) {
      return {
        intent: 'UNTAG',
        intentConfidence: 0.95,
        modifiers: extractModifiers(query),
      }
    }
  }

  return null
}

/**
 * Classify SET_TAG intent
 * Patterns: "set tag to", "replace tag with", "change tag to"
 */
function classifySetTag(query: string): IntentClassification | null {
  const patterns = [
    /^set\s+(the\s+)?tag\s+(to|as)/,
    /^replace\s+(the\s+)?tag\s+(with|to)/,
    /^change\s+(the\s+)?tag\s+(to|as)/,
  ]

  for (const pattern of patterns) {
    if (pattern.test(query)) {
      return {
        intent: 'SET_TAG',
        intentConfidence: 0.95,
        modifiers: extractModifiers(query),
      }
    }
  }

  return null
}

/**
 * Classify ASSIGN_TEAM intent
 * Patterns: "assign to", "set artist", "by photographer"
 */
function classifyAssignTeam(query: string): IntentClassification | null {
  const patterns = [
    /^assign\s+(to|team)/,
    /^set\s+(artist|photographer|team\s*member|creator|owner)\s+(to|as)/,
    /^(photos?\s+)?(by|from|of)\s+[a-z]/,
    /^give\s+to\b/,
    /^(photos?\s+)?taken\s+by\b/,
    /^(photos?\s+)?shot\s+by\b/,
  ]

  for (const pattern of patterns) {
    if (pattern.test(query)) {
      return {
        intent: 'ASSIGN_TEAM',
        intentConfidence: 0.9,
        modifiers: extractModifiers(query),
      }
    }
  }

  return null
}

/**
 * Classify REMOVE_TEAM intent
 * Patterns: "remove team", "unassign", "clear artist"
 */
function classifyRemoveTeam(query: string): IntentClassification | null {
  const patterns = [
    /^remove\s+(team|artist|photographer)/,
    /^unassign\b/,
    /^clear\s+(team|artist|photographer)/,
  ]

  for (const pattern of patterns) {
    if (pattern.test(query)) {
      return {
        intent: 'REMOVE_TEAM',
        intentConfidence: 0.95,
        modifiers: extractModifiers(query),
      }
    }
  }

  return null
}

/**
 * Classify COLLECTION intent
 * Patterns: "add to collection", "create set", "make collection"
 */
function classifyCollection(query: string): IntentClassification | null {
  const patterns = [
    /^add\s+to\s+(collection|set|album)/,
    /^(create|make|new)\s+(collection|set|album)/,
    /^(move|put)\s+in(to)?\s+(collection|set|album)/,
    /^remove\s+from\s+(collection|set|album)/,
  ]

  for (const pattern of patterns) {
    if (pattern.test(query)) {
      return {
        intent: 'COLLECTION',
        intentConfidence: 0.95,
        modifiers: extractModifiers(query),
      }
    }
  }

  return null
}

/**
 * Classify VIEW intent
 * Patterns: "show grid", "change layout", "view as"
 */
function classifyView(query: string): IntentClassification | null {
  const patterns = [
    /^(show|display|switch\s+to)\s+(grid|list|thumbnail|detail)/,
    /^change\s+(view|layout|display)/,
    /^view\s+(as|in)/,
    /^(compact|comfortable|spacious)\s+(view|mode)/,
  ]

  for (const pattern of patterns) {
    if (pattern.test(query)) {
      return {
        intent: 'VIEW',
        intentConfidence: 0.9,
        modifiers: extractModifiers(query),
      }
    }
  }

  return null
}

/**
 * Classify SORT intent
 * Patterns: "sort by", "order by", "arrange by"
 */
function classifySort(query: string): IntentClassification | null {
  const patterns = [
    /^sort\s+by\b/,
    /^order\s+by\b/,
    /^arrange\s+by\b/,
    /^(show\s+)?(oldest|newest|latest)\s+(first|photos)/,
  ]

  for (const pattern of patterns) {
    if (pattern.test(query)) {
      return {
        intent: 'SORT',
        intentConfidence: 0.9,
        modifiers: extractModifiers(query),
      }
    }
  }

  return null
}

/**
 * Classify GROUP intent
 * Patterns: "group by", "cluster by", "organize by"
 */
function classifyGroup(query: string): IntentClassification | null {
  const patterns = [
    /^group\s+by\b/,
    /^cluster\s+by\b/,
    /^organize\s+by\b/,
    /^categorize\s+by\b/,
  ]

  for (const pattern of patterns) {
    if (pattern.test(query)) {
      return {
        intent: 'GROUP',
        intentConfidence: 0.9,
        modifiers: extractModifiers(query),
      }
    }
  }

  return null
}

/**
 * Classify CLEAR intent
 * Patterns: "clear", "reset", "remove all"
 */
function classifyClear(query: string): IntentClassification | null {
  const patterns = [
    /^clear\s+(all|everything|filters?|selections?)/,
    /^reset\s+(all|everything|filters?|selections?)/,
    /^remove\s+all\s+(filters?|selections?)/,
    /^deselect\s+all/,
  ]

  for (const pattern of patterns) {
    if (pattern.test(query)) {
      return {
        intent: 'CLEAR',
        intentConfidence: 0.95,
        modifiers: extractModifiers(query),
      }
    }
  }

  return null
}

/**
 * Classify DOWNLOAD intent
 * Patterns: "download", "export", "save"
 */
function classifyDownload(query: string): IntentClassification | null {
  const patterns = [
    /^download\b/,
    /^export\b/,
    /^save\s+(as|to)\b/,
  ]

  for (const pattern of patterns) {
    if (pattern.test(query)) {
      return {
        intent: 'DOWNLOAD',
        intentConfidence: 0.95,
        modifiers: extractModifiers(query),
      }
    }
  }

  return null
}

/**
 * Classify DELETE intent
 * Patterns: "delete", "remove"
 */
function classifyDelete(query: string): IntentClassification | null {
  const patterns = [
    /^delete\s+(selected|all|these|photos?)/,
    /^remove\s+(selected|all|these|photos?)/,
    /^trash\b/,
  ]

  for (const pattern of patterns) {
    if (pattern.test(query)) {
      return {
        intent: 'DELETE',
        intentConfidence: 0.9,
        modifiers: extractModifiers(query),
      }
    }
  }

  return null
}

/**
 * Get a human-readable description of an intent
 */
export function getIntentDescription(intent: Intent): string {
  const descriptions: Record<Intent, string> = {
    SELECT: 'Select assets',
    FILTER: 'Filter assets',
    TAG: 'Add tags',
    UNTAG: 'Remove tags',
    SET_TAG: 'Replace tags',
    ASSIGN_TEAM: 'Assign team member',
    REMOVE_TEAM: 'Remove team member',
    COLLECTION: 'Manage collections',
    VIEW: 'Change view',
    SORT: 'Sort assets',
    GROUP: 'Group assets',
    CLEAR: 'Clear filters/selections',
    DOWNLOAD: 'Download assets',
    DELETE: 'Delete assets',
    SEARCH: 'Search assets',
    UNKNOWN: 'Unknown action',
  }

  return descriptions[intent]
}

/**
 * Check if an intent requires entities (tags, team members, etc.)
 */
export function intentRequiresEntities(intent: Intent): boolean {
  return [
    'TAG',
    'UNTAG',
    'SET_TAG',
    'ASSIGN_TEAM',
    'FILTER',
    'COLLECTION',
    'SORT',
    'GROUP',
  ].includes(intent)
}
