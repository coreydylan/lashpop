import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { requireAdminApi } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'
import {
  DEFAULT_HERO_COPY,
  HERO_COPY_SECTION,
  mergeHeroCopy,
  type HeroCopyContent,
} from '@/types/hero-copy'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  const db = getDb()
  const rows = await db
    .select()
    .from(websiteSettings)
    .where(eq(websiteSettings.section, HERO_COPY_SECTION))
    .limit(1)

  const content = mergeHeroCopy(rows[0]?.config as Partial<HeroCopyContent> | null)
  return NextResponse.json({ content })
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  let body: Partial<HeroCopyContent>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const db = getDb()
  const prevRows = await db
    .select()
    .from(websiteSettings)
    .where(eq(websiteSettings.section, HERO_COPY_SECTION))
    .limit(1)
  const prev = prevRows[0]?.config as Partial<HeroCopyContent> | null

  // Merge the incoming partial over the CURRENT persisted row (normalized over
  // defaults), not over defaults alone. This makes the PUT genuinely partial-safe:
  // a stale client that only sends e.g. {heading} can't blank a concurrently-saved
  // field, since unspecified fields fall back to the live row.
  const base = mergeHeroCopy(prev)
  const merged: HeroCopyContent = {
    ...base,
    ...body,
  }
  merged.updatedAt = new Date().toISOString()

  await db
    .insert(websiteSettings)
    .values({
      section: HERO_COPY_SECTION,
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
    action: 'hero-copy.update',
    targetType: 'website_settings',
    targetId: HERO_COPY_SECTION,
    diff: { before: prev ?? DEFAULT_HERO_COPY, after: merged },
  })

  // Hero copy renders on the homepage.
  revalidatePath('/', 'page')

  return NextResponse.json({ content: merged })
}
