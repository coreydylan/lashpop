import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import type { SlideshowPreset, SlideshowPresetsResponse } from '@/types/hero-slideshow'
import { DEFAULT_TRANSITION, DEFAULT_TIMING, DEFAULT_NAVIGATION } from '@/types/hero-slideshow'

export const dynamic = 'force-dynamic'

const PRESETS_SECTION = 'hero_slideshow_presets'

// GET - Fetch all slideshow presets
export async function GET() {
  try {
    const db = getDb()
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
      // Table might not exist yet
    }

    return NextResponse.json({ presets } as SlideshowPresetsResponse)
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
    const { preset } = body as { preset: Omit<SlideshowPreset, 'id' | 'createdAt' | 'updatedAt'> }

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

    // Save to database
    const config = { presets } as unknown as Record<string, unknown>

    try {
      const [existing] = await db
        .select()
        .from(websiteSettings)
        .where(eq(websiteSettings.section, PRESETS_SECTION))
        .limit(1)

      if (existing) {
        await db
          .update(websiteSettings)
          .set({ config, updatedAt: new Date() })
          .where(eq(websiteSettings.section, PRESETS_SECTION))
      } else {
        await db
          .insert(websiteSettings)
          .values({ section: PRESETS_SECTION, config })
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save preset' },
        { status: 500 }
      )
    }

    revalidatePath('/')
    return NextResponse.json({ success: true, preset: newPreset })
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
    const { preset } = body as { preset: SlideshowPreset }

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

    // Save to database
    const config = { presets } as unknown as Record<string, unknown>

    await db
      .update(websiteSettings)
      .set({ config, updatedAt: new Date() })
      .where(eq(websiteSettings.section, PRESETS_SECTION))

    revalidatePath('/')
    return NextResponse.json({ success: true, preset: presets[index] })
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

    await db
      .update(websiteSettings)
      .set({ config, updatedAt: new Date() })
      .where(eq(websiteSettings.section, PRESETS_SECTION))

    revalidatePath('/')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting slideshow preset:', error)
    return NextResponse.json(
      { error: 'Failed to delete preset' },
      { status: 500 }
    )
  }
}
