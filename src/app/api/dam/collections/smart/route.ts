/**
 * Smart Collections API Route
 *
 * Retrieves smart collections with counts and asset lists.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  querySocialVariantCollection,
  getAllCollectionCounts,
  getCollectionCount
} from '@/lib/collections/query-engine'
import {
  SOCIAL_VARIANT_COLLECTIONS,
  getSidebarCollections
} from '@/lib/collections/social-variant-collections'

/**
 * GET /api/dam/collections/smart
 * Get all smart collections with their definitions
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeCounts = searchParams.get('includeCounts') === 'true'
    const sidebarOnly = searchParams.get('sidebarOnly') === 'true'

    const collections = sidebarOnly ? getSidebarCollections() : SOCIAL_VARIANT_COLLECTIONS

    let counts: Record<string, number> = {}

    if (includeCounts) {
      counts = await getAllCollectionCounts()
    }

    const collectionsWithCounts = collections.map(collection => ({
      ...collection,
      count: counts[collection.id] || 0
    }))

    return NextResponse.json({ collections: collectionsWithCounts })

  } catch (error) {
    console.error('Smart collections error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch smart collections' },
      { status: 500 }
    )
  }
}
