/**
 * Search Utilities for DAM Command Palette
 *
 * Provides comprehensive search functionality with fuzzy matching
 * for assets by filename, caption, description, and tags
 */

interface Asset {
  id: string
  fileName: string
  filePath: string
  fileType: "image" | "video"
  uploadedAt: Date
  caption?: string
  description?: string
  teamMemberId?: string
  tags?: Array<{
    id: string
    name: string
    displayName: string
    category: {
      id: string
      name: string
      displayName: string
      color?: string
    }
  }>
}

export interface SearchResult {
  asset: Asset
  score: number
  matches: Array<{
    field: 'fileName' | 'caption' | 'description' | 'tags'
    value: string
    highlightRanges: Array<[number, number]>
  }>
}

export interface SearchOptions {
  fuzzy?: boolean
  caseSensitive?: boolean
  matchThreshold?: number // For fuzzy matching (0-1, default 0.6)
  fields?: Array<'fileName' | 'caption' | 'description' | 'tags'>
  limit?: number
  sortBy?: 'relevance' | 'date' | 'name'
}

/**
 * Search assets by query string
 */
export function searchAssets(
  assets: Asset[],
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const {
    fuzzy = true,
    caseSensitive = false,
    matchThreshold = 0.6,
    fields = ['fileName', 'caption', 'description', 'tags'],
    limit,
    sortBy = 'relevance'
  } = options

  if (!query.trim()) {
    return []
  }

  const normalizedQuery = caseSensitive ? query : query.toLowerCase()
  const results: SearchResult[] = []

  for (const asset of assets) {
    const matches: SearchResult['matches'] = []
    let totalScore = 0

    // Search filename
    if (fields.includes('fileName')) {
      const fileNameResult = fuzzy
        ? fuzzyMatch(asset.fileName, normalizedQuery, caseSensitive)
        : exactMatch(asset.fileName, normalizedQuery, caseSensitive)

      if (fileNameResult.score >= matchThreshold) {
        matches.push({
          field: 'fileName',
          value: asset.fileName,
          highlightRanges: fileNameResult.ranges
        })
        totalScore += fileNameResult.score * 2 // Filename matches are weighted higher
      }
    }

    // Search caption
    if (fields.includes('caption') && asset.caption) {
      const captionResult = fuzzy
        ? fuzzyMatch(asset.caption, normalizedQuery, caseSensitive)
        : exactMatch(asset.caption, normalizedQuery, caseSensitive)

      if (captionResult.score >= matchThreshold) {
        matches.push({
          field: 'caption',
          value: asset.caption,
          highlightRanges: captionResult.ranges
        })
        totalScore += captionResult.score * 1.5
      }
    }

    // Search description
    if (fields.includes('description') && asset.description) {
      const descResult = fuzzy
        ? fuzzyMatch(asset.description, normalizedQuery, caseSensitive)
        : exactMatch(asset.description, normalizedQuery, caseSensitive)

      if (descResult.score >= matchThreshold) {
        matches.push({
          field: 'description',
          value: asset.description,
          highlightRanges: descResult.ranges
        })
        totalScore += descResult.score
      }
    }

    // Search tags
    if (fields.includes('tags') && asset.tags) {
      for (const tag of asset.tags) {
        const tagText = `${tag.category.displayName}: ${tag.displayName}`
        const tagResult = fuzzy
          ? fuzzyMatch(tagText, normalizedQuery, caseSensitive)
          : exactMatch(tagText, normalizedQuery, caseSensitive)

        if (tagResult.score >= matchThreshold) {
          matches.push({
            field: 'tags',
            value: tagText,
            highlightRanges: tagResult.ranges
          })
          totalScore += tagResult.score * 1.2
        }
      }
    }

    // If we have matches, add to results
    if (matches.length > 0) {
      results.push({
        asset,
        score: totalScore / matches.length, // Average score
        matches
      })
    }
  }

  // Sort results
  results.sort((a, b) => {
    if (sortBy === 'relevance') {
      return b.score - a.score
    } else if (sortBy === 'date') {
      return b.asset.uploadedAt.getTime() - a.asset.uploadedAt.getTime()
    } else if (sortBy === 'name') {
      return a.asset.fileName.localeCompare(b.asset.fileName)
    }
    return 0
  })

  // Apply limit
  return limit ? results.slice(0, limit) : results
}

/**
 * Search by filename only
 */
export function searchByFileName(
  assets: Asset[],
  query: string,
  fuzzy: boolean = true
): SearchResult[] {
  return searchAssets(assets, query, {
    fuzzy,
    fields: ['fileName']
  })
}

/**
 * Search by caption or description
 */
export function searchByText(
  assets: Asset[],
  query: string,
  fuzzy: boolean = true
): SearchResult[] {
  return searchAssets(assets, query, {
    fuzzy,
    fields: ['caption', 'description']
  })
}

/**
 * Search by tags
 */
export function searchByTags(
  assets: Asset[],
  query: string,
  fuzzy: boolean = true
): SearchResult[] {
  return searchAssets(assets, query, {
    fuzzy,
    fields: ['tags']
  })
}

/**
 * Fuzzy match implementation
 * Returns a score (0-1) and character ranges that matched
 */
