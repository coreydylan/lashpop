/**
 * Tag Management Utilities
 *
 * Advanced tag operations for the DAM system
 */

export interface TagUsageStats {
  tagId: string
  tagName: string
  categoryId: string
  categoryName: string
  usageCount: number
  lastUsed?: string
  assets: string[]
}

export interface Tag {
  id: string
  name: string
  displayName: string
  category: {
    id: string
    name: string
    displayName: string
    color?: string
  }
}

export interface Asset {
  id: string
  fileName: string
  tags?: Tag[]
}

/**
 * Get tag usage statistics across all assets
 */
export function getTagUsageStats(
  assets: Asset[],
  allTags: Tag[]
): TagUsageStats[] {
  const statsMap = new Map<string, TagUsageStats>()

  // Initialize all tags with zero usage
  allTags.forEach(tag => {
    statsMap.set(tag.id, {
      tagId: tag.id,
      tagName: tag.displayName,
      categoryId: tag.category.id,
      categoryName: tag.category.displayName,
      usageCount: 0,
      assets: []
    })
  })

  // Count usage across assets
  assets.forEach(asset => {
    asset.tags?.forEach(tag => {
      const stats = statsMap.get(tag.id)
      if (stats) {
        stats.usageCount++
        stats.assets.push(asset.id)
        // Update last used to most recent (assuming assets are sorted)
        if (!stats.lastUsed) {
          stats.lastUsed = new Date().toISOString()
        }
      }
    })
  })

  return Array.from(statsMap.values()).sort((a, b) => b.usageCount - a.usageCount)
}

/**
 * Find unused tags (tags that aren't applied to any asset)
 */
export function findUnusedTags(assets: Asset[], allTags: Tag[]): Tag[] {
  const usedTagIds = new Set<string>()

  assets.forEach(asset => {
    asset.tags?.forEach(tag => {
      usedTagIds.add(tag.id)
    })
  })

  return allTags.filter(tag => !usedTagIds.has(tag.id))
}

/**
 * Find duplicate tags (same name but different IDs)
 */
export function findDuplicateTags(allTags: Tag[]): Array<{
  name: string
  tags: Tag[]
}> {
  const tagsByName = new Map<string, Tag[]>()

  allTags.forEach(tag => {
    const normalizedName = tag.name.toLowerCase().trim()
    if (!tagsByName.has(normalizedName)) {
      tagsByName.set(normalizedName, [])
    }
    tagsByName.get(normalizedName)!.push(tag)
  })

  return Array.from(tagsByName.entries())
    .filter(([, tags]) => tags.length > 1)
    .map(([name, tags]) => ({ name, tags }))
}

/**
 * Replace a tag across all selected assets
 */
export function replaceTagInAssets(
  assets: Asset[],
  oldTagId: string,
  newTagId: string,
  allTags: Tag[]
): {
  updatedAssets: Asset[]
  affectedCount: number
} {
  const newTag = allTags.find(t => t.id === newTagId)
  if (!newTag) {
    throw new Error(`New tag with ID ${newTagId} not found`)
  }

  let affectedCount = 0
  const updatedAssets = assets.map(asset => {
    const hasOldTag = asset.tags?.some(t => t.id === oldTagId)
    if (!hasOldTag) return asset

    affectedCount++
    return {
      ...asset,
      tags: [
        ...(asset.tags?.filter(t => t.id !== oldTagId) || []),
        newTag
      ]
    }
  })

  return { updatedAssets, affectedCount }
}

/**
 * Merge two tags (combine into one)
 */
export function mergeTags(
  assets: Asset[],
  sourceTagIds: string[],
  targetTagId: string,
  allTags: Tag[]
): {
  updatedAssets: Asset[]
  affectedCount: number
} {
  const targetTag = allTags.find(t => t.id === targetTagId)
  if (!targetTag) {
    throw new Error(`Target tag with ID ${targetTagId} not found`)
  }

  const sourceTagIdSet = new Set(sourceTagIds)
  let affectedCount = 0

  const updatedAssets = assets.map(asset => {
    const hasSourceTag = asset.tags?.some(t => sourceTagIdSet.has(t.id))
    if (!hasSourceTag) return asset

    const hasTargetTag = asset.tags?.some(t => t.id === targetTagId)
    affectedCount++

    // Remove source tags and add target tag if not already present
    const filteredTags = asset.tags?.filter(t => !sourceTagIdSet.has(t.id)) || []

    return {
      ...asset,
      tags: hasTargetTag ? filteredTags : [...filteredTags, targetTag]
    }
  })

  return { updatedAssets, affectedCount }
}

/**
 * Copy tags from one asset to multiple assets
 */
