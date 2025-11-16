/**
 * String matching utilities for fuzzy search and name matching
 * Implements Levenshtein distance algorithm for approximate string matching
 */

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits required to change one string into another
 *
 * @param str1 First string
 * @param str2 Second string
 * @returns Distance between strings (0 = identical)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length

  // Create a 2D array for dynamic programming
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0))

  // Initialize first column (deletions from str1)
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i
  }

  // Initialize first row (insertions to match str2)
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return matrix[len1][len2]
}

/**
 * Calculate similarity score between two strings (0-1 range)
 * 1.0 = perfect match, 0.0 = completely different
 *
 * @param str1 First string
 * @param str2 Second string
 * @returns Similarity score from 0 to 1
 */
export function similarityScore(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  if (s1 === s2) return 1.0
  if (s1.length === 0 || s2.length === 0) return 0.0

  const maxLen = Math.max(s1.length, s2.length)
  const distance = levenshteinDistance(s1, s2)

  return 1 - (distance / maxLen)
}

/**
 * Check if a string contains another string with fuzzy matching
 * Handles partial matches and typos
 *
 * @param haystack String to search in
 * @param needle String to search for
 * @param threshold Minimum similarity score (0-1) to consider a match
 * @returns Whether haystack contains needle with fuzzy matching
 */
export function fuzzyContains(
  haystack: string,
  needle: string,
  threshold: number = 0.7
): boolean {
  const h = haystack.toLowerCase().trim()
  const n = needle.toLowerCase().trim()

  // Exact substring match
  if (h.includes(n)) return true

  // Check if needle appears at start of haystack (prefix match)
  if (h.startsWith(n)) return true

  // Try fuzzy matching on words
  const haystackWords = h.split(/\s+/)
  const needleWords = n.split(/\s+/)

  // Check if all needle words have a match in haystack
  return needleWords.every(needleWord => {
    return haystackWords.some(haystackWord => {
      return similarityScore(haystackWord, needleWord) >= threshold
    })
  })
}

/**
 * Find best fuzzy match from a list of candidates
 *
 * @param query Search query
 * @param candidates List of candidate strings
 * @param threshold Minimum similarity score to consider
 * @returns Best match with score, or null if no match above threshold
 */
export function findBestMatch(
  query: string,
  candidates: string[],
  threshold: number = 0.6
): { match: string; score: number } | null {
  const q = query.toLowerCase().trim()

  let bestMatch: string | null = null
  let bestScore = threshold

  for (const candidate of candidates) {
    const c = candidate.toLowerCase().trim()

    // Exact match gets perfect score
    if (c === q) {
      return { match: candidate, score: 1.0 }
    }

    // Check for substring match (high priority)
    if (c.includes(q)) {
      const score = 0.9 + (0.1 * (q.length / c.length))
      if (score > bestScore) {
        bestScore = score
        bestMatch = candidate
      }
      continue
    }

    // Calculate similarity score
    const score = similarityScore(q, c)
    if (score > bestScore) {
      bestScore = score
      bestMatch = candidate
    }
  }

  return bestMatch ? { match: bestMatch, score: bestScore } : null
}

/**
 * Match a query against multiple candidate objects by a specific field
 *
 * @param query Search query
 * @param candidates Array of objects to search
 * @param fields Field names to search (can be nested using dot notation)
 * @param threshold Minimum similarity score
 * @returns Array of matches with scores, sorted by score descending
 */
export function fuzzyMatchObjects<T extends Record<string, any>>(
  query: string,
  candidates: T[],
  fields: string[],
  threshold: number = 0.6
): Array<{ item: T; score: number; matchedField: string }> {
  const q = query.toLowerCase().trim()
  const matches: Array<{ item: T; score: number; matchedField: string }> = []

  for (const candidate of candidates) {
    let bestScore = 0
    let bestField = ''

    for (const field of fields) {
      // Support nested fields (e.g., "category.name")
      const value = field.split('.').reduce((obj, key) => obj?.[key], candidate as any)

      if (typeof value !== 'string') continue

      const v = value.toLowerCase().trim()

      // Exact match
      if (v === q) {
        bestScore = 1.0
        bestField = field
        break
      }

      // Substring match
      if (v.includes(q)) {
        const score = 0.9 + (0.1 * (q.length / v.length))
        if (score > bestScore) {
          bestScore = score
          bestField = field
        }
        continue
      }

      // Fuzzy match
      const score = similarityScore(q, v)
      if (score > bestScore) {
        bestScore = score
        bestField = field
      }
    }

    if (bestScore >= threshold) {
      matches.push({ item: candidate, score: bestScore, matchedField: bestField })
    }
  }

  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score)
}

