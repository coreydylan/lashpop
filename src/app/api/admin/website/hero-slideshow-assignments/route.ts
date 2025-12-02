import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import type { SlideshowAssignments, SlideshowAssignmentsResponse } from '@/types/hero-slideshow'
import { DEFAULT_ASSIGNMENTS } from '@/types/hero-slideshow'

export const dynamic = 'force-dynamic'

const ASSIGNMENTS_SECTION = 'hero_slideshow_assignments'

// GET - Fetch current slideshow assignments
export async function GET() {
  try {
    const db = getDb()
    let assignments: SlideshowAssignments = { ...DEFAULT_ASSIGNMENTS }

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
    } catch {
      // Table might not exist yet
    }

    return NextResponse.json({ assignments } as SlideshowAssignmentsResponse)
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
    const db = getDb()
    const body = await request.json()
    const { assignments } = body as { assignments: SlideshowAssignments }

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

    // Save to database
    try {
      const [existing] = await db
        .select()
        .from(websiteSettings)
        .where(eq(websiteSettings.section, ASSIGNMENTS_SECTION))
        .limit(1)

      if (existing) {
        await db
          .update(websiteSettings)
          .set({ config: config as unknown as Record<string, unknown>, updatedAt: new Date() })
          .where(eq(websiteSettings.section, ASSIGNMENTS_SECTION))
      } else {
        await db
          .insert(websiteSettings)
          .values({ section: ASSIGNMENTS_SECTION, config: config as unknown as Record<string, unknown> })
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save assignments' },
        { status: 500 }
      )
    }

    revalidatePath('/')
    return NextResponse.json({ success: true, assignments: config })
  } catch (error) {
    console.error('Error updating slideshow assignments:', error)
    return NextResponse.json(
      { error: 'Failed to update assignments' },
      { status: 500 }
    )
  }
}
