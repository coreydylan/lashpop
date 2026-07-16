import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { requireAdminApi } from '@/lib/admin/auth'
import { writeWebsiteSetting } from '@/lib/admin/settings-writer'
import {
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
  return NextResponse.json({
    content,
    version: rows[0]?.version ?? 0,
    sourceOwner: rows[0]?.sourceOwner ?? 'admin',
  })
}

export async function PUT(req: NextRequest) {
  let body: { content?: Partial<FounderLetterContent>; baseVersion?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.content || typeof body.content !== 'object' || Array.isArray(body.content)) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }
  if (typeof body.baseVersion !== 'number') {
    return NextResponse.json({ error: 'baseVersion is required' }, { status: 400 })
  }

  const merged = mergeFounderLetter(body.content)
  merged.updatedAt = new Date().toISOString()

  const result = await writeWebsiteSetting({
    section: FOUNDER_LETTER_SECTION,
    config: merged,
    baseVersion: body.baseVersion,
    action: 'founder-letter.update',
  })
  if (!result.ok) return NextResponse.json(result, { status: result.status })

  return NextResponse.json({
    content: result.setting.config as unknown as FounderLetterContent,
    version: result.setting.version,
    sourceOwner: result.setting.sourceOwner,
  })
}
