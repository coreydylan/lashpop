/**
 * DAM User Settings API
 *
 * GET: Fetch user's DAM settings
 * POST: Update user's DAM settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { damUserSettings, type DamSettingsData } from '@/db/schema/dam_user_settings'
import { eq } from 'drizzle-orm'
import { requireAuth, UnauthorizedError, ForbiddenError } from '@/lib/server/dam-auth'

// Default settings for new users
const DEFAULT_SETTINGS: DamSettingsData = {
  gridViewMode: 'square',
  activeFilters: [],
  groupByCategories: [],
  visibleCardTags: [], // Empty means show all
  activeCollectionId: undefined,
  sortBy: 'uploadDate',
  sortOrder: 'desc'
}

export async function GET(request: NextRequest) {
  try {
    // Require authentication using our unified auth helper
    const user = await requireAuth()

    const db = getDb()

    // Get user settings
    const [userSettings] = await db
      .select()
      .from(damUserSettings)
      .where(eq(damUserSettings.userId, user.id))
      .limit(1)

    // Return settings or default
    const settings = userSettings?.settings as DamSettingsData ?? DEFAULT_SETTINGS

    return NextResponse.json({ settings })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error fetching DAM settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication using our unified auth helper
    const user = await requireAuth()

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Upsert settings (insert or update)
    const [updated] = await db
      .insert(damUserSettings)
      .values({
        id: `dam_settings_${user.id}`,
        userId: user.id,
        settings: settings as DamSettingsData,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: damUserSettings.userId,
        set: {
          settings: settings as DamSettingsData,
          updatedAt: new Date()
        }
      })
      .returning()

    return NextResponse.json({
      success: true,
      settings: updated.settings
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error saving DAM settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
