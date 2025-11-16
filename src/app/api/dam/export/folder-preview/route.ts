/**
 * Export Folder Preview API Route
 *
 * Provides a preview of the folder structure that will be created in the export.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getOrganizationPreview } from '@/lib/export/social-variant-export'

export async function POST(request: NextRequest) {
  try {
    const { assetIds, organization = 'flat' } = await request.json()

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        { error: 'No asset IDs provided' },
        { status: 400 }
      )
    }

    const folders = await getOrganizationPreview(assetIds, organization)

    return NextResponse.json({ folders })

  } catch (error) {
    console.error('Folder preview error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Folder preview failed' },
      { status: 500 }
    )
  }
}
