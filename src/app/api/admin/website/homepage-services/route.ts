import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { requireAdminApi } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'
import {
  DEFAULT_HOMEPAGE_SERVICES,
  HOMEPAGE_SERVICES_SECTION,
  mergeHomepageServices,
  type HomepageServicesContent,
} from '@/types/homepage-services'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  const db = getDb()
  const rows = await db
    .select()
    .from(websiteSettings)
    .where(eq(websiteSettings.section, HOMEPAGE_SERVICES_SECTION))
    .limit(1)

  const content = mergeHomepageServices(rows[0]?.config as Partial<HomepageServicesContent> | null)
  return NextResponse.json({ content })
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  let body: Partial<HomepageServicesContent>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const merged = mergeHomepageServices(body)

  const db = getDb()
  const prevRows = await db
    .select()
    .from(websiteSettings)
    .where(eq(websiteSettings.section, HOMEPAGE_SERVICES_SECTION))
    .limit(1)
  const prev = prevRows[0]?.config as Partial<HomepageServicesContent> | null

  await db
    .insert(websiteSettings)
    .values({
      section: HOMEPAGE_SERVICES_SECTION,
      config: merged as unknown as Record<string, unknown>,
    })
    .onConflictDoUpdate({
      target: websiteSettings.section,
      set: {
        config: merged as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      },
    })

  await recordAdminAction({
    action: 'homepage-services.update',
    targetType: 'website_settings',
    targetId: HOMEPAGE_SERVICES_SECTION,
    diff: { before: prev ?? DEFAULT_HOMEPAGE_SERVICES, after: merged },
  })

  // Services section renders on the homepage.
  revalidatePath('/', 'page')

  return NextResponse.json({ content: merged })
}
