/**
 * Export History API Route
 *
 * Retrieves export history for viewing past exports.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { exportHistory } from '@/db/schema/export_history'
import { desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const history = await db
      .select()
      .from(exportHistory)
      .orderBy(desc(exportHistory.createdAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({ history })

  } catch (error) {
    console.error('Export history error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch export history' },
      { status: 500 }
    )
  }
}
