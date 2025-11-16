/**
 * NLP System Exports
 * Central export point for the Natural Language Processing system
 */

// Main parser
export {
  parseNaturalLanguageQuery,
  explainParsedCommand,
  quickParse,
  batchParse,
  getExampleQueries,
  validateCommand,
  type ParsedCommand,
  type Intent,
  type IntentClassification,
  type ExtractedEntities,
  type EntityExtractionContext,
  type Tag,
  type TeamMember,
  type Collection,
  type DateRange,
} from './nlp-parser'

// Intent classification
export {
  classifyIntent,
  getIntentDescription,
  intentRequiresEntities,
} from './intent-classifier'

// Entity extraction
export {
  extractEntities,
  extractSortCriteria,
  extractGroupCriteria,
  extractQuantity,
  hasNegation,
  formatExtractedEntities,
} from './entity-extractor'

// Date parsing utilities
export {
  parseNaturalDateRange,
  parseNaturalDate,
  isDateInRange,
  extractDateFromQuery,
  formatDateRange,
} from '../utils/date-parser'

// String matching utilities
export {
  levenshteinDistance,
  similarityScore,
  fuzzyContains,
  findBestMatch,
  fuzzyMatchObjects,
  normalizeString,
  arePhoneticallySimilar,
  extractInitials,
  matchName,
} from '../utils/string-matching'
