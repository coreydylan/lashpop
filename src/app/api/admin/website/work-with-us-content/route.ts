import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { requireAdminApi } from '@/lib/admin/auth'
import { writeWebsiteSetting } from '@/lib/admin/settings-writer'
import {
  WORK_WITH_US_CONTENT_SECTION,
  mergeWorkWithUsContent,
  type WorkWithUsContent,
} from '@/types/work-with-us-content'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  const [row] = await getDb()
    .select({ config: websiteSettings.config, version: websiteSettings.version, sourceOwner: websiteSettings.sourceOwner })
    .from(websiteSettings)
    .where(eq(websiteSettings.section, WORK_WITH_US_CONTENT_SECTION))
    .limit(1)

  return NextResponse.json({
    content: mergeWorkWithUsContent(row?.config as Partial<WorkWithUsContent> | null),
    version: row?.version ?? 0,
    sourceOwner: row?.sourceOwner ?? 'system',
  })
}

export async function PUT(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'A valid JSON body is required' }, { status: 400 })
  }
  if (!body || typeof body !== 'object' || !('content' in body) || !('baseVersion' in body)) {
    return NextResponse.json({ error: 'content and baseVersion are required' }, { status: 400 })
  }

  const payload = body as { content: Partial<WorkWithUsContent>; baseVersion: number }
  const result = await writeWebsiteSetting({
    section: WORK_WITH_US_CONTENT_SECTION,
    config: mergeWorkWithUsContent(payload.content),
    baseVersion: payload.baseVersion,
    action: 'careers.content.update',
  })
  if (!result.ok) return NextResponse.json(result, { status: result.status })
  return NextResponse.json({ content: mergeWorkWithUsContent(result.setting.config), ...result.setting })
}
