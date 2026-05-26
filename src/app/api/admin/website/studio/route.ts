import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { requireAdminApi } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'
import {
  DEFAULT_STUDIO_SETTINGS,
  STUDIO_SETTINGS_SECTION,
  mergeStudioSettings,
  type StudioSettings,
} from '@/types/studio'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  const db = getDb()
  const rows = await db
    .select()
    .from(websiteSettings)
    .where(eq(websiteSettings.section, STUDIO_SETTINGS_SECTION))
    .limit(1)

  const row = rows[0]
  const settings = mergeStudioSettings(row?.config as Partial<StudioSettings> | null)
  return NextResponse.json({ settings })
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  let body: Partial<StudioSettings>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const merged = mergeStudioSettings(body)
  merged.updatedAt = new Date().toISOString()

  const db = getDb()

  // Read previous state for the audit diff before we overwrite.
  const prevRows = await db
    .select()
    .from(websiteSettings)
    .where(eq(websiteSettings.section, STUDIO_SETTINGS_SECTION))
    .limit(1)
  const prev = prevRows[0]?.config as Partial<StudioSettings> | null

  // Upsert into website_settings.
  await db
    .insert(websiteSettings)
    .values({
      section: STUDIO_SETTINGS_SECTION,
      config: merged as unknown as Record<string, unknown>,
    })
    .onConflictDoUpdate({
      target: websiteSettings.section,
      set: {
        config: merged as unknown as Record<string, unknown>,
        updatedAt: sql`now()`,
      },
    })

  await recordAdminAction({
    action: 'studio.update',
    targetType: 'website_settings',
    targetId: STUDIO_SETTINGS_SECTION,
    diff: { before: prev ?? DEFAULT_STUDIO_SETTINGS, after: merged },
  })

  // Revalidate every page that reads studio info — currently the
  // homepage and each public route. Cheap with `dynamic = 'force-dynamic'`
  // but explicit so future ISR cutover keeps working.
  revalidatePath('/', 'layout')

  return NextResponse.json({ settings: merged })
}
