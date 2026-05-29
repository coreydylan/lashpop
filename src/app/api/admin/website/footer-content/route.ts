import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { requireAdminApi } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'
import { isStaleWrite, staleConflictResponse } from '@/lib/admin/concurrency'
import {
  DEFAULT_FOOTER_CONTENT,
  FOOTER_CONTENT_SECTION,
  mergeFooterContent,
  type FooterContent,
} from '@/types/footer-content'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  const db = getDb()
  const rows = await db
    .select()
    .from(websiteSettings)
    .where(eq(websiteSettings.section, FOOTER_CONTENT_SECTION))
    .limit(1)

  const content = mergeFooterContent(rows[0]?.config as Partial<FooterContent> | null)
  return NextResponse.json({ content })
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  let body: Partial<FooterContent>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const db = getDb()
  const prevRows = await db
    .select()
    .from(websiteSettings)
    .where(eq(websiteSettings.section, FOOTER_CONTENT_SECTION))
    .limit(1)
  const prev = prevRows[0]?.config as Partial<FooterContent> | null

  const { baseUpdatedAt, ...rest } = body as Partial<FooterContent> & {
    baseUpdatedAt?: unknown
  }
  if (isStaleWrite((prev as { updatedAt?: string } | null)?.updatedAt, baseUpdatedAt)) {
    return staleConflictResponse(mergeFooterContent(prev))
  }

  // Merge the incoming partial over the CURRENT persisted row (normalized over
  // defaults), not over defaults alone. This makes the PUT genuinely partial-safe:
  // a stale client that only sends e.g. {servicesHeading} can't blank a
  // concurrently-saved services array, since unspecified fields fall back to
  // the live row.
  const base = mergeFooterContent(prev)
  const merged: FooterContent = {
    ...base,
    ...rest,
    services:
      Array.isArray(rest.services) && rest.services.length > 0
        ? rest.services
        : base.services,
    policyLinks:
      Array.isArray(rest.policyLinks) && rest.policyLinks.length > 0
        ? rest.policyLinks
        : base.policyLinks,
  }
  merged.updatedAt = new Date().toISOString()

  await db
    .insert(websiteSettings)
    .values({
      section: FOOTER_CONTENT_SECTION,
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
    action: 'footer-content.update',
    targetType: 'website_settings',
    targetId: FOOTER_CONTENT_SECTION,
    diff: { before: prev ?? DEFAULT_FOOTER_CONTENT, after: merged },
  })

  // Footer renders on every page.
  revalidatePath('/', 'page')

  return NextResponse.json({ content: merged })
}
