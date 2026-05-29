import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { requireAdminApi } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'
import { isStaleWrite, staleConflictResponse } from '@/lib/admin/concurrency'
import {
  DEFAULT_SITE_SECTIONS,
  SITE_SECTIONS_SECTION,
  mergeSiteSections,
  type SiteSectionsContent,
} from '@/types/site-sections'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  const db = getDb()
  const rows = await db
    .select()
    .from(websiteSettings)
    .where(eq(websiteSettings.section, SITE_SECTIONS_SECTION))
    .limit(1)

  const content = mergeSiteSections(rows[0]?.config as Partial<SiteSectionsContent> | null)
  return NextResponse.json({ content })
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  let body: Partial<SiteSectionsContent>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const db = getDb()
  const prevRows = await db
    .select()
    .from(websiteSettings)
    .where(eq(websiteSettings.section, SITE_SECTIONS_SECTION))
    .limit(1)
  const prev = prevRows[0]?.config as Partial<SiteSectionsContent> | null

  const { baseUpdatedAt, ...rest } = body as Partial<SiteSectionsContent> & {
    baseUpdatedAt?: unknown
  }
  if (isStaleWrite((prev as { updatedAt?: string } | null)?.updatedAt, baseUpdatedAt)) {
    return staleConflictResponse(mergeSiteSections(prev))
  }

  // Merge the incoming partial over the CURRENT persisted row (normalized over
  // defaults), not over defaults alone. This makes the PUT genuinely partial-safe:
  // a stale client that only sends a subset can't blank a concurrently-saved
  // sections list, since unspecified fields fall back to the live row.
  const base = mergeSiteSections(prev)
  const merged: SiteSectionsContent = {
    ...base,
    ...rest,
    sections:
      Array.isArray(rest.sections) && rest.sections.length > 0
        ? rest.sections
        : base.sections,
  }
  merged.updatedAt = new Date().toISOString()

  await db
    .insert(websiteSettings)
    .values({
      section: SITE_SECTIONS_SECTION,
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
    action: 'site-sections.update',
    targetType: 'website_settings',
    targetId: SITE_SECTIONS_SECTION,
    diff: { before: prev ?? DEFAULT_SITE_SECTIONS, after: merged },
  })

  // The nav renders site-wide (mounted on the homepage shell) from these.
  revalidatePath('/', 'page')

  return NextResponse.json({ content: merged })
}
