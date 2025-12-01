import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { websiteSettings } from '@/db/schema/website_settings'
import { eq } from 'drizzle-orm'
import {
  HeroArchwayConfig,
  defaultHeroArchwayConfig
} from '@/types/hero-archway'

export const dynamic = 'force-dynamic'

const SECTION_KEY = 'hero-archway'

// GET - Fetch hero archway configuration
export async function GET() {
  try {
    const result = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, SECTION_KEY))
      .limit(1)

    if (result.length === 0) {
      // Return default configuration if none exists
      return NextResponse.json({
        config: defaultHeroArchwayConfig,
        isDefault: true
      })
    }

    return NextResponse.json({
      config: result[0].config as HeroArchwayConfig,
      isDefault: false,
      updatedAt: result[0].updatedAt
    })
  } catch (error) {
    console.error('[Hero Archway API] Error fetching config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hero archway configuration', details: String(error) },
      { status: 500 }
    )
  }
}

// PUT - Update hero archway configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[Hero Archway API] PUT request received')

    const config = body.config as HeroArchwayConfig

    if (!config) {
      console.error('[Hero Archway API] Invalid body - config is missing')
      return NextResponse.json(
        { error: 'Invalid request body - config is required' },
        { status: 400 }
      )
    }

    // Add updated timestamp
    const configWithTimestamp = {
      ...config,
      updatedAt: new Date().toISOString()
    }

    // Check if setting exists
    const existing = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.section, SECTION_KEY))
      .limit(1)

    if (existing.length === 0) {
      // Insert new setting
      await db.insert(websiteSettings).values({
        section: SECTION_KEY,
        config: configWithTimestamp
      })
      console.log('[Hero Archway API] Created new configuration')
    } else {
      // Update existing setting
      await db
        .update(websiteSettings)
        .set({
          config: configWithTimestamp,
          updatedAt: new Date()
        })
        .where(eq(websiteSettings.section, SECTION_KEY))
      console.log('[Hero Archway API] Updated existing configuration')
    }

    // Revalidate the homepage so it fetches fresh hero settings
    revalidatePath('/')
    console.log('[Hero Archway API] Revalidated homepage cache')

    return NextResponse.json({
      success: true,
      config: configWithTimestamp
    })
  } catch (error) {
    console.error('[Hero Archway API] Error updating config:', error)
    return NextResponse.json(
      { error: 'Failed to update hero archway configuration', details: String(error) },
      { status: 500 }
    )
  }
}

// DELETE - Reset to default configuration
export async function DELETE() {
  try {
    await db
      .delete(websiteSettings)
      .where(eq(websiteSettings.section, SECTION_KEY))

    console.log('[Hero Archway API] Reset configuration to defaults')

    // Revalidate the homepage
    revalidatePath('/')

    return NextResponse.json({
      success: true,
      config: defaultHeroArchwayConfig
    })
  } catch (error) {
    console.error('[Hero Archway API] Error resetting config:', error)
    return NextResponse.json(
      { error: 'Failed to reset hero archway configuration', details: String(error) },
      { status: 500 }
    )
  }
}
