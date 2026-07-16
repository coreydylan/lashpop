import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import type { SlideshowPreset, SlideshowPresetsResponse } from '@/types/hero-slideshow'
import { DEFAULT_TRANSITION, DEFAULT_TIMING, DEFAULT_NAVIGATION } from '@/types/hero-slideshow'
import { requireAdminApi } from '@/lib/admin/auth'
import { writeWebsiteSetting } from '@/lib/admin/settings-writer'

export const dynamic = 'force-dynamic'

const PRESETS_SECTION = 'hero_slideshow_presets'

// GET - Fetch all slideshow presets
export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof NextResponse) return auth

  try {
    const db = getDb()
    let presets: SlideshowPreset[] = []
    let version = 0
    let sourceOwner = 'admin'

    try {
      const [setting] = await db
        .select()
        .from(websiteSettings)
        .where(eq(websiteSettings.section, PRESETS_SECTION))
        .limit(1)

      if (setting?.config) {
        const config = setting.config as unknown as { presets: SlideshowPreset[] }
        presets = config.presets || []
      }
      version = setting?.version ?? 0
      sourceOwner = setting?.sourceOwner ?? 'admin'
    } catch {
      // Table might not exist yet
    }

    return NextResponse.json({
      presets,
      version,
      sourceOwner,
    } as SlideshowPresetsResponse & { version: number; sourceOwner: string })
  } catch (error) {
    console.error('Error fetching slideshow presets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch presets' },
      { status: 500 }
    )
  }
}

// POST - Create a new slideshow preset
export async function POST(request: NextRequest) {
  try {
    const db = getDb()
    const body = await request.json()
    const { preset, baseVersion } = body as {
      preset: Omit<SlideshowPreset, 'id' | 'createdAt' | 'updatedAt'>
      baseVersion: number
    }

    if (!preset || !preset.name) {
      return NextResponse.json(
        { error: 'Invalid request: preset name required' },
        { status: 400 }
      )
    }

    // Create the new preset with defaults
    const newPreset: SlideshowPreset = {
      id: randomUUID(),
      name: preset.name,
      description: preset.description,
      images: preset.images || [],
      transition: preset.transition || { ...DEFAULT_TRANSITION },
      timing: preset.timing || { ...DEFAULT_TIMING },
      navigation: preset.navigation || { ...DEFAULT_NAVIGATION },
      globalKenBurns: preset.globalKenBurns,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Fetch existing presets
    let presets: SlideshowPreset[] = []
    try {
      const [setting] = await db
        .select()
        .from(websiteSettings)
        .where(eq(websiteSettings.section, PRESETS_SECTION))
        .limit(1)

      if (setting?.config) {
        const config = setting.config as unknown as { presets: SlideshowPreset[] }
        presets = config.presets || []
      }
    } catch {
      // Table might not exist
    }

    // Add new preset
    presets.push(newPreset)

    const config = { presets } as unknown as Record<string, unknown>
    const result = await writeWebsiteSetting({
      section: PRESETS_SECTION,
      config,
      baseVersion,
      action: 'hero.slideshow.preset.create',
      auditContext: { presetId: newPreset.id, presetName: newPreset.name },
    })

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status })
    }

    return NextResponse.json({
      success: true,
      preset: newPreset,
      version: result.setting.version,
      sourceOwner: result.setting.sourceOwner,
    })
  } catch (error) {
    console.error('Error creating slideshow preset:', error)
    return NextResponse.json(
      { error: 'Failed to create preset' },
      { status: 500 }
    )
  }
}

// PUT - Update an existing preset
export async function PUT(request: NextRequest) {
  try {
    const db = getDb()
    const body = await request.json()
    const { preset, baseVersion } = body as {
      preset: SlideshowPreset
      baseVersion: number
    }

    if (!preset || !preset.id) {
      return NextResponse.json(
        { error: 'Invalid request: preset id required' },
        { status: 400 }
      )
    }

    // Fetch existing presets
    let presets: SlideshowPreset[] = []
    try {
      const [setting] = await db
        .select()
        .from(websiteSettings)
        .where(eq(websiteSettings.section, PRESETS_SECTION))
        .limit(1)

      if (setting?.config) {
        const config = setting.config as unknown as { presets: SlideshowPreset[] }
        presets = config.presets || []
      }
    } catch {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      )
    }

    // Find and update the preset
    const index = presets.findIndex(p => p.id === preset.id)
    if (index === -1) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      )
    }

    // Update with new data
    presets[index] = {
      ...presets[index],
      ...preset,
      updatedAt: new Date().toISOString()
    }

    const config = { presets } as unknown as Record<string, unknown>
    const result = await writeWebsiteSetting({
      section: PRESETS_SECTION,
      config,
      baseVersion,
      action: 'hero.slideshow.preset.update',
      auditContext: { presetId: preset.id, presetName: presets[index].name },
    })

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status })
    }

    return NextResponse.json({
      success: true,
      preset: presets[index],
      version: result.setting.version,
      sourceOwner: result.setting.sourceOwner,
    })
  } catch (error) {
    console.error('Error updating slideshow preset:', error)
    return NextResponse.json(
      { error: 'Failed to update preset' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a preset
export async function DELETE(request: NextRequest) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const presetId = searchParams.get('id')
    const body = await request.json().catch(() => null) as { baseVersion?: number } | null

    if (!presetId) {
      return NextResponse.json(
        { error: 'Preset ID required' },
        { status: 400 }
      )
    }

    // Fetch existing presets
    let presets: SlideshowPreset[] = []
    try {
      const [setting] = await db
        .select()
        .from(websiteSettings)
        .where(eq(websiteSettings.section, PRESETS_SECTION))
        .limit(1)

      if (setting?.config) {
        const config = setting.config as unknown as { presets: SlideshowPreset[] }
        presets = config.presets || []
      }
    } catch {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      )
    }

    // Remove the preset
    const newPresets = presets.filter(p => p.id !== presetId)
    if (newPresets.length === presets.length) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      )
    }

    // Save to database
    const config = { presets: newPresets } as unknown as Record<string, unknown>
    const result = await writeWebsiteSetting({
      section: PRESETS_SECTION,
      config,
      baseVersion: body?.baseVersion as number,
      action: 'hero.slideshow.preset.delete',
      auditContext: { presetId },
    })

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status })
    }

    return NextResponse.json({
      success: true,
      version: result.setting.version,
      sourceOwner: result.setting.sourceOwner,
    })
  } catch (error) {
    console.error('Error deleting slideshow preset:', error)
    return NextResponse.json(
      { error: 'Failed to delete preset' },
      { status: 500 }
    )
  }
}
