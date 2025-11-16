/**
 * Export API Route
 *
 * Handles exporting social media variants as ZIP files.
 * Supports various format conversions and organization strategies.
 */

import { NextRequest, NextResponse } from 'next/server'
import { exportSocialVariants, type ExportOptions } from '@/lib/export/social-variant-export'
import { getDb } from '@/db'
import { exportHistory } from '@/db/schema/export_history'
import { socialVariants } from '@/db/schema/social_variants'
import { eq, inArray } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      assetIds,
      format = 'original',
      quality = 90,
      organization = 'flat',
      includeMetadata = false,
      includeSourceImages = false,
      markAsExported = true
    }: ExportOptions & { markAsExported?: boolean } = body

    // Validate inputs
    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        { error: 'No asset IDs provided' },
        { status: 400 }
      )
    }

    // Export the variants
    const result = await exportSocialVariants({
      assetIds,
      format,
      quality,
      organize: organization,
      includeMetadata,
      includeSourceImages
    })

    // Mark variants as exported if requested
    if (markAsExported) {
      const db = getDb()
      await db
        .update(socialVariants)
        .set({
          exported: true,
          exportedAt: new Date(),
          exportCount: sql`COALESCE(export_count, 0) + 1`
        })
        .where(inArray(socialVariants.id, assetIds))
    }

    // Save export history
    const db = getDb()
    await db.insert(exportHistory).values({
      assetIds: assetIds as any,
      exportedBy: 'system', // TODO: Get actual user ID from auth
      format: format,
      quality: quality,
      organization: organization,
      includeMetadata: includeMetadata as any,
      includeSourceImages: includeSourceImages as any,
      fileCount: result.fileCount,
      totalSize: result.totalSize,
      manifest: result.manifest as any
    })

    // Return ZIP file
    return new NextResponse(result.zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="social-variants-${Date.now()}.zip"`,
        'Content-Length': result.totalSize.toString()
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}

// Helper to fix SQL import issue
import { sql } from 'drizzle-orm'
