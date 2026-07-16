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
import { requireAdminApi } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'

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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function summarizeSettings(value: unknown) {
  const settings = asRecord(value)
  const filters = Array.isArray(settings?.activeFilters) ? settings.activeFilters : []
  const tutorial = asRecord(settings?.tutorial)

  return {
    gridViewMode: typeof settings?.gridViewMode === 'string' ? settings.gridViewMode : null,
    activeFilters: filters.map((value) => {
      const filter = asRecord(value)
      return {
        categoryId: typeof filter?.categoryId === 'string' ? filter.categoryId : null,
        optionId: typeof filter?.optionId === 'string' ? filter.optionId : null,
      }
    }),
    groupByCategories: stringArray(settings?.groupByCategories),
    visibleCardTags: stringArray(settings?.visibleCardTags),
    activeCollectionId: typeof settings?.activeCollectionId === 'string'
      ? settings.activeCollectionId
      : null,
    sortBy: typeof settings?.sortBy === 'string' ? settings.sortBy : null,
    sortOrder: typeof settings?.sortOrder === 'string' ? settings.sortOrder : null,
    tutorial: tutorial ? {
      completed: tutorial.completed === true,
      dismissed: tutorial.dismissed === true,
      currentStep: typeof tutorial.currentStep === 'number' ? tutorial.currentStep : null,
      completedStepCount: stringArray(tutorial.completedSteps).length,
    } : null,
  }
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
  const auth = await requireAdminApi(['owner', 'publisher'])
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      )
    }

    const db = getDb()
    const [before] = await db
      .select({ settings: damUserSettings.settings })
      .from(damUserSettings)
      .where(eq(damUserSettings.userId, auth.userId))
      .limit(1)

    // Upsert settings (insert or update)
    const [updated] = await db
      .insert(damUserSettings)
      .values({
        id: `dam_settings_${auth.userId}`,
        userId: auth.userId,
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

    await recordAdminAction({
      action: 'dam.preferences.update',
      surface: 'dam',
      targetType: 'dam_user_settings',
      targetId: auth.userId,
      actorUserId: auth.userId,
      diff: {
        before: before ? summarizeSettings(before.settings) : null,
        after: summarizeSettings(updated.settings),
      },
    })

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
