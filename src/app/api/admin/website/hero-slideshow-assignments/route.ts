import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { eq } from 'drizzle-orm'
import type { SlideshowAssignments, SlideshowAssignmentsResponse } from '@/types/hero-slideshow'
import { DEFAULT_ASSIGNMENTS } from '@/types/hero-slideshow'
import { requireAdminApi } from '@/lib/admin/auth'
import { writeWebsiteSetting } from '@/lib/admin/settings-writer'

export const dynamic = 'force-dynamic'

const ASSIGNMENTS_SECTION = 'hero_slideshow_assignments'

// GET - Fetch current slideshow assignments
export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  try {
    const db = getDb()
    let assignments: SlideshowAssignments = { ...DEFAULT_ASSIGNMENTS }
    let version = 0
    let sourceOwner = 'admin'

    try {
      const [setting] = await db
        .select()
        .from(websiteSettings)
        .where(eq(websiteSettings.section, ASSIGNMENTS_SECTION))
        .limit(1)

      if (setting?.config) {
        const config = setting.config as unknown as SlideshowAssignments
        assignments = {
          desktop: config.desktop ?? null,
          mobile: config.mobile ?? null,
          mobileSameAsDesktop: config.mobileSameAsDesktop ?? true
        }
      }
      version = setting?.version ?? 0
      sourceOwner = setting?.sourceOwner ?? 'admin'
    } catch {
      // Table might not exist yet
    }

    return NextResponse.json({
      assignments,
      version,
      sourceOwner,
    } as SlideshowAssignmentsResponse & { version: number; sourceOwner: string })
  } catch (error) {
    console.error('Error fetching slideshow assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

// PUT - Update slideshow assignments
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { assignments, baseVersion } = body as {
      assignments: SlideshowAssignments
      baseVersion: number
    }

    if (!assignments || typeof assignments !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Validate and normalize assignments
    const config: SlideshowAssignments = {
      desktop: assignments.desktop || null,
      mobile: assignments.mobileSameAsDesktop ? assignments.desktop : (assignments.mobile || null),
      mobileSameAsDesktop: Boolean(assignments.mobileSameAsDesktop)
    }

    const result = await writeWebsiteSetting({
      section: ASSIGNMENTS_SECTION,
      config,
      baseVersion,
      action: 'hero.slideshow.assignments.update',
    })

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status })
    }

    return NextResponse.json({
      success: true,
      assignments: config,
      version: result.setting.version,
      sourceOwner: result.setting.sourceOwner,
    })
  } catch (error) {
    console.error('Error updating slideshow assignments:', error)
    return NextResponse.json(
      { error: 'Failed to update assignments' },
      { status: 500 }
    )
  }
}
