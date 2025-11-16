/**
 * Export Size Estimation API Route
 *
 * Estimates the total size of an export before creating the ZIP file.
 */

import { NextRequest, NextResponse } from 'next/server'
import { estimateExportSize } from '@/lib/export/social-variant-export'

export async function POST(request: NextRequest) {
  try {
    const { assetIds } = await request.json()

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        { error: 'No asset IDs provided' },
        { status: 400 }
      )
    }

    const size = await estimateExportSize(assetIds)

    return NextResponse.json({ size })

  } catch (error) {
    console.error('Size estimation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Size estimation failed' },
      { status: 500 }
    )
  }
}