function fuzzyMatch(
  text: string,
  query: string,
  caseSensitive: boolean = false
): { score: number; ranges: Array<[number, number]> } {
  const searchText = caseSensitive ? text : text.toLowerCase()
  const searchQuery = caseSensitive ? query : query.toLowerCase()

  if (searchText.includes(searchQuery)) {
    // Exact substring match gets highest score
    const index = searchText.indexOf(searchQuery)
    return {
      score: 1.0,
      ranges: [[index, index + searchQuery.length]]
    }
  }

  // Character-by-character fuzzy matching
  let queryIndex = 0
  let textIndex = 0
  const ranges: Array<[number, number]> = []
  let currentRangeStart = -1
  let matches = 0

  while (queryIndex < searchQuery.length && textIndex < searchText.length) {
    if (searchQuery[queryIndex] === searchText[textIndex]) {
      if (currentRangeStart === -1) {
        currentRangeStart = textIndex
      }
      matches++
      queryIndex++
      textIndex++
    } else {
      if (currentRangeStart !== -1) {
        ranges.push([currentRangeStart, textIndex])
        currentRangeStart = -1
      }
      textIndex++
    }
  }

  // Close final range
  if (currentRangeStart !== -1) {
    ranges.push([currentRangeStart, textIndex])
  }

  // Calculate score based on:
  // 1. How many query characters matched
  // 2. How compact the matches are (fewer gaps = better)
  // 3. Whether match starts at beginning of word
  if (matches !== searchQuery.length) {
    return { score: 0, ranges: [] }
  }

  const matchRatio = matches / searchQuery.length
  const compactness = searchQuery.length / (textIndex - (ranges[0]?.[0] || 0))
  const startsAtWordBoundary = ranges[0]?.[0] === 0 || /\s/.test(searchText[ranges[0]?.[0] - 1] || '')

  let score = matchRatio * 0.5 + compactness * 0.3
  if (startsAtWordBoundary) {
    score += 0.2
  }

  return {
    score: Math.min(score, 1),
    ranges
  }
}

/**
 * Exact match (substring) implementation
 */
function exactMatch(
  text: string,
  query: string,
  caseSensitive: boolean = false
): { score: number; ranges: Array<[number, number]> } {
  const searchText = caseSensitive ? text : text.toLowerCase()
  const searchQuery = caseSensitive ? query : query.toLowerCase()

  const index = searchText.indexOf(searchQuery)

  if (index === -1) {
    return { score: 0, ranges: [] }
  }

  // Higher score if match is at the beginning
  const positionScore = index === 0 ? 1 : 0.8

  return {
    score: positionScore,
    ranges: [[index, index + searchQuery.length]]
  }
}

/**
 * Highlight matched text with markers
 */
export function highlightMatches(
  text: string,
  ranges: Array<[number, number]>,
  markerStart: string = '<mark>',
  markerEnd: string = '</mark>'
): string {
  if (ranges.length === 0) return text

  let result = ''
  let lastIndex = 0

  for (const [start, end] of ranges) {
    result += text.slice(lastIndex, start)
    result += markerStart + text.slice(start, end) + markerEnd
    lastIndex = end
  }

  result += text.slice(lastIndex)

  return result
}

/**
 * Get search suggestions based on partial query
 */
export function getSearchSuggestions(
  assets: Asset[],
  partialQuery: string,
  limit: number = 5
): string[] {
  const suggestions = new Set<string>()

  // Get unique filenames that match
  const fileNameMatches = searchByFileName(assets, partialQuery, true)
  fileNameMatches.slice(0, limit).forEach(result => {
    suggestions.add(result.asset.fileName)
  })

  // Get unique tags that match
  const tagMatches = searchByTags(assets, partialQuery, true)
  tagMatches.slice(0, limit).forEach(result => {
    result.matches.forEach(match => {
      if (match.field === 'tags') {
        suggestions.add(match.value)
      }
    })
  })

  return Array.from(suggestions).slice(0, limit)
}

/**
 * Filter assets by multiple criteria
 */
export function filterAssets(
  assets: Asset[],
  filters: {
    fileType?: 'image' | 'video'
    teamMemberId?: string
    tagIds?: string[]
    dateRange?: { start: Date; end: Date }
    hasCaption?: boolean
    hasDescription?: boolean
  }
): Asset[] {
  return assets.filter(asset => {
    // File type filter
    if (filters.fileType && asset.fileType !== filters.fileType) {
      return false
    }

    // Team member filter
    if (filters.teamMemberId && asset.teamMemberId !== filters.teamMemberId) {
      return false
    }

    // Tag filter (asset must have ALL specified tags)
    if (filters.tagIds && filters.tagIds.length > 0) {
      const assetTagIds = asset.tags?.map(t => t.id) || []
      if (!filters.tagIds.every(id => assetTagIds.includes(id))) {
        return false
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const uploadDate = new Date(asset.uploadedAt)
      if (uploadDate < filters.dateRange.start || uploadDate > filters.dateRange.end) {
        return false
      }
    }

    // Caption filter
    if (filters.hasCaption !== undefined) {
      const hasCaption = Boolean(asset.caption && asset.caption.trim())
      if (hasCaption !== filters.hasCaption) {
        return false
      }
    }

    // Description filter
    if (filters.hasDescription !== undefined) {
      const hasDescription = Boolean(asset.description && asset.description.trim())
      if (hasDescription !== filters.hasDescription) {
        return false
      }
    }

    return true
  })
}
