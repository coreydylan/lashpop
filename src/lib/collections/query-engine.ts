/**
 * Collection Query Engine
 *
 * Evaluates smart collection rules and queries the database for matching social variants.
 * Supports complex queries with AND/OR logic, date ranges, and various operators.
 */

import { getDb } from '@/db'
import { socialVariants } from '@/db/schema/social_variants'
import { assets } from '@/db/schema/assets'
import { eq, and, or, gte, lte, gt, lt, sql, desc, asc, SQL } from 'drizzle-orm'
import { getSmartCollection, type CollectionRules, type SmartCollection } from './social-variant-collections'

// Cache for query results (60 seconds TTL)
const queryCache = new Map<string, { data: any[], timestamp: number }>()
const CACHE_TTL = 60 * 1000 // 60 seconds

export interface SocialVariantAsset {
  id: string
  sourceAssetId: string
  fileName: string
  filePath: string
  fileSize: number
  width: number
  height: number
  mimeType: string
  platform: string
  variant: string
  ratio: string
  dimensions: string
  cropStrategy: string | null
  cropData: any
  validationScore: number | null
  validationWarnings: any
  exported: boolean | null
  exportedAt: Date | null
  exportCount: number | null
  metadata: any
  altText: string | null
  caption: string | null
  createdAt: Date
  updatedAt: Date
  sourceAsset?: {
    id: string
    fileName: string
    filePath: string
  }
}

/**
 * Build SQL WHERE conditions from collection rules
 */
function buildWhereConditions(rules: CollectionRules): SQL<unknown> | undefined {
  const conditions: SQL<unknown>[] = []

  // Handle platform filter
  if (rules.platform) {
    conditions.push(eq(socialVariants.platform, rules.platform))
  }

  // Handle exported filter
  if (rules.exported !== undefined) {
    conditions.push(eq(socialVariants.exported, rules.exported))
  }

  // Handle ratio filter
  if (rules.ratio) {
    conditions.push(eq(socialVariants.ratio, rules.ratio))
  }

  // Handle variant filter
  if (rules.variant) {
    conditions.push(eq(socialVariants.variant, rules.variant))
  }

  // Handle validationScore filters
  if (rules.validationScore) {
    if (rules.validationScore.gte !== undefined) {
      conditions.push(gte(socialVariants.validationScore, rules.validationScore.gte))
    }
    if (rules.validationScore.lte !== undefined) {
      conditions.push(lte(socialVariants.validationScore, rules.validationScore.lte))
    }
    if (rules.validationScore.gt !== undefined) {
      conditions.push(gt(socialVariants.validationScore, rules.validationScore.gt))
    }
    if (rules.validationScore.lt !== undefined) {
      conditions.push(lt(socialVariants.validationScore, rules.validationScore.lt))
    }
  }

  // Handle createdAfter filters
  if (rules.createdAfter) {
    let dateThreshold: Date

    if (rules.createdAfter.days !== undefined) {
      dateThreshold = new Date()
      dateThreshold.setDate(dateThreshold.getDate() - rules.createdAfter.days)
    } else if (rules.createdAfter.date) {
      dateThreshold = rules.createdAfter.date
    } else {
      dateThreshold = new Date()
    }

    conditions.push(gte(socialVariants.createdAt, dateThreshold))
  }

  // Handle createdBefore filters
  if (rules.createdBefore) {
    let dateThreshold: Date

    if (rules.createdBefore.days !== undefined) {
      dateThreshold = new Date()
      dateThreshold.setDate(dateThreshold.getDate() - rules.createdBefore.days)
    } else if (rules.createdBefore.date) {
      dateThreshold = rules.createdBefore.date
    } else {
      dateThreshold = new Date()
    }

    conditions.push(lte(socialVariants.createdAt, dateThreshold))
  }

  // Handle validationWarnings contains filter
  if (rules.validationWarnings?.contains) {
    conditions.push(
      sql`${socialVariants.validationWarnings}::text LIKE ${`%${rules.validationWarnings.contains}%`}`
    )
  }

  // Handle AND logic
  if (rules.and && rules.and.length > 0) {
    const andConditions = rules.and
      .map(r => buildWhereConditions(r))
      .filter((c): c is SQL<unknown> => c !== undefined)

    if (andConditions.length > 0) {
      conditions.push(and(...andConditions)!)
    }
  }

  // Handle OR logic
  if (rules.or && rules.or.length > 0) {
    const orConditions = rules.or
      .map(r => buildWhereConditions(r))
      .filter((c): c is SQL<unknown> => c !== undefined)

    if (orConditions.length > 0) {
      conditions.push(or(...orConditions)!)
    }
  }

  if (conditions.length === 0) {
    return undefined
  }

  return conditions.length === 1 ? conditions[0] : and(...conditions)
}

