/**
 * DAM User Settings API
 *
 * GET: Fetch user's DAM settings
 * POST: Update user's DAM settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/db'
import { damUserSettings, type DamSettingsData } from '@/db/schema/dam_user_settings'
import { user as userSchema } from '@/db/schema/auth_user'
import { session as sessionSchema } from '@/db/schema/auth_session'
import { eq, and, gt } from 'drizzle-orm'

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
    // Get auth token from cookie
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = getDb()

    // Validate session and check DAM access
    const result = await db
      .select({
        userId: userSchema.id,
        damAccess: userSchema.damAccess
      })
      .from(sessionSchema)
      .innerJoin(userSchema, eq(sessionSchema.userId, userSchema.id))
      .where(
        and(
          eq(sessionSchema.token, authToken.value),
          gt(sessionSchema.expiresAt, new Date())
        )
      )
      .limit(1)

    const session = result[0]

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check DAM access
    if (!session.damAccess) {
      return NextResponse.json(
        { error: 'Access denied - DAM access required' },
        { status: 403 }
      )
    }

    // Get user settings
    const [userSettings] = await db
      .select()
      .from(damUserSettings)
      .where(eq(damUserSettings.userId, session.userId))
      .limit(1)

    // Return settings or default
    const settings = userSettings?.settings as DamSettingsData ?? DEFAULT_SETTINGS

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching DAM settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookie
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = getDb()

    // Validate session and check DAM access
    const result = await db
      .select({
        userId: userSchema.id,
        damAccess: userSchema.damAccess
      })
      .from(sessionSchema)
      .innerJoin(userSchema, eq(sessionSchema.userId, userSchema.id))
      .where(
        and(
          eq(sessionSchema.token, authToken.value),
          gt(sessionSchema.expiresAt, new Date())
        )
      )
      .limit(1)

    const session = result[0]

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check DAM access
    if (!session.damAccess) {
      return NextResponse.json(
        { error: 'Access denied - DAM access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      )
    }

    // Upsert settings (insert or update)
    const [updated] = await db
      .insert(damUserSettings)
      .values({
        id: `dam_settings_${session.userId}`,
        userId: session.userId,
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
    console.error('Error saving DAM settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
