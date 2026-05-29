import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { requireAdminApi } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'
import {
  DEFAULT_NAVIGATION,
  NAVIGATION_SECTION,
  mergeNavigation,
  type NavigationContent,
} from '@/types/navigation'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  const db = getDb()
  const rows = await db
    .select()
    .from(websiteSettings)
    .where(eq(websiteSettings.section, NAVIGATION_SECTION))
    .limit(1)

  const content = mergeNavigation(rows[0]?.config as Partial<NavigationContent> | null)
  return NextResponse.json({ content })
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  let body: Partial<NavigationContent>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const db = getDb()
  const prevRows = await db
    .select()
    .from(websiteSettings)
    .where(eq(websiteSettings.section, NAVIGATION_SECTION))
    .limit(1)
  const prev = prevRows[0]?.config as Partial<NavigationContent> | null

  // Merge the incoming partial over the CURRENT persisted row (normalized over
  // defaults), not over defaults alone. This makes the PUT genuinely partial-safe:
  // a stale client that only sends e.g. {logoAlt} can't blank a concurrently-saved
  // navItems list, since unspecified fields fall back to the live row.
  const base = mergeNavigation(prev)
  const merged: NavigationContent = {
    ...base,
    ...body,
    navItems:
      Array.isArray(body.navItems) && body.navItems.length > 0
        ? body.navItems
        : base.navItems,
  }
  merged.updatedAt = new Date().toISOString()

  await db
    .insert(websiteSettings)
    .values({
      section: NAVIGATION_SECTION,
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
    action: 'navigation.update',
    targetType: 'website_settings',
    targetId: NAVIGATION_SECTION,
    diff: { before: prev ?? DEFAULT_NAVIGATION, after: merged },
  })

  // Navigation renders site-wide (mounted on the homepage shell).
  revalidatePath('/', 'page')

  return NextResponse.json({ content: merged })
}