/**
 * Query social variants based on collection rules
 */
export async function querySocialVariantCollection(
  collectionId: string
): Promise<SocialVariantAsset[]> {
  // Get collection definition
  const collection = getSmartCollection(collectionId)
  if (!collection) {
    throw new Error(`Collection not found: ${collectionId}`)
  }

  return await evaluateCollectionRules(collection.rules, collection)
}

/**
 * Evaluate collection rules and return matching variants
 */
export async function evaluateCollectionRules(
  rules: CollectionRules,
  collection?: SmartCollection
): Promise<SocialVariantAsset[]> {
  // Check cache
  const cacheKey = JSON.stringify({ rules, sortBy: collection?.sortBy, sortDirection: collection?.sortDirection })
  const cached = queryCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  // Build query
  const db = getDb()
  const whereConditions = buildWhereConditions(rules)

  // Determine sort order
  let orderBy
  if (collection?.sortBy) {
    const direction = collection.sortDirection === 'asc' ? asc : desc

    switch (collection.sortBy) {
      case 'createdAt':
        orderBy = direction(socialVariants.createdAt)
        break
      case 'uploadedAt':
        orderBy = direction(socialVariants.createdAt) // Using createdAt as uploadedAt equivalent
        break
      case 'exportedAt':
        orderBy = direction(socialVariants.exportedAt)
        break
      case 'validationScore':
        orderBy = direction(socialVariants.validationScore)
        break
      case 'fileName':
        orderBy = direction(socialVariants.fileName)
        break
      default:
        orderBy = desc(socialVariants.createdAt)
    }
  } else {
    orderBy = desc(socialVariants.createdAt)
  }

  // Execute query
  let query = db
    .select({
      variant: socialVariants,
      sourceAsset: {
        id: assets.id,
        fileName: assets.fileName,
        filePath: assets.filePath
      }
    })
    .from(socialVariants)
    .leftJoin(assets, eq(socialVariants.sourceAssetId, assets.id))

  if (whereConditions) {
    query = query.where(whereConditions) as any
  }

  const results = await query.orderBy(orderBy)

  // Transform results
  const variants: SocialVariantAsset[] = results.map(row => ({
    ...row.variant,
    sourceAsset: row.sourceAsset
  }))

  // Cache results
  queryCache.set(cacheKey, {
    data: variants,
    timestamp: Date.now()
  })

  return variants
}

/**
 * Evaluate collection rules and return only matching asset IDs
 */
export async function evaluateCollectionRulesForIds(
  rules: CollectionRules
): Promise<string[]> {
  const db = getDb()
  const whereConditions = buildWhereConditions(rules)

  let query = db
    .select({ id: socialVariants.id })
    .from(socialVariants)

  if (whereConditions) {
    query = query.where(whereConditions) as any
  }

  const results = await query
  return results.map(r => r.id)
}

/**
 * Get count of items in a collection
 */
export async function getCollectionCount(collectionId: string): Promise<number> {
  const collection = getSmartCollection(collectionId)
  if (!collection) {
    return 0
  }

  const db = getDb()
  const whereConditions = buildWhereConditions(collection.rules)

  let query = db
    .select({ count: sql<number>`count(*)::int` })
    .from(socialVariants)

  if (whereConditions) {
    query = query.where(whereConditions) as any
  }

  const result = await query
  return result[0]?.count || 0
}

/**
 * Get counts for all collections (for sidebar display)
 */
export async function getAllCollectionCounts(): Promise<Record<string, number>> {
  const { getSidebarCollections } = await import('./social-variant-collections')
  const collections = getSidebarCollections()

  const counts: Record<string, number> = {}

  // Query all counts in parallel
  await Promise.all(
    collections.map(async (collection) => {
      counts[collection.id] = await getCollectionCount(collection.id)
    })
  )

  return counts
}

/**
 * Clear the query cache (useful after bulk updates)
 */
export function clearQueryCache(): void {
  queryCache.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: queryCache.size,
    entries: Array.from(queryCache.entries()).map(([key, value]) => ({
      key: key.substring(0, 100),
      age: Date.now() - value.timestamp,
      itemCount: value.data.length
    }))
  }
}