export function copyTagsToAssets(
  sourceAsset: Asset,
  targetAssets: Asset[],
  options: {
    replace?: boolean // Replace all existing tags
    merge?: boolean   // Merge with existing tags (default)
  } = { merge: true }
): Asset[] {
  if (!sourceAsset.tags || sourceAsset.tags.length === 0) {
    return targetAssets
  }

  return targetAssets.map(asset => {
    if (options.replace) {
      return {
        ...asset,
        tags: [...sourceAsset.tags!]
      }
    }

    // Merge: add source tags that don't already exist
    const existingTagIds = new Set(asset.tags?.map(t => t.id) || [])
    const newTags = sourceAsset.tags!.filter(t => !existingTagIds.has(t.id))

    return {
      ...asset,
      tags: [...(asset.tags || []), ...newTags]
    }
  })
}

/**
 * Remove all tags from assets
 */
export function removeAllTagsFromAssets(assets: Asset[]): Asset[] {
  return assets.map(asset => ({
    ...asset,
    tags: []
  }))
}

/**
 * Get tag suggestions based on co-occurrence patterns
 */
export function getTagSuggestions(
  currentTags: Tag[],
  allAssets: Asset[],
  limit = 5
): Array<{
  tag: Tag
  confidence: number
  coOccurrenceCount: number
}> {
  if (currentTags.length === 0) return []

  const currentTagIds = new Set(currentTags.map(t => t.id))
  const coOccurrenceMap = new Map<string, number>()

  // Find assets that have any of the current tags
  allAssets.forEach(asset => {
    const assetHasCurrentTag = asset.tags?.some(t => currentTagIds.has(t.id))
    if (!assetHasCurrentTag) return

    // Count co-occurring tags
    asset.tags?.forEach(tag => {
      if (currentTagIds.has(tag.id)) return // Skip current tags
      coOccurrenceMap.set(tag.id, (coOccurrenceMap.get(tag.id) || 0) + 1)
    })
  })

  // Get unique tags and calculate confidence
  const suggestions: Array<{
    tag: Tag
    confidence: number
    coOccurrenceCount: number
  }> = []

  const processedTagIds = new Set<string>()

  allAssets.forEach(asset => {
    asset.tags?.forEach(tag => {
      if (currentTagIds.has(tag.id) || processedTagIds.has(tag.id)) return

      const count = coOccurrenceMap.get(tag.id) || 0
      if (count === 0) return

      processedTagIds.add(tag.id)

      // Confidence based on co-occurrence frequency
      const totalAssetsWithCurrentTags = allAssets.filter(a =>
        a.tags?.some(t => currentTagIds.has(t.id))
      ).length

      const confidence = totalAssetsWithCurrentTags > 0
        ? count / totalAssetsWithCurrentTags
        : 0

      suggestions.push({
        tag,
        confidence,
        coOccurrenceCount: count
      })
    })
  })

  return suggestions
    .sort((a, b) => b.coOccurrenceCount - a.coOccurrenceCount)
    .slice(0, limit)
}

/**
 * Analyze tag categories and provide insights
 */
export function analyzeTagCategories(
  assets: Asset[],
  allTags: Tag[]
): {
  totalTags: number
  usedTags: number
  unusedTags: number
  categoryCoverage: Array<{
    categoryId: string
    categoryName: string
    totalTags: number
    usedTags: number
    coveragePercent: number
  }>
  mostUsedCategory: string
  leastUsedCategory: string
} {
  const stats = getTagUsageStats(assets, allTags)
  const usedTagIds = new Set(stats.filter(s => s.usageCount > 0).map(s => s.tagId))

  // Group by category
  const categoryMap = new Map<string, {
    categoryId: string
    categoryName: string
    totalTags: number
    usedTags: number
  }>()

  allTags.forEach(tag => {
    const key = tag.category.id
    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        categoryId: tag.category.id,
        categoryName: tag.category.displayName,
        totalTags: 0,
        usedTags: 0
      })
    }
    const cat = categoryMap.get(key)!
    cat.totalTags++
    if (usedTagIds.has(tag.id)) {
      cat.usedTags++
    }
  })

  const categoryCoverage = Array.from(categoryMap.values()).map(cat => ({
    ...cat,
    coveragePercent: cat.totalTags > 0 ? (cat.usedTags / cat.totalTags) * 100 : 0
  }))

  const sortedByUsage = [...categoryCoverage].sort((a, b) => b.usedTags - a.usedTags)

  return {
    totalTags: allTags.length,
    usedTags: usedTagIds.size,
    unusedTags: allTags.length - usedTagIds.size,
    categoryCoverage,
    mostUsedCategory: sortedByUsage[0]?.categoryName || 'None',
    leastUsedCategory: sortedByUsage[sortedByUsage.length - 1]?.categoryName || 'None'
  }
}
