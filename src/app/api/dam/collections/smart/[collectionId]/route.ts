/**
 * Smart Collection Details API Route
 *
 * Retrieves assets for a specific smart collection.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  querySocialVariantCollection,
  getCollectionCount
} from '@/lib/collections/query-engine'
import { getSmartCollection } from '@/lib/collections/social-variant-collections'

/**
 * GET /api/dam/collections/smart/[collectionId]
 * Get assets for a specific smart collection
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  try {
    const collectionId = params.collectionId

    // Get collection definition
    const collection = getSmartCollection(collectionId)
    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Get assets
    const assets = await querySocialVariantCollection(collectionId)

    // Get count
    const count = await getCollectionCount(collectionId)

    return NextResponse.json({
      collection: {
        ...collection,
        count
      },
      assets
    })

  } catch (error) {
    console.error('Smart collection query error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query collection' },
      { status: 500 }
    )
  }
}