/**
 * Normalize a string for comparison
 * - Converts to lowercase
 * - Removes extra whitespace
 * - Removes special characters (optional)
 *
 * @param str String to normalize
 * @param removeSpecialChars Whether to remove special characters
 * @returns Normalized string
 */
export function normalizeString(str: string, removeSpecialChars: boolean = false): string {
  let normalized = str.toLowerCase().trim()

  // Replace multiple spaces with single space
  normalized = normalized.replace(/\s+/g, ' ')

  if (removeSpecialChars) {
    // Remove special characters except spaces and hyphens
    normalized = normalized.replace(/[^a-z0-9\s-]/g, '')
  }

  return normalized
}

/**
 * Check if two strings are phonetically similar
 * Uses simple phonetic rules (simplified Soundex-like approach)
 *
 * @param str1 First string
 * @param str2 Second string
 * @returns Whether strings sound similar
 */
export function arePhoneticallySimilar(str1: string, str2: string): boolean {
  const phonetic1 = generatePhoneticCode(str1)
  const phonetic2 = generatePhoneticCode(str2)

  return phonetic1 === phonetic2
}

/**
 * Generate a simple phonetic code for a string
 * Similar to Soundex but simplified
 *
 * @param str Input string
 * @returns Phonetic code
 */
function generatePhoneticCode(str: string): string {
  const s = str.toLowerCase().trim()
  if (!s) return ''

  // Keep first letter
  let code = s[0]

  // Replace similar sounding letters with codes
  const phonetics: Record<string, string> = {
    'a': '0', 'e': '0', 'i': '0', 'o': '0', 'u': '0',
    'b': '1', 'p': '1', 'f': '1', 'v': '1',
    'c': '2', 'g': '2', 'j': '2', 'k': '2', 'q': '2',
    's': '3', 'x': '3', 'z': '3',
    'd': '4', 't': '4',
    'l': '5',
    'm': '6', 'n': '6',
    'r': '7'
  }

  for (let i = 1; i < s.length; i++) {
    const letter = s[i]
    const phoneticCode = phonetics[letter] || letter

    // Skip if same as previous code
    if (phoneticCode !== code[code.length - 1]) {
      code += phoneticCode
    }
  }

  return code.slice(0, 6) // Limit length
}

/**
 * Extract initials from a name
 *
 * @param name Full name
 * @returns Initials (e.g., "John Doe" -> "JD")
 */
export function extractInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map(word => word[0])
    .join('')
    .toUpperCase()
}

/**
 * Match a query against a name, considering various formats
 * - Full name
 * - First name only
 * - Last name only
 * - Initials
 *
 * @param query Search query
 * @param fullName Full name to match against
 * @param threshold Minimum similarity score
 * @returns Match score (0-1) or null if below threshold
 */
export function matchName(
  query: string,
  fullName: string,
  threshold: number = 0.7
): number | null {
  const q = normalizeString(query)
  const name = normalizeString(fullName)

  // Exact match
  if (name === q) return 1.0

  // Full substring match
  if (name.includes(q)) {
    return 0.95
  }

  const nameParts = name.split(/\s+/)

  // Check if query matches first name
  if (nameParts[0] && similarityScore(q, nameParts[0]) >= threshold) {
    return similarityScore(q, nameParts[0])
  }

  // Check if query matches last name
  if (nameParts.length > 1) {
    const lastName = nameParts[nameParts.length - 1]
    if (similarityScore(q, lastName) >= threshold) {
      return similarityScore(q, lastName)
    }
  }

  // Check initials
  const initials = extractInitials(fullName).toLowerCase()
  if (q === initials || q.replace(/\./g, '') === initials) {
    return 0.85
  }

  // Full fuzzy match
  const score = similarityScore(q, name)
  return score >= threshold ? score : null
}
