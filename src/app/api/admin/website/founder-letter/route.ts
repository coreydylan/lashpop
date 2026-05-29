import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { requireAdminApi } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'
import {
  DEFAULT_FOUNDER_LETTER,
  FOUNDER_LETTER_SECTION,
  mergeFounderLetter,
  type FounderLetterContent,
} from '@/types/founder-letter'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  const db = getDb()
  const rows = await db
    .select()
    .from(websiteSettings)
    .where(eq(websiteSettings.section, FOUNDER_LETTER_SECTION))
    .limit(1)

  const content = mergeFounderLetter(rows[0]?.config as Partial<FounderLetterContent> | null)
  return NextResponse.json({ content })
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  let body: Partial<FounderLetterContent>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const db = getDb()
  const prevRows = await db
    .select()
    .from(websiteSettings)
    .where(eq(websiteSettings.section, FOUNDER_LETTER_SECTION))
    .limit(1)
  const prev = prevRows[0]?.config as Partial<FounderLetterContent> | null

  // Merge the incoming partial over the CURRENT persisted row (normalized over
  // defaults), not over defaults alone. This makes the PUT genuinely partial-safe:
  // a stale client that only sends e.g. {heading} can't blank a concurrently-saved
  // paragraph, since unspecified fields fall back to the live row.
  const base = mergeFounderLetter(prev)
  const merged: FounderLetterContent = {
    ...base,
    ...body,
    paragraphs:
      Array.isArray(body.paragraphs) && body.paragraphs.length > 0
        ? body.paragraphs
        : base.paragraphs,
  }
  merged.updatedAt = new Date().toISOString()

  await db
    .insert(websiteSettings)
    .values({
      section: FOUNDER_LETTER_SECTION,
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
    action: 'founder-letter.update',
    targetType: 'website_settings',
    targetId: FOUNDER_LETTER_SECTION,
    diff: { before: prev ?? DEFAULT_FOUNDER_LETTER, after: merged },
  })

  // Founder letter renders on the homepage.
  revalidatePath('/', 'page')

  return NextResponse.json({ content: merged })
}
